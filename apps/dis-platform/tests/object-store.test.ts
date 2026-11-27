/** Real SDK serialization + local PostgreSQL. All provider objects/credentials are synthetic. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash, randomUUID} from 'node:crypto';
import {existsSync, readFileSync, readdirSync, statSync, mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Readable} from 'node:stream';
import {PGlite} from '@electric-sql/pglite';
import {createRailwayObjectStore, isRailwayObjectPath, ObjectStoreError, railwayStorageConfiguration, railwayStorageConfigured, spoolPrivateOriginal, validateRailwayObjectPath} from '../lib/organizations/object-store';
import {createOrganizationObjectUpload} from '../lib/organizations/object-upload';
import {actOnOrganization, lockOrganization} from '../lib/organizations/service';
import {reserveOriginal} from '../lib/organizations/storage';
import type {Queryable} from '../lib/organizations/database';

const ENV = {DIS_OBJECT_STORAGE_PROVIDER: 'railway', DIS_S3_ENDPOINT: 'https://t3.storageapi.dev', DIS_S3_BUCKET: 'synthetic-private-bucket', DIS_S3_REGION: 'auto', DIS_S3_ACCESS_KEY_ID: 'SYNTHETIC_ACCESS_KEY', DIS_S3_SECRET_ACCESS_KEY: 'SYNTHETIC_SECRET_DO_NOT_USE', DIS_S3_URL_STYLE: 'virtual'};
const configuration = () => railwayStorageConfiguration(ENV);
const objectPath = () => 'railway/dis/' + randomUUID() + '/synthetic.txt';
const hash = (data: Uint8Array) => createHash('sha256').update(data).digest('hex');
const stream = (bytes: Uint8Array) => new ReadableStream<Uint8Array>({start(controller) {controller.enqueue(bytes); controller.close();}});
const code = (value: string) => (error: unknown) => error instanceof ObjectStoreError && error.code === value;
type Stored = {bytes: Buffer; headers: Record<string, string>};
function syntheticStorage() {
  const objects = new Map<string, Stored>();
  const state = {requests: 0, puts: 0, deletes: 0, failHead: false, corruptGet: false, beforePutReturn: null as null | (() => Promise<void>), lastPut: null as null | Record<string, string>};
  const handler = {
    metadata: {handlerProtocol: 'http/1.1'}, destroy() {},
    async handle(request: any) {
      state.requests++;
      assert.equal(request.protocol, 'https:'); assert.equal(request.hostname, ENV.DIS_S3_BUCKET + '.t3.storageapi.dev');
      const headers = Object.fromEntries(Object.entries(request.headers).map(([key, value]) => [key.toLowerCase(), String(value)]));
      assert.match(headers.authorization || '', /^AWS4-HMAC-SHA256 /);
      const path = decodeURIComponent(request.path.slice(1)); validateRailwayObjectPath(path);
      const response = (statusCode: number, responseHeaders: Record<string, string> = {}, bytes: Buffer[] = []) => ({response: {statusCode, headers: responseHeaders, body: Readable.from(bytes)}});
      const failure = (status: number, name: string) => response(status, {'content-type': 'application/xml'}, [Buffer.from('<Error><Code>' + name + '</Code><Message>SYNTHETIC failure</Message></Error>')]);
      if (request.method === 'PUT') {
        state.puts++; state.lastPut = headers;
        assert.equal(headers['if-none-match'], '*'); assert.equal(headers['x-amz-acl'], 'private');
        assert.equal(headers['x-amz-meta-dis-scan-state'], 'NOT_SCANNED');
        if (objects.has(path)) return failure(412, 'PreconditionFailed');
        const parts: Buffer[] = [];
        if (typeof request.body === 'string' || request.body instanceof Uint8Array) parts.push(Buffer.from(request.body));
        else for await (const part of request.body) parts.push(Buffer.from(part));
        const bytes = Buffer.concat(parts);
        assert.equal(bytes.length, Number(headers['content-length'])); assert.equal(hash(bytes), headers['x-amz-meta-dis-sha256']);
        assert.equal(Buffer.from(hash(bytes), 'hex').toString('base64'), headers['x-amz-checksum-sha256']);
        const savedHeaders = {'content-length': String(bytes.length), 'content-type': headers['content-type'], 'x-amz-meta-dis-sha256': hash(bytes), 'x-amz-meta-dis-byte-size': String(bytes.length), 'x-amz-meta-dis-scan-state': 'NOT_SCANNED', 'x-amz-checksum-sha256': headers['x-amz-checksum-sha256']};
        objects.set(path, {bytes, headers: savedHeaders});
        await state.beforePutReturn?.();
        return response(200, {'x-amz-checksum-sha256': savedHeaders['x-amz-checksum-sha256']});
      }
      if (request.method === 'HEAD' && state.failHead) {state.failHead = false; return failure(503, 'ServiceUnavailable');}
      const saved = objects.get(path);
      if (!saved) return failure(404, 'NoSuchKey');
      if (request.method === 'HEAD') return response(200, saved.headers);
      if (request.method === 'GET') {
        const bytes = state.corruptGet ? Buffer.alloc(saved.bytes.length, 120) : saved.bytes;
        const split = Math.max(1, Math.floor(bytes.length / 2)); return response(200, saved.headers, [bytes.subarray(0, split), bytes.subarray(split)]);
      }
      if (request.method === 'DELETE') {state.deletes++; objects.delete(path); return response(204);}
      throw Error('Unexpected synthetic storage method');
    },
  };
  return {state, objects, store: createRailwayObjectStore({configuration, requestHandler: handler})};
}

test('Railway object configuration and keys deny alternate hosts, traversal and legacy relabeling', () => {
  assert.equal(railwayStorageConfigured(ENV), true); assert.equal(railwayStorageConfigured({}), false);
  for (const endpoint of ['http://t3.storageapi.dev', 'https://evil.example', 'https://t3.storageapi.dev.evil.example', 'https://user:pass@t3.storageapi.dev', 'https://t3.storageapi.dev/path', 'https://t3.storageapi.dev:8443']) assert.throws(() => railwayStorageConfiguration({...ENV, DIS_S3_ENDPOINT: endpoint}));
  assert.throws(() => railwayStorageConfiguration({...ENV, DIS_S3_BUCKET: '../public'}));
  assert.throws(() => railwayStorageConfiguration({...ENV, DIS_S3_URL_STYLE: 'unknown'}));
  validateRailwayObjectPath(objectPath());
  for (const path of ['organizations/' + randomUUID() + '/test.pdf', 'https://t3.storageapi.dev/bucket/key', 'railway/dis/' + randomUUID() + '/../secret', 'railway/dis/' + randomUUID() + '/%2e%2e', 'railway/dis/' + randomUUID() + '/..']) assert.throws(() => validateRailwayObjectPath(path), code('STORAGE_PATH_INVALID'));
  assert.equal(isRailwayObjectPath('organizations/legacy/record'), false);
});

test('private spools enforce actual bytes, preserve SHA-256, use private permissions, and clean failed/aborted uploads', async () => {
  const bytes = Buffer.from('SYNTHETIC document');
  const spool = await spoolPrivateOriginal(stream(bytes), bytes.length);
  assert.equal(spool.sha256, hash(bytes)); assert.equal(statSync(spool.path).mode & 0o777, 0o600); assert.equal(statSync(join(spool.path, '..')).mode & 0o777, 0o700);
  assert.deepEqual(readFileSync(spool.path), bytes); await spool.cleanup(); assert.equal(existsSync(spool.path), false);
  const before = readdirSync(tmpdir()).filter(name => name.startsWith('dis-private-original-')).sort();
  await assert.rejects(spoolPrivateOriginal(stream(bytes), bytes.length - 1), code('UPLOAD_SIZE_INVALID'));
  await assert.rejects(spoolPrivateOriginal(stream(bytes), bytes.length + 1), code('UPLOAD_INCOMPLETE'));
  const stalled = new ReadableStream<Uint8Array>({start(controller) {controller.enqueue(Buffer.from('x'));}});
  await assert.rejects(spoolPrivateOriginal(stalled, 2, {timeoutMs: 25}), code('UPLOAD_ABORTED'));
  assert.deepEqual(readdirSync(tmpdir()).filter(name => name.startsWith('dis-private-original-')).sort(), before);
});

test('real AWS SDK sends private immutable PUT and verifies HEAD, full GET and owner-requested deletion through synthetic transport', async () => {
  const fixture = syntheticStorage(), path = objectPath(), bytes = Buffer.from('SYNTHETIC private original');
  const receipt = await fixture.store.putBytes(path, bytes, 'text/plain');
  assert.equal(receipt.sha256, hash(bytes)); assert.equal(receipt.size, bytes.length);
  assert.equal(fixture.state.lastPut?.['x-amz-acl'], 'private');
  const found = await fixture.store.get(path, receipt);
  assert.deepEqual(Buffer.from(await new Response(found.stream).arrayBuffer()), bytes);
  await assert.rejects(fixture.store.putBytes(path, Buffer.from('DIFFERENT'), 'text/plain'), code('OBJECT_ALREADY_EXISTS'));
  assert.deepEqual(fixture.objects.get(path)?.bytes, bytes); assert.equal(fixture.state.deletes, 0);
  await assert.rejects(fixture.store.get(path, {...receipt, sha256: 'f'.repeat(64)}), code('OBJECT_CHANGED'));
  fixture.state.corruptGet = true;
  const corrupted = await fixture.store.get(path, receipt);
  await assert.rejects(new Response(corrupted.stream).arrayBuffer());
  fixture.state.corruptGet = false;
  await fixture.store.remove(path); assert.equal(fixture.objects.has(path), false);
  assert.equal(fixture.state.deletes, 1);
});

test('a lost provider receipt retains the immutable object for explicit verification without blind deletion', async () => {
  const fixture = syntheticStorage(), path = objectPath(), bytes = Buffer.from('SYNTHETIC retained original');
  fixture.state.failHead = true;
  await assert.rejects(fixture.store.putBytes(path, bytes, 'text/plain'), code('STORAGE_UNAVAILABLE'));
  assert.equal(fixture.state.puts, 1); assert.equal(fixture.state.deletes, 0);
  const receipt = await fixture.store.head(path); assert.equal(receipt.sha256, hash(bytes));
  await assert.rejects(fixture.store.putBytes(path, bytes, 'text/plain'), code('OBJECT_ALREADY_EXISTS'));
  assert.equal(fixture.state.deletes, 0);
});

test('actual upload reservation/RLS lifecycle retains quota and fingerprint across uncertain storage completion', async t => {
  const directory = mkdtempSync(join(tmpdir(), 'dis-storage-synthetic-'));
  const db = new PGlite(directory); await db.waitReady;
  t.after(async () => {await db.close(); rmSync(directory, {recursive: true, force: true});});
  await db.exec('CREATE ROLE dis_app_safe NOLOGIN;'); await db.exec(readFileSync('db/003_organization_workflow.sql', 'utf8'));
  async function as<T>(actor: string, work: (q: Queryable) => Promise<T>): Promise<T> {
    await db.exec('BEGIN; SET LOCAL ROLE dis_app_safe;');
    try {await db.query("SELECT set_config('dis.subject_id',$1,true)", [actor]); const value = await work(db as Queryable); await db.exec('COMMIT'); return value;}
    catch (error) {await db.exec('ROLLBACK'); throw error;}
  }
  const act = (actor: string, body: Record<string, unknown>) => as(actor, q => actOnOrganization(q, actor, body));
  const org = await act('synthetic-admin', {action: 'create', name: 'SYNTHETIC private upload team', displayName: 'Synthetic administrator'});
  const other = await act('synthetic-outsider', {action: 'create', name: 'SYNTHETIC separate team', displayName: 'Synthetic outsider'});
  await act('synthetic-member', {action: 'request-membership', organizationId: org.id, displayName: 'Synthetic member', note: 'TEST FIXTURE'});
  await act('synthetic-admin', {action: 'admit-member', organizationId: org.id, subject: 'synthetic-member', role: 'contributor'});
  const reserve = (bytes: Uint8Array) => as('synthetic-member', q => reserveOriginal(q, 'synthetic-member', org.id, 'synthetic.txt', bytes.length, 'railway'));
  const fixture = syntheticStorage(), service = createOrganizationObjectUpload({transaction: as, store: fixture.store, configured: configuration, trusted: actor => actor === 'synthetic-member'});
  const original = (id: string) => as('synthetic-member', async q => (await q.query('SELECT * FROM dis_organization_uploads WHERE id=$1', [id])).rows[0]);
  const used = async () => Number((await as('synthetic-member', q => q.query('SELECT dis_org_storage_usage($1) AS used', [org.id]))).rows[0].used);
  const bytes = Buffer.from('SYNTHETIC source content');

  await t.test('trusted-uploader policy, current membership and exact size/type precede any provider write', async () => {
    const reservation = await reserve(bytes);
    assert.ok(reservation.pathname.startsWith('railway/organizations/' + org.id + '/'));
    const untrusted = createOrganizationObjectUpload({transaction: as, store: fixture.store, configured: configuration, trusted: () => false});
    await assert.rejects(untrusted.upload('synthetic-member', org.id, reservation.id, stream(bytes), 'text/plain', String(bytes.length)), /reviewed beta/);
    await assert.rejects(service.upload('synthetic-member', other.id, reservation.id, stream(bytes), 'text/plain', String(bytes.length)), /not available/);
    await assert.rejects(service.upload('synthetic-member', org.id, reservation.id, stream(bytes), 'application/pdf', String(bytes.length)), /differs/);
    await assert.rejects(service.upload('synthetic-member', org.id, reservation.id, stream(bytes), 'text/plain', String(bytes.length + 1)), /differs/);
    assert.equal((await original(reservation.id)).status, 'RESERVED'); assert.equal(fixture.state.requests, 0);
  });
  await t.test('an original is archived only after hash-bound private storage and remains unscanned and owner-only', async () => {
    const reservation = await reserve(bytes);
    fixture.state.beforePutReturn = async () => {
      const row = await original(reservation.id);
      assert.equal(row.status, 'TOKEN_ISSUED'); assert.equal(row.sha256, hash(bytes));
    };
    const saved = await service.upload('synthetic-member', org.id, reservation.id, stream(bytes), 'text/plain', String(bytes.length));
    fixture.state.beforePutReturn = null;
    assert.equal(saved.original.status, 'ARCHIVED'); assert.equal(saved.original.scan_state, 'NOT_SCANNED');
    assert.equal(saved.receipt.sha256, hash(bytes)); assert.equal(saved.receipt.size, bytes.length);
    assert.equal((await as('synthetic-admin', q => q.query('SELECT * FROM dis_organization_uploads WHERE id=$1', [reservation.id]))).rows.length, 0);
    await assert.rejects(service.complete('synthetic-admin', org.id, reservation.id), /unavailable/);
    const count = fixture.state.puts;
    await assert.rejects(service.upload('synthetic-member', org.id, reservation.id, stream(bytes), 'text/plain', String(bytes.length)), /already used/);
    assert.equal(fixture.state.puts, count);
    assert.equal((await service.complete('synthetic-member', org.id, reservation.id)).original.status, 'ARCHIVED');
  });
  await t.test('actual oversized or truncated request bytes never enter provider storage and release only the unused reservation', async () => {
    const reservation = await reserve(bytes), before = await used(), count = fixture.state.puts;
    await assert.rejects(service.upload('synthetic-member', org.id, reservation.id, stream(Buffer.concat([bytes, bytes])), 'text/plain', null), code('UPLOAD_SIZE_INVALID'));
    assert.equal(fixture.state.puts, count); assert.equal((await original(reservation.id)).status, 'REJECTED');
    assert.equal(await used(), before - bytes.length);
    const short = await reserve(bytes);
    await assert.rejects(service.upload('synthetic-member', org.id, short.id, stream(bytes.subarray(1)), 'text/plain', null), code('UPLOAD_INCOMPLETE'));
    assert.equal(fixture.state.puts, count);
  });
  await t.test('lost HEAD response retains quota/object/hash and an explicit retry reconciles the same original', async () => {
    const reservation = await reserve(bytes), before = await used(); fixture.state.failHead = true;
    await assert.rejects(service.upload('synthetic-member', org.id, reservation.id, stream(bytes), 'text/plain', String(bytes.length)), code('STORAGE_UNAVAILABLE'));
    const pending = await original(reservation.id);
    assert.equal(pending.status, 'TOKEN_ISSUED'); assert.equal(pending.sha256, hash(bytes));
    assert.equal(await used(), before); assert.equal(fixture.state.deletes, 0); assert.ok(fixture.objects.has(reservation.pathname));
    const recovered = await service.complete('synthetic-member', org.id, reservation.id);
    assert.equal(recovered.original.status, 'ARCHIVED'); assert.equal(recovered.receipt.sha256, hash(bytes));
    assert.equal(await used(), before); assert.equal(fixture.state.deletes, 0);
  });
  await t.test('a conflicting pre-existing object is not overwritten, adopted with a different fingerprint, or deleted', async () => {
    const reservation = await reserve(bytes);
    await fixture.store.putBytes(reservation.pathname, Buffer.from('SYNTHETIC DIFFERENT ORIGINAL'), 'text/plain');
    const before = await used();
    await assert.rejects(service.upload('synthetic-member', org.id, reservation.id, stream(bytes), 'text/plain', String(bytes.length)), code('OBJECT_ALREADY_EXISTS'));
    await assert.rejects(service.complete('synthetic-member', org.id, reservation.id), /does not match/);
    assert.equal((await original(reservation.id)).status, 'TOKEN_ISSUED'); assert.equal(await used(), before); assert.equal(fixture.state.deletes, 0);
    assert.equal(fixture.objects.get(reservation.pathname)?.bytes.toString(), 'SYNTHETIC DIFFERENT ORIGINAL');
  });
  await t.test('membership revoked after provider PUT withholds archive/access and leaves the object quarantined for reconciliation', async () => {
    const reservation = await reserve(bytes);
    fixture.state.beforePutReturn = async () => {await act('synthetic-admin', {action: 'revoke-member', organizationId: org.id, subject: 'synthetic-member'});};
    await assert.rejects(service.upload('synthetic-member', org.id, reservation.id, stream(bytes), 'text/plain', String(bytes.length)), /not available/);
    fixture.state.beforePutReturn = null;
    assert.ok(fixture.objects.has(reservation.pathname)); assert.equal(fixture.state.deletes, 0);
    assert.equal((await as('synthetic-member', q => q.query('SELECT * FROM dis_organization_uploads WHERE id=$1', [reservation.id]))).rows.length, 0);
    await assert.rejects(service.complete('synthetic-member', org.id, reservation.id), /not available/);
    // Operator-only synthetic fixture inspection; no application bypass exists.
    const held = (await db.query('SELECT status,scan_state,sha256 FROM dis_organization_uploads WHERE id=$1', [reservation.id])).rows[0] as any;
    assert.equal(held.status, 'TOKEN_ISSUED'); assert.equal(held.scan_state, 'NOT_SCANNED'); assert.equal(held.sha256, hash(bytes));
  });
});
