import {randomUUID} from 'node:crypto';
import {NetworkBudget} from '../ecosystem/transport';
import {DECISIONS, DecisionsError, decisionsConfiguration, type DecisionsConfiguration, type DecisionsConnectionStatus, type DecisionsDiscovery, type DecisionsReadResult} from '../integrations/decisions-contract';
import {decisionsMcpSession, decisionsSchemaDigest} from '../integrations/decisions-mcp';
import {decisionsStateHash, exchangeDecisionsToken, openDecisions, parseDecisionsCallback, prepareDecisionsAuthorization, sealDecisions, validateDecisionsPending, validateStoredDecisionsTokens, verifyDecisionsDiscovery, type DecisionsBinding, type DecisionsPending} from '../integrations/decisions-oauth';
import {inOrganizationTransaction, type Queryable} from './database';
import {lockOrganization, membership, uuid} from './service';

type Transaction = <T>(actor: string, work: (db: Queryable) => Promise<T>) => Promise<T>;
type ConnectionRow = {
  organization_id: string; subject_id: string; generation: string;
  state: 'DISCONNECTED' | 'AUTHORIZATION_PENDING' | 'AUTHORIZED' | 'REAUTHORIZATION_REQUIRED';
  credentials_ciphertext: string | null; access_expires_at: string | Date | null; authorized_at: string | Date | null;
  pending_state_hash: string | null; pending_ciphertext: string | null; pending_expires_at: string | Date | null;
  discovery: DecisionsDiscovery | null; last_discovered_at: string | Date | null;
};
type Dependencies = {transaction?: Transaction; configuration?: () => DecisionsConfiguration; budget?: () => NetworkBudget; now?: () => number};
const iso = (value: string | Date | null | undefined) => value ? new Date(value).toISOString() : null;
const binding = (row: ConnectionRow): DecisionsBinding => ({organizationId: row.organization_id, subject: row.subject_id, generation: row.generation});
const event = (db: Queryable, row: DecisionsBinding, kind: string, tool: string | null = null) => db.query(
  'INSERT INTO dis_organization_decisions_events(organization_id,subject_id,generation,kind,tool_name) VALUES($1,$2,$3,$4,$5)',
  [row.organizationId, row.subject, row.generation, kind, tool]);
async function memberLock(db: Queryable, org: string, actor: string) {
  // Reuse the same organization lock as membership changes. FOR SHARE on the
  // member table would incorrectly require its administrator-only UPDATE policy.
  await lockOrganization(db, org, actor, false);
  await db.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", ['dis-decisions:' + org + ':' + actor]);
}
async function connectionRow(db: Queryable, org: string, actor: string): Promise<ConnectionRow | undefined> {
  return (await db.query('SELECT * FROM dis_organization_decisions_connections WHERE organization_id=$1 AND subject_id=$2 FOR UPDATE', [org, actor])).rows[0];
}
async function loseAuthorization(db: Queryable, row: ConnectionRow) {
  await db.query("UPDATE dis_organization_decisions_connections SET state='REAUTHORIZATION_REQUIRED',credentials_ciphertext=NULL,access_expires_at=NULL,discovery=NULL,last_discovered_at=NULL,updated_at=now() WHERE organization_id=$1 AND subject_id=$2 AND generation=$3", [row.organization_id, row.subject_id, row.generation]);
  await event(db, binding(row), 'REAUTHORIZATION_REQUIRED');
}
function publicStatus(row: ConnectionRow | undefined, config: DecisionsConfiguration | null, now: number): DecisionsConnectionStatus {
  const base = {authorizedAt: iso(row?.authorized_at), lastDiscoveredAt: iso(row?.last_discovered_at), expiresAt: iso(row?.access_expires_at),
    tools: [], canStart: !!config, optional: true as const, sharing: 'PRIVATE_TO_CONNECTED_MEMBER' as const};
  if (!config) return {...base, state: 'NOT_CONFIGURED', message: 'This optional source is not configured. You can continue every native DIS planning step.'};
  if (!row || row.state === 'DISCONNECTED') return {...base, state: 'NOT_CONNECTED', message: 'Connect your own Decisions account if you want to inspect its available meeting sources.'};
  if (row.state === 'AUTHORIZATION_PENDING') return {...base, state: row.pending_expires_at && new Date(row.pending_expires_at).getTime() > now ? 'AUTHORIZATION_PENDING' : 'NOT_CONNECTED',
    expiresAt: iso(row.pending_expires_at), message: row.pending_expires_at && new Date(row.pending_expires_at).getTime() > now ? 'Complete the sign-in and consent in Decisions. No connection is confirmed yet.' : 'The connection request expired or was not completed. You may start again.'};
  if (row.state === 'REAUTHORIZATION_REQUIRED') return {...base, state: 'REAUTHORIZATION_REQUIRED', message: 'Reconnect your account to renew access. Your native DIS workspace remains available.'};
  const tools = (row.discovery?.tools || []).map(tool => ({...tool, readEnabled: tool.readOnlyHint === true && config.readAllowlist[tool.name] === decisionsSchemaDigest(tool.inputSchema)}));
  return {...base, tools, state: 'AUTHORIZED', message: row.last_discovered_at ? 'Your account authorized access and Decisions returned the capabilities shown below. No meeting content has been shared with your organization.' : 'Authorization was recorded. Inspect available capabilities to verify access; no meeting content has been retrieved.'};
}

