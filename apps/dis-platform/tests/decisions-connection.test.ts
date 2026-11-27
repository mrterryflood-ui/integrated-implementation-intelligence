/** Synthetic provider responses only. These tests do not establish vendor client acceptance. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash, randomUUID} from 'node:crypto';
import {mkdtempSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {PGlite} from '@electric-sql/pglite';
import {NetworkBudget} from '../lib/ecosystem/transport';
import {DECISIONS, DECISIONS_STATE_TTL_MS, DecisionsError, decisionsClientMetadata, decisionsConfiguration} from '../lib/integrations/decisions-contract';
import {decisionsSchemaDigest, decisionsMcpSession} from '../lib/integrations/decisions-mcp';
import {decisionsStateHash, exchangeDecisionsToken, openDecisions, parseDecisionsCallback, prepareDecisionsAuthorization, sealDecisions, validateDecisionsPending, validateDecisionsTokens, verifyDecisionsDiscovery} from '../lib/integrations/decisions-oauth';
import {createDecisionsConnectionService} from '../lib/organizations/decisions-connection';
import {actOnOrganization} from '../lib/organizations/service';
import type {Queryable} from '../lib/organizations/database';

const ENV = {DIS_PUBLIC_ORIGIN: 'https://dis.synthetic.example', DIS_CONNECTOR_ENCRYPTION_KEY: '42'.repeat(32)};
const config = () => decisionsConfiguration(ENV);
const inputSchema = {type: 'object', properties: {meetingId: {type: 'string'}}, required: ['meetingId'], additionalProperties: false};
// Deliberately fictional names. No vendor tools are assumed or pre-approved.
const fixtureTools = () => [
  {name: 'fixture_read_meeting', title: 'SYNTHETIC read', inputSchema, annotations: {readOnlyHint: true, destructiveHint: false}},
  {name: 'fixture_publish_meeting', inputSchema, annotations: {readOnlyHint: false, destructiveHint: true}},
];
const resourceMetadata = () => ({resource: String(DECISIONS.resource), authorization_servers: [DECISIONS.issuer], bearer_methods_supported: ['header'], scopes_supported: [DECISIONS.scope, 'offline_access']});
const authMetadata = () => ({issuer: DECISIONS.issuer, authorization_endpoint: DECISIONS.authorization, token_endpoint: String(DECISIONS.token),
  client_id_metadata_document_supported: true, code_challenge_methods_supported: ['S256'], response_types_supported: ['code'],
  grant_types_supported: ['authorization_code', 'refresh_token'], token_endpoint_auth_methods_supported: ['none'], authorization_response_iss_parameter_supported: true});
function syntheticProvider() {
  const state = {requests: 0, tokenStatus: 200, mcpStatus: 200, tokenSequence: 0, tools: fixtureTools(), tokenForms: [] as URLSearchParams[], calls: [] as Record<string, unknown>[],
    resource: resourceMetadata(), authorization: authMetadata(), onToken: null as null | (() => Promise<void>), toolError: false};
  const fetcher: typeof fetch = async (input, init) => {
    state.requests++;
    const url = String(input);
    assert.equal(init?.redirect, 'error');
    assert.equal(init?.cache, 'no-store');
    if (url === DECISIONS.resourceMetadata) return Response.json(state.resource);
    if (url === DECISIONS.authorizationMetadata) return Response.json(state.authorization);
    if (url === DECISIONS.token) {
      state.tokenForms.push(new URLSearchParams(String(init?.body)));
      await state.onToken?.();
      if (state.tokenStatus !== 200) return Response.json({error: 'SYNTHETIC_denied'}, {status: state.tokenStatus});
      state.tokenSequence++;
      return Response.json({access_token: 'SYNTHETIC_access_' + state.tokenSequence, refresh_token: 'SYNTHETIC_refresh_' + state.tokenSequence, token_type: 'Bearer', expires_in: 3600, scope: DECISIONS.scope + ' offline_access'});
    }
    assert.equal(url, DECISIONS.resource, 'No synthetic request may leave the pinned contract');
    const headers = new Headers(init?.headers);
    assert.match(headers.get('authorization') || '', /^Bearer SYNTHETIC_access_/);
    if (state.mcpStatus !== 200) return Response.json({error: 'SYNTHETIC_unavailable'}, {status: state.mcpStatus});
    const body = JSON.parse(String(init?.body));
    if (body.method === 'notifications/initialized') return new Response(null, {status: 202});
    const result = body.method === 'initialize' ? {protocolVersion: '2025-06-18', serverInfo: {name: 'SYNTHETIC Decisions fixture', version: '1.0'}, capabilities: {tools: {}}} :
      body.method === 'tools/list' ? {tools: state.tools} : {isError: state.toolError, content: [{type: 'text', text: 'SYNTHETIC meeting content'}]};
    if (body.method === 'tools/call') state.calls.push(body.params);
    else assert.ok(['initialize', 'tools/list'].includes(body.method), 'No write or registration method may be invoked');
    return Response.json({jsonrpc: '2.0', id: body.id, result}, {headers: {'Mcp-Session-Id': 'SYNTHETIC-session'}});
  };
  return {state, fetcher, budget: () => new NetworkBudget(10, 30000, 262144, fetcher)};
}
const isCode = (code: string) => (error: unknown) => error instanceof DecisionsError && error.code === code;

test('Decisions configuration requires HTTPS, a 256-bit storage key, and exact reviewed schema pins', () => {
  assert.equal(config().clientId, ENV.DIS_PUBLIC_ORIGIN + '/api/integrations/decisions/client');
  for (const origin of ['http://dis.synthetic.example', 'https://localhost', 'https://127.0.0.1', 'https://dis.synthetic.example/path', 'https://user:pass@dis.synthetic.example', 'https://dis.synthetic.example:8443']) assert.throws(() => decisionsConfiguration({...ENV, DIS_PUBLIC_ORIGIN: origin}), isCode('NOT_CONFIGURED'));
  for (const key of ['', 'password', '42'.repeat(31)]) assert.throws(() => decisionsConfiguration({...ENV, DIS_CONNECTOR_ENCRYPTION_KEY: key}), isCode('NOT_CONFIGURED'));
  assert.throws(() => decisionsConfiguration({...ENV, DIS_DECISIONS_READ_TOOL_ALLOWLIST: '["fixture_read_meeting"]'}), isCode('NOT_CONFIGURED'));
  const metadata = decisionsClientMetadata(config());
  assert.equal(metadata.token_endpoint_auth_method, 'none');
  assert.deepEqual(metadata.redirect_uris, [config().redirectUri]);
  assert.ok(!JSON.stringify(metadata).includes(ENV.DIS_CONNECTOR_ENCRYPTION_KEY));
});

test('Decisions encryption authenticates subject, organization, generation and secret purpose', () => {
  const bound = {organizationId: randomUUID(), subject: 'synthetic-alice', generation: randomUUID()};
  const sealed = sealDecisions({secret: 'SYNTHETIC_token'}, config(), bound, 'tokens');
  assert.ok(!sealed.includes('SYNTHETIC_token'));
  assert.deepEqual(openDecisions(sealed, config(), bound, 'tokens'), {secret: 'SYNTHETIC_token'});
  for (const wrong of [{...bound, subject: 'synthetic-bob'}, {...bound, organizationId: randomUUID()}, {...bound, generation: randomUUID()}]) assert.throws(() => openDecisions(sealed, config(), wrong, 'tokens'), isCode('SAVED_CONNECTION_INVALID'));
  assert.throws(() => openDecisions(sealed, config(), bound, 'pending'), isCode('SAVED_CONNECTION_INVALID'));
  const parts = sealed.split('.'); parts[3] = (parts[3][0] === 'A' ? 'B' : 'A') + parts[3].slice(1);
  assert.throws(() => openDecisions(parts.join('.'), config(), bound, 'tokens'), isCode('SAVED_CONNECTION_INVALID'));
});

test('Decisions OAuth pins discovery, S256 PKCE, callback issuer, resource and scope', async () => {
  const provider = syntheticProvider();
  assert.deepEqual(await verifyDecisionsDiscovery(provider.budget()), {requireResponseIssuer: true});
  provider.state.authorization.token_endpoint = 'https://evil.synthetic.example/token';
  await assert.rejects(verifyDecisionsDiscovery(provider.budget()), isCode('DISCOVERY_CHANGED'));
  provider.state.authorization = authMetadata(); provider.state.resource.resource = 'https://evil.synthetic.example/mcp';
  await assert.rejects(verifyDecisionsDiscovery(provider.budget()), isCode('DISCOVERY_CHANGED'));
  provider.state.resource = resourceMetadata(); provider.state.authorization.client_id_metadata_document_supported = false;
  await assert.rejects(verifyDecisionsDiscovery(provider.budget()), isCode('DISCOVERY_CHANGED'));
  const time = Date.now(), prepared = prepareDecisionsAuthorization(config(), true, time), url = new URL(prepared.authorizationUrl);
  assert.equal(url.origin + url.pathname, DECISIONS.authorization);
  assert.equal(url.searchParams.get('code_challenge'), createHash('sha256').update(prepared.pending.verifier).digest('base64url'));
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(url.searchParams.get('resource'), DECISIONS.resource);
  assert.equal(url.searchParams.get('client_id'), config().clientId);
  assert.ok(!url.href.includes(prepared.pending.verifier));
  const params = new URLSearchParams({state: prepared.pending.state, code: 'SYNTHETIC-code', iss: DECISIONS.issuer});
  assert.equal(parseDecisionsCallback(params).state, prepared.pending.state);
  assert.equal(validateDecisionsPending(prepared.pending, prepared.pending.state, DECISIONS.issuer, config(), time).verifier, prepared.pending.verifier);
  assert.throws(() => validateDecisionsPending(prepared.pending, prepared.pending.state, null, config(), time), isCode('EXPIRED_STATE'));
  assert.throws(() => validateDecisionsPending(prepared.pending, prepared.pending.state, DECISIONS.issuer, config(), time + DECISIONS_STATE_TTL_MS), isCode('EXPIRED_STATE'));
  params.append('code', 'SYNTHETIC-duplicate'); assert.throws(() => parseDecisionsCallback(params), isCode('INVALID_CALLBACK'));
  params.delete('code'); params.set('code', 'SYNTHETIC-code'); params.set('iss', 'https://evil.synthetic.example'); assert.throws(() => parseDecisionsCallback(params), isCode('INVALID_CALLBACK'));
  const token = {access_token: 'SYNTHETIC_token', token_type: 'Bearer', expires_in: 3600, scope: DECISIONS.scope};
  assert.equal(validateDecisionsTokens(token, null).accessToken, 'SYNTHETIC_token');
  assert.throws(() => validateDecisionsTokens({...token, scope: 'unknown'}, null), isCode('SCOPE_DENIED'));
  assert.throws(() => validateDecisionsTokens({...token, resource: 'https://evil.synthetic.example'}, null), isCode('TOKEN_BINDING_INVALID'));
  assert.throws(() => validateDecisionsTokens({...token, issuer: 'https://evil.synthetic.example'}, null), isCode('TOKEN_BINDING_INVALID'));
  assert.throws(() => validateDecisionsTokens({...token, expires_in: 1000000}, null), isCode('INVALID_TOKEN_RESPONSE'));
  const tokens = await exchangeDecisionsToken(config(), provider.budget(), {code: 'SYNTHETIC-code', pending: prepared.pending});
  assert.match(tokens.accessToken, /^SYNTHETIC_access_/);
  assert.equal(provider.state.tokenForms[0].get('code_verifier'), prepared.pending.verifier);
  assert.equal(provider.state.tokenForms[0].get('resource'), DECISIONS.resource);
  assert.equal(provider.state.tokenForms[0].get('client_secret'), null);
});

test('Decisions MCP discovery is bounded and calls require both advertised read-only intent and a reviewed schema pin', async () => {
  const provider = syntheticProvider(), initial = await decisionsMcpSession('SYNTHETIC_access_1', config(), provider.budget());
  assert.equal(initial.discovery.tools.length, 2);
  assert.ok(initial.discovery.tools.every(tool => !tool.readEnabled));
  await assert.rejects(initial.read('fixture_read_meeting', {meetingId: 'fixture'}), isCode('READ_NOT_REVIEWED'));
  const configured = {...config(), readAllowlist: {'fixture_read_meeting': decisionsSchemaDigest(inputSchema), 'fixture_publish_meeting': decisionsSchemaDigest(inputSchema)}};
  const session = await decisionsMcpSession('SYNTHETIC_access_1', configured, provider.budget());
  assert.equal(session.discovery.tools[0].readEnabled, true);
  assert.equal(session.discovery.tools[1].readEnabled, false);
  assert.ok((await session.read('fixture_read_meeting', {meetingId: 'fixture'})).content);
  await assert.rejects(session.read('fixture_publish_meeting', {meetingId: 'fixture'}), isCode('READ_NOT_REVIEWED'));
  await assert.rejects(session.read('fixture_read_meeting', {meetingId: 'x'.repeat(40000)}), isCode('READ_INPUT_INVALID'));
  provider.state.tools[0].inputSchema = {...inputSchema, properties: {meetingId: {type: 'number'}}};
  const changed = await decisionsMcpSession('SYNTHETIC_access_1', configured, provider.budget());
  await assert.rejects(changed.read('fixture_read_meeting', {meetingId: 'fixture'}), isCode('READ_NOT_REVIEWED'));
  assert.equal(provider.state.calls.length, 1);
  assert.equal(decisionsSchemaDigest({type: 'object', properties: {a: {type: 'string'}, b: {type: 'number'}}}), decisionsSchemaDigest({properties: {b: {type: 'number'}, a: {type: 'string'}}, type: 'object'}));
  provider.state.tools = [...fixtureTools(), fixtureTools()[0]];
  await assert.rejects(decisionsMcpSession('SYNTHETIC_access_1', configured, provider.budget()), isCode('TOOL_DUPLICATE'));
  const redirect: typeof fetch = async () => { const response = Response.json({}); Object.defineProperty(response, 'redirected', {value: true}); return response; };
  await assert.rejects(verifyDecisionsDiscovery(new NetworkBudget(4, 1000, 1024, redirect)), /unexpected origin/);
  const oversize: typeof fetch = async () => new Response('x'.repeat(1025));
  await assert.rejects(verifyDecisionsDiscovery(new NetworkBudget(4, 1000, 1024, oversize)), /size budget/);
  const timeout: typeof fetch = async (_input, init) => new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(Error('synthetic abort')), {once: true}));
  await assert.rejects(verifyDecisionsDiscovery(new NetworkBudget(4, 30, 1024, timeout)), /bounded time/);
});

test('actual Decisions SQL/service lifecycle: private RLS, durable state consumption, refresh, replay, revocation and restart', async t => {
  const directory = mkdtempSync(join(tmpdir(), 'dis-decisions-synthetic-'));
  let db = new PGlite(directory); await db.waitReady;
  t.after(async () => { await db.close(); rmSync(directory, {recursive: true, force: true}); });
  await db.exec('CREATE ROLE dis_app_safe NOLOGIN;');
  await db.exec(readFileSync('db/003_organization_workflow.sql', 'utf8'));
  await db.exec(readFileSync('db/005_decisions_connections.sql', 'utf8'));
  async function as<T>(actor: string, work: (q: Queryable) => Promise<T>): Promise<T> {
    await db.exec('BEGIN; SET LOCAL ROLE dis_app_safe;');
    try { await db.query("SELECT set_config('dis.subject_id',$1,true)", [actor]); const value = await work(db as Queryable); await db.exec('COMMIT'); return value; }
    catch (error) { await db.exec('ROLLBACK'); throw error; }
  }
  const act = (actor: string, body: Record<string, unknown>) => as(actor, q => actOnOrganization(q, actor, body));
  const a = await act('synthetic-admin', {action: 'create', name: 'SYNTHETIC team A', displayName: 'Synthetic administrator'});
  const b = await act('synthetic-other', {action: 'create', name: 'SYNTHETIC team B', displayName: 'Other synthetic administrator'});
  await act('synthetic-member', {action: 'request-membership', organizationId: a.id, displayName: 'Synthetic member', note: 'TEST FIXTURE'});
  await act('synthetic-admin', {action: 'admit-member', organizationId: a.id, subject: 'synthetic-member', role: 'contributor'});
  await act('synthetic-member', {action: 'request-membership', organizationId: b.id, displayName: 'Synthetic member', note: 'TEST FIXTURE'});
  await act('synthetic-other', {action: 'admit-member', organizationId: b.id, subject: 'synthetic-member', role: 'viewer'});
  const provider = syntheticProvider(); let clock = Date.now(), currentConfig = config();
  const service = createDecisionsConnectionService({transaction: as, configuration: () => currentConfig, budget: provider.budget, now: () => clock});
  const callback = (authorizationUrl: string) => new URLSearchParams({state: new URL(authorizationUrl).searchParams.get('state')!, code: 'SYNTHETIC-code', iss: DECISIONS.issuer});
  const connect = async (org = a.id) => { const begun = await service.start('synthetic-member', org, true); return service.complete('synthetic-member', callback(begun.authorizationUrl)); };

  await t.test('native membership remains independent and missing configuration is honest', async () => {
    const missing = createDecisionsConnectionService({transaction: as, configuration: () => decisionsConfiguration({})});
    assert.equal((await missing.status('synthetic-member', a.id)).state, 'NOT_CONFIGURED');
    await assert.rejects(missing.status('synthetic-stranger', a.id), /not available/);
    assert.equal((await service.status('synthetic-member', a.id)).state, 'NOT_CONNECTED');
    await assert.rejects(service.start('synthetic-member', a.id, false), isCode('CONSENT_REQUIRED'));
    await assert.rejects(service.start('synthetic-stranger', a.id, true), /not available/);
    assert.equal(provider.state.requests, 0);
  });
  await t.test('PKCE state is encrypted; private connections are invisible even to another member who is an administrator', async () => {
    const begun = await service.start('synthetic-member', a.id, true), params = callback(begun.authorizationUrl);
    const row = (await as('synthetic-member', q => q.query('SELECT * FROM dis_organization_decisions_connections WHERE organization_id=$1', [a.id]))).rows[0];
    assert.equal(row.pending_state_hash, decisionsStateHash(params.get('state')!));
    assert.ok(!row.pending_ciphertext.includes(params.get('state')));
    assert.equal((await as('synthetic-admin', q => q.query('SELECT * FROM dis_organization_decisions_connections'))).rows.length, 0);
    assert.equal((await as('synthetic-stranger', q => q.query('SELECT * FROM dis_organization_decisions_connections'))).rows.length, 0);
    await assert.rejects(service.complete('synthetic-admin', params), isCode('STATE_UNAVAILABLE'));
    provider.state.onToken = async () => {
      const saved = (await as('synthetic-member', q => q.query('SELECT pending_state_hash,pending_ciphertext FROM dis_organization_decisions_connections WHERE organization_id=$1', [a.id]))).rows[0];
      assert.equal(saved.pending_state_hash, null); assert.equal(saved.pending_ciphertext, null);
    };
    assert.equal((await service.complete('synthetic-member', params)).authorized, true);
    provider.state.onToken = null;
    await assert.rejects(service.complete('synthetic-member', params), isCode('STATE_UNAVAILABLE'));
    const status = await service.status('synthetic-member', a.id);
    assert.equal(status.state, 'AUTHORIZED'); assert.equal(status.lastDiscoveredAt, null);
    assert.ok(!JSON.stringify(status).includes('SYNTHETIC_access'));
    const persisted = (await as('synthetic-member', q => q.query('SELECT credentials_ciphertext FROM dis_organization_decisions_connections WHERE organization_id=$1', [a.id]))).rows[0];
    assert.ok(!persisted.credentials_ciphertext.includes('SYNTHETIC_'));
  });
  await t.test('discovery does not authorize calls, write tools stay denied, and actual permitted reads retain private provenance', async () => {
    const found = await service.discover('synthetic-member', a.id);
    assert.equal(found.discovery.tools.length, 2); assert.ok(found.discovery.tools.every(tool => !tool.readEnabled));
    assert.equal(provider.state.calls.length, 0);
    await assert.rejects(service.read('synthetic-member', a.id, 'fixture_read_meeting', {meetingId: 'test'}), isCode('READ_NOT_REVIEWED'));
    currentConfig = {...config(), readAllowlist: {'fixture_read_meeting': decisionsSchemaDigest(inputSchema), 'fixture_publish_meeting': decisionsSchemaDigest(inputSchema)}};
    assert.equal((await service.status('synthetic-member', a.id)).tools[0].readEnabled, true);
    const read = await service.read('synthetic-member', a.id, 'fixture_read_meeting', {meetingId: 'test'});
    assert.equal(read.read?.sharing, 'PRIVATE_TO_CONNECTED_MEMBER'); assert.equal(read.read?.sourceVerifiedByProvider, false);
    assert.match(JSON.stringify(read.read?.result), /SYNTHETIC meeting content/);
    await assert.rejects(service.read('synthetic-member', a.id, 'fixture_publish_meeting', {meetingId: 'test'}), isCode('READ_NOT_REVIEWED'));
    assert.equal(provider.state.calls.length, 1);
    const events = (await as('synthetic-member', q => q.query('SELECT kind,tool_name FROM dis_organization_decisions_events WHERE organization_id=$1', [a.id]))).rows;
    assert.ok(events.some(row => row.kind === 'READ_STARTED')); assert.ok(events.some(row => row.kind === 'READ_RETURNED'));
    assert.ok(!JSON.stringify(events).includes('SYNTHETIC meeting content'));
    assert.equal((await as('synthetic-admin', q => q.query('SELECT * FROM dis_organization_decisions_events'))).rows.length, 0);
    await assert.rejects(as('synthetic-member', q => q.query("UPDATE dis_organization_decisions_events SET kind='AUTHORIZED'")), /permission denied/);
    await assert.rejects(as('synthetic-member', q => q.query('DELETE FROM dis_organization_decisions_events')), /permission denied/);
  });
  await t.test('a successful token rotation survives later MCP failure', async () => {
    clock += 3600 * 1000;
    provider.state.mcpStatus = 500;
    await assert.rejects(service.discover('synthetic-member', a.id), isCode('MCP_UNAVAILABLE'));
    const before = provider.state.tokenForms.length;
    assert.equal(provider.state.tokenForms.at(-1)?.get('grant_type'), 'refresh_token');
    provider.state.mcpStatus = 200;
    await service.discover('synthetic-member', a.id);
    assert.equal(provider.state.tokenForms.length, before, 'The rotated token was retained despite the failed discovery');
  });
  await t.test('encrypted records survive an actual database restart', async () => {
    await db.close(); db = new PGlite(directory); await db.waitReady;
    assert.equal((await service.status('synthetic-member', a.id)).state, 'AUTHORIZED');
    assert.equal((await service.discover('synthetic-member', a.id)).discovery.server.name, 'SYNTHETIC Decisions fixture');
  });
  await t.test('read-only organization members can authorize their own private source and cross-organization ciphertext reuse fails', async () => {
    assert.equal((await connect(b.id)).authorized, true);
    const arow = (await as('synthetic-member', q => q.query('SELECT credentials_ciphertext FROM dis_organization_decisions_connections WHERE organization_id=$1', [a.id]))).rows[0];
    await as('synthetic-member', q => q.query('UPDATE dis_organization_decisions_connections SET credentials_ciphertext=$2 WHERE organization_id=$1', [b.id, arow.credentials_ciphertext]));
    await assert.rejects(service.discover('synthetic-member', b.id), isCode('SAVED_CONNECTION_INVALID'));
    assert.equal((await service.status('synthetic-member', b.id)).state, 'REAUTHORIZATION_REQUIRED');
  });
  await t.test('provider denial consumes state; refresh rejection removes usable credentials', async () => {
    const begun = await service.start('synthetic-member', b.id, true), denied = callback(begun.authorizationUrl), count = provider.state.tokenForms.length;
    denied.delete('code'); denied.set('error', 'access_denied');
    assert.equal((await service.complete('synthetic-member', denied)).authorized, false);
    assert.equal(provider.state.tokenForms.length, count);
    await assert.rejects(service.complete('synthetic-member', denied), isCode('STATE_UNAVAILABLE'));
    clock += 3600 * 1000; provider.state.tokenStatus = 400;
    await assert.rejects(service.discover('synthetic-member', a.id), isCode('REAUTHORIZATION_REQUIRED'));
    assert.equal((await service.status('synthetic-member', a.id)).state, 'REAUTHORIZATION_REQUIRED');
    const row = (await as('synthetic-member', q => q.query('SELECT credentials_ciphertext FROM dis_organization_decisions_connections WHERE organization_id=$1', [a.id]))).rows[0];
    assert.equal(row.credentials_ciphertext, null); provider.state.tokenStatus = 200;
  });
  await t.test('expired state and token-exchange failure are one-use failures; disconnect invalidates an outstanding callback', async () => {
    const begun = await service.start('synthetic-member', a.id, true), params = callback(begun.authorizationUrl), count = provider.state.tokenForms.length;
    clock += DECISIONS_STATE_TTL_MS + 1;
    assert.equal((await service.complete('synthetic-member', params)).authorized, false);
    assert.equal(provider.state.tokenForms.length, count);
    await assert.rejects(service.complete('synthetic-member', params), isCode('STATE_UNAVAILABLE'));
    const failed = await service.start('synthetic-member', a.id, true); provider.state.tokenStatus = 400;
    assert.equal((await service.complete('synthetic-member', callback(failed.authorizationUrl))).authorized, false);
    await assert.rejects(service.complete('synthetic-member', callback(failed.authorizationUrl)), isCode('STATE_UNAVAILABLE'));
    provider.state.tokenStatus = 200;
    const later = await service.start('synthetic-member', a.id, true);
    await service.disconnect('synthetic-member', a.id);
    await assert.rejects(service.complete('synthetic-member', callback(later.authorizationUrl)), isCode('STATE_UNAVAILABLE'));
    assert.equal((await service.status('synthetic-member', a.id)).state, 'NOT_CONNECTED');
  });
  await t.test('revoked membership denies both service access and direct database reads/writes', async () => {
    await connect();
    await act('synthetic-admin', {action: 'revoke-member', organizationId: a.id, subject: 'synthetic-member'});
    const before = provider.state.requests;
    await assert.rejects(service.discover('synthetic-member', a.id), /not available/);
    await assert.rejects(service.status('synthetic-member', a.id), /not available/);
    assert.equal(provider.state.requests, before);
    assert.equal((await as('synthetic-member', q => q.query('SELECT * FROM dis_organization_decisions_connections WHERE organization_id=$1', [a.id]))).rows.length, 0);
    assert.equal((await as('synthetic-member', q => q.query('SELECT * FROM dis_organization_decisions_events WHERE organization_id=$1', [a.id]))).rows.length, 0);
    const update = await as('synthetic-member', q => q.query("UPDATE dis_organization_decisions_connections SET state='DISCONNECTED' WHERE organization_id=$1 RETURNING organization_id", [a.id]));
    assert.equal(update.rows.length, 0);
    await assert.rejects(as('synthetic-member', q => q.query("INSERT INTO dis_organization_decisions_events(organization_id,subject_id,generation,kind) VALUES($1,$2,$3,'AUTHORIZED')", [a.id, 'synthetic-member', randomUUID()])), /row-level security/);
  });
});