/** A private, optional source adapter. It grants no DIS approval or organization-wide access. */
export function createDecisionsConnectionService(deps: Dependencies = {}) {
  const transaction = deps.transaction || inOrganizationTransaction, configuration = deps.configuration || decisionsConfiguration;
  const budget = deps.budget || (() => new NetworkBudget(10, 30000, 262144));
  const now = deps.now || Date.now;
  const status = async (actor: string, organizationId: unknown) => {
    const org = uuid(organizationId);
    return transaction(actor, async db => {
      await membership(db, org, actor);
      let config: DecisionsConfiguration;
      try { config = configuration(); }
      catch (error) { if (error instanceof DecisionsError && error.code === 'NOT_CONFIGURED') return publicStatus(undefined, null, now()); throw error; }
      const row = (await db.query('SELECT * FROM dis_organization_decisions_connections WHERE organization_id=$1 AND subject_id=$2', [org, actor])).rows[0] as ConnectionRow | undefined;
      return publicStatus(row, config, now());
    });
  };
  const start = async (actor: string, organizationId: unknown, consent: unknown) => {
    const org = uuid(organizationId);
    if (consent !== true) throw new DecisionsError('CONSENT_REQUIRED', 'Choose Connect to authorize your own optional Decisions source.', 400);
    const config = configuration();
    await transaction(actor, db => membership(db, org, actor));
    const metadata = await verifyDecisionsDiscovery(budget());
    const prepared = prepareDecisionsAuthorization(config, metadata.requireResponseIssuer, now());
    await transaction(actor, async db => {
      await memberLock(db, org, actor);
      const bound: DecisionsBinding = {organizationId: org, subject: actor, generation: randomUUID()};
      await db.query(`INSERT INTO dis_organization_decisions_connections(organization_id,subject_id,generation,state,pending_state_hash,pending_ciphertext,pending_expires_at)
        VALUES($1,$2,$3,'AUTHORIZATION_PENDING',$4,$5,$6)
        ON CONFLICT(organization_id,subject_id) DO UPDATE SET generation=EXCLUDED.generation,state=EXCLUDED.state,
          pending_state_hash=EXCLUDED.pending_state_hash,pending_ciphertext=EXCLUDED.pending_ciphertext,pending_expires_at=EXCLUDED.pending_expires_at,
          credentials_ciphertext=NULL,access_expires_at=NULL,authorized_at=NULL,discovery=NULL,last_discovered_at=NULL,updated_at=now()`,
        [org, actor, bound.generation, decisionsStateHash(prepared.pending.state), sealDecisions(prepared.pending, config, bound, 'pending'), prepared.pending.expiresAt]);
      await event(db, bound, 'AUTHORIZATION_STARTED');
    });
    return {authorizationUrl: prepared.authorizationUrl, expiresAt: prepared.pending.expiresAt};
  };
  const complete = async (actor: string, params: URLSearchParams): Promise<{organizationId: string; authorized: boolean}> => {
    const config = configuration(), response = parseDecisionsCallback(params);
    const consumed = await transaction(actor, async db => {
      const candidate = (await db.query('SELECT organization_id FROM dis_organization_decisions_connections WHERE subject_id=$1 AND pending_state_hash=$2', [actor, decisionsStateHash(response.state)])).rows[0];
      if (!candidate) throw new DecisionsError('STATE_UNAVAILABLE', 'This connection request is unavailable or was already used. Start again.', 400);
      await memberLock(db, candidate.organization_id, actor);
      const row = await connectionRow(db, candidate.organization_id, actor);
      if (!row || row.state !== 'AUTHORIZATION_PENDING' || row.pending_state_hash !== decisionsStateHash(response.state) || !row.pending_ciphertext) throw new DecisionsError('STATE_UNAVAILABLE', 'This connection request is unavailable or was already used. Start again.', 400);
      // State is consumed durably before any token request. Failed, expired and
      // denied callbacks cannot be retried to exchange the same authorization code.
      let pending: DecisionsPending | null = null;
      try { pending = validateDecisionsPending(openDecisions(row.pending_ciphertext, config, binding(row), 'pending'), response.state, response.issuer, config, now()); } catch { /* Consume invalid stored state, without exposing its contents. */ }
      await db.query("UPDATE dis_organization_decisions_connections SET state='DISCONNECTED',pending_state_hash=NULL,pending_ciphertext=NULL,pending_expires_at=NULL,updated_at=now() WHERE organization_id=$1 AND subject_id=$2 AND generation=$3", [row.organization_id, actor, row.generation]);
      await event(db, binding(row), 'AUTHORIZATION_CONSUMED');
      if (!pending || response.error) await event(db, binding(row), 'AUTHORIZATION_FAILED');
      return {row, pending: response.error ? null : pending};
    });
    if (!consumed.pending || !response.code) return {organizationId: consumed.row.organization_id, authorized: false};
    try {
      const tokens = await exchangeDecisionsToken(config, budget(), {code: response.code, pending: consumed.pending}, now());
      await transaction(actor, async db => {
        await memberLock(db, consumed.row.organization_id, actor);
        const row = await connectionRow(db, consumed.row.organization_id, actor);
        if (!row || row.generation !== consumed.row.generation || row.state !== 'DISCONNECTED') throw new DecisionsError('CONNECTION_CHANGED', 'The connection changed while authorization completed. Start again.', 409);
        await db.query("UPDATE dis_organization_decisions_connections SET state='AUTHORIZED',credentials_ciphertext=$4,access_expires_at=$5,authorized_at=$6,updated_at=now() WHERE organization_id=$1 AND subject_id=$2 AND generation=$3", [row.organization_id, actor, row.generation, sealDecisions(tokens, config, binding(row), 'tokens'), tokens.expiresAt, new Date(now()).toISOString()]);
        await event(db, binding(row), 'AUTHORIZED');
      });
      return {organizationId: consumed.row.organization_id, authorized: true};
    } catch {
      // Never surface a provider body, authorization code, state, or token.
      await transaction(actor, async db => {
        await memberLock(db, consumed.row.organization_id, actor);
        const row = await connectionRow(db, consumed.row.organization_id, actor);
        if (row?.generation === consumed.row.generation && row.state === 'DISCONNECTED') await event(db, binding(row), 'AUTHORIZATION_FAILED');
      }).catch(() => {});
      return {organizationId: consumed.row.organization_id, authorized: false};
    }
  };
  // Commit rotated refresh credentials before MCP work. A later read failure
  // must not roll back a successful refresh and strand its replaced token.
  const access = async (actor: string, org: string, config: DecisionsConfiguration, network: NetworkBudget) => {
    const result = await transaction(actor, async db => {
      await memberLock(db, org, actor);
      const row = await connectionRow(db, org, actor);
      if (!row || row.state !== 'AUTHORIZED' || !row.credentials_ciphertext) throw new DecisionsError('AUTHORIZATION_REQUIRED', 'Connect your Decisions account before inspecting this optional source.', 409);
      try {
        let tokens = validateStoredDecisionsTokens(openDecisions(row.credentials_ciphertext, config, binding(row), 'tokens'));
        if (Date.parse(tokens.expiresAt) <= now() + 30000) {
          tokens = await exchangeDecisionsToken(config, network, {previous: tokens}, now());
          await db.query('UPDATE dis_organization_decisions_connections SET credentials_ciphertext=$4,access_expires_at=$5,updated_at=now() WHERE organization_id=$1 AND subject_id=$2 AND generation=$3', [org, actor, row.generation, sealDecisions(tokens, config, binding(row), 'tokens'), tokens.expiresAt]);
          await event(db, binding(row), 'TOKEN_REFRESHED');
        }
        return {row, token: tokens.accessToken};
      } catch (error) {
        if (error instanceof DecisionsError && ['REAUTHORIZATION_REQUIRED', 'SAVED_CONNECTION_INVALID', 'SCOPE_DENIED', 'TOKEN_BINDING_INVALID', 'INVALID_TOKEN_RESPONSE'].includes(error.code)) {
          await loseAuthorization(db, row);
          return {error};
        }
        throw error;
      }
    });
    if ('error' in result) throw result.error;
    return result;
  };
  const inspect = async (actor: string, organizationId: unknown, read?: {tool: string; arguments: Record<string, unknown>}) => {
    const org = uuid(organizationId), config = configuration(), network = budget();
    if (read && (!/^[A-Za-z\d_.:-]{1,128}$/.test(read.tool) || !Object.hasOwn(config.readAllowlist, read.tool))) throw new DecisionsError('READ_NOT_REVIEWED', 'This source capability has not been approved for reading in DIS.', 403);
    if (read && (!read.arguments || typeof read.arguments !== 'object' || Array.isArray(read.arguments) || Buffer.byteLength(JSON.stringify(read.arguments)) > 32768)) throw new DecisionsError('READ_INPUT_INVALID', 'The read request exceeds its supported input boundary.', 400);
    const usable = await access(actor, org, config, network);
    if (read) await transaction(actor, async db => {
      await memberLock(db, org, actor);
      const row = await connectionRow(db, org, actor);
      if (!row || row.generation !== usable.row.generation || row.state !== 'AUTHORIZED') throw new DecisionsError('CONNECTION_CHANGED', 'The connection changed. Inspect it again.', 409);
      await event(db, binding(row), 'READ_STARTED', read.tool);
    });
    const result = await transaction(actor, async db => {
      await memberLock(db, org, actor);
      const row = await connectionRow(db, org, actor);
      if (!row || row.generation !== usable.row.generation || row.state !== 'AUTHORIZED') throw new DecisionsError('CONNECTION_CHANGED', 'The connection changed. Inspect it again.', 409);
      try {
        const session = await decisionsMcpSession(usable.token, config, network, now());
        await db.query('UPDATE dis_organization_decisions_connections SET discovery=$4::jsonb,last_discovered_at=$5,updated_at=now() WHERE organization_id=$1 AND subject_id=$2 AND generation=$3', [org, actor, row.generation, JSON.stringify(session.discovery), session.discovery.observedAt]);
        await event(db, binding(row), 'DISCOVERED');
        let value: DecisionsReadResult | undefined;
        if (read) {
          const content = await session.read(read.tool, read.arguments);
          value = {source: 'Decisions', resource: DECISIONS.resource, tool: read.tool, retrievedAt: new Date(now()).toISOString(), result: content, sharing: 'PRIVATE_TO_CONNECTED_MEMBER', sourceVerifiedByProvider: false};
          await event(db, binding(row), 'READ_RETURNED', read.tool);
        }
        return {connection: publicStatus({...row, discovery: session.discovery, last_discovered_at: session.discovery.observedAt}, config, now()), discovery: session.discovery, read: value};
      } catch (error) {
        if (error instanceof DecisionsError && error.code === 'REAUTHORIZATION_REQUIRED') await loseAuthorization(db, row);
        if (read) await event(db, binding(row), 'READ_FAILED', read.tool);
        return {error};
      }
    });
    if ('error' in result) throw result.error;
    return result;
  };
  const disconnect = async (actor: string, organizationId: unknown) => {
    const org = uuid(organizationId);
    await transaction(actor, async db => {
      await memberLock(db, org, actor);
      const row = await connectionRow(db, org, actor);
      if (!row) return;
      await db.query("UPDATE dis_organization_decisions_connections SET generation=$3,state='DISCONNECTED',credentials_ciphertext=NULL,access_expires_at=NULL,authorized_at=NULL,pending_state_hash=NULL,pending_ciphertext=NULL,pending_expires_at=NULL,discovery=NULL,last_discovered_at=NULL,updated_at=now() WHERE organization_id=$1 AND subject_id=$2", [org, actor, randomUUID()]);
      await event(db, binding(row), 'DISCONNECTED');
    });
    return status(actor, org);
  };
  return {status, start, complete, discover: (actor: string, org: unknown) => inspect(actor, org),
    read: (actor: string, org: unknown, tool: string, args: Record<string, unknown>) => inspect(actor, org, {tool, arguments: args}), disconnect};
}
export const decisionsConnections = createDecisionsConnectionService();
