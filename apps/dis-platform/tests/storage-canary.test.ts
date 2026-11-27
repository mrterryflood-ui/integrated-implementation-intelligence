/** Synthetic canary orchestration only; no live bucket, credentials, or network. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {runStorageCanary} from '../scripts/storage-canary';
import {ObjectStoreError, railwayStorageConfiguration} from '../lib/organizations/object-store';

const RUN = '11111111-1111-4111-8111-111111111111', SHA = 'a'.repeat(40), SECRET = 'SYNTHETIC_SECRET_MUST_NOT_APPEAR';
const PATH = 'railway/dis/' + RUN + '/dis-storage-canary.txt';
const ENV = {DIS_OBJECT_STORAGE_PROVIDER: 'railway', DIS_S3_ENDPOINT: 'https://t3.storageapi.dev', DIS_S3_BUCKET: 'privateoriginals-23xrka0j', DIS_S3_ACCESS_KEY_ID: 'SYNTHETIC_ACCESS_KEY', DIS_S3_SECRET_ACCESS_KEY: SECRET, DIS_S3_REGION: 'auto', DIS_S3_URL_STYLE: 'virtual', RAILWAY_GIT_COMMIT_SHA: SHA};
const digest = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
function fixture() {
  const objects = new Map<string, Buffer>();
  const state = {putCalls: 0, removeCalls: 0, anonymousCalls: 0, lostFirstPut: false, conflictFirstPut: false, permitOverwrite: false, deletionFails: false, deletionNoop: false, anonymousStatus: 403, discloseOnError: false, deleteBeforeAnonymous: false, oversizedDenial: false};
  const paths: string[] = [];
  const receipt = (path: string, bytes: Buffer) => ({pathname: path, size: bytes.length, contentType: 'text/plain', sha256: digest(bytes)});
  const store = {
    async putBytes(path: string, bytes: Uint8Array, contentType: string) {
      paths.push(path); state.putCalls++; assert.equal(contentType, 'text/plain');
      if (state.conflictFirstPut && state.putCalls === 1) {objects.set(path, Buffer.from('SYNTHETIC OTHER OWNER')); throw new ObjectStoreError('OBJECT_ALREADY_EXISTS', SECRET, 409);}
      if (objects.has(path) && !state.permitOverwrite) throw new ObjectStoreError('OBJECT_ALREADY_EXISTS', 'Synthetic conditional refusal', 409);
      objects.set(path, Buffer.from(bytes));
      if (state.lostFirstPut && state.putCalls === 1) throw new ObjectStoreError('STORAGE_UNAVAILABLE', SECRET, 503);
      return receipt(path, Buffer.from(bytes));
    },
    async head(path: string) {
      paths.push(path); const bytes = objects.get(path);
      if (!bytes) throw new ObjectStoreError('OBJECT_NOT_FOUND', 'Synthetic absent object', 404);
      return receipt(path, bytes);
    },
    async get(path: string, expected: {size: number; contentType: string; sha256: string}) {
      paths.push(path); const bytes = objects.get(path);
      if (!bytes) throw new ObjectStoreError('OBJECT_NOT_FOUND', 'Synthetic absent object', 404);
      assert.equal(expected.sha256, digest(bytes));
      return {...receipt(path, bytes), stream: new ReadableStream<Uint8Array>({start(controller) {controller.enqueue(bytes); controller.close();}})};
    },
    async remove(path: string) {
      paths.push(path); state.removeCalls++;
      if (state.deletionFails) throw Error(SECRET);
      if (!state.deletionNoop) objects.delete(path);
    },
  };
  const fetcher: typeof fetch = async (input, init) => {
    state.anonymousCalls++; assert.equal(String(input), 'https://privateoriginals-23xrka0j.t3.storageapi.dev/' + PATH);
    assert.equal(init?.method, 'GET'); assert.equal(init?.credentials, 'omit'); assert.equal(init?.redirect, 'error'); assert.equal(init?.cache, 'no-store');
    assert.equal(new Headers(init?.headers).has('authorization'), false); assert.equal(new Headers(init?.headers).has('cookie'), false);
    assert.equal(new URL(String(input)).search, ''); assert.ok(init?.signal);
    const source = objects.get(PATH)!;
    if (state.deleteBeforeAnonymous) objects.delete(PATH);
    return new Response(state.oversizedDenial ? 'x'.repeat(16385) : state.anonymousStatus === 200 || state.discloseOnError ? new Uint8Array(source) : 'SYNTHETIC access denied', {status: state.anonymousStatus});
  };
  const run = (overrides: Partial<Parameters<typeof runStorageCanary>[0]> = {}) => runStorageCanary({store, configuration: () => railwayStorageConfiguration(ENV), fetcher, env: ENV, uuid: () => RUN, ...overrides});
  return {objects, state, paths, run};
}

test('synthetic canary requires every exact adapter/private/immutable/delete observation and binds its receipt to release SHA', async () => {
  const f = fixture(), result = await f.run();
  assert.equal(result.status, 'PASS'); assert.ok(Object.values(result.checks).every(value => value === 'PASS'));
  assert.equal(result.commitSha, SHA); assert.equal(result.commitSource, 'RAILWAY_GIT_COMMIT_SHA');
  assert.equal(result.anonymous.httpStatus, 403); assert.equal(result.cleanup.state, 'REMOVED'); assert.equal(result.cleanup.ownershipVerified, true);
  assert.equal(f.objects.size, 0); assert.equal(f.state.removeCalls, 1); assert.equal(f.state.putCalls, 2); assert.equal(f.state.anonymousCalls, 1);
  assert.deepEqual([...new Set(f.paths)], [PATH]); assert.ok(!JSON.stringify(result).includes(SECRET));
  assert.ok(result.finishedAt); assert.ok(result.durationMs! >= 0);
});

test('an uncertain initial PUT stays failed even when exact ownership can be proven and the synthetic object cleaned', async () => {
  const f = fixture(); f.state.lostFirstPut = true;
  const result = await f.run();
  assert.equal(result.status, 'FAIL'); assert.equal(result.failure?.stage, 'put'); assert.equal(result.failure?.code, 'STORAGE_UNAVAILABLE');
  assert.equal(result.cleanup.state, 'REMOVED'); assert.equal(result.cleanup.ownershipVerified, true); assert.equal(f.objects.size, 0);
  assert.equal(result.checks.anonymousDenied, 'NOT_RUN'); assert.ok(!JSON.stringify(result).includes(SECRET));
});

test('pre-existing objects and a definite competing initial PUT refusal never grant cleanup authority', async () => {
  const existing = fixture(); existing.objects.set(PATH, Buffer.from('SYNTHETIC PRE-EXISTING'));
  const before = await existing.run(); assert.equal(before.status, 'FAIL'); assert.equal(before.failure?.stage, 'initialAbsence'); assert.equal(existing.state.putCalls, 0); assert.equal(existing.state.removeCalls, 0);
  const conflict = fixture(); conflict.state.conflictFirstPut = true;
  const raced = await conflict.run(); assert.equal(raced.status, 'FAIL'); assert.equal(raced.cleanup.state, 'RETAINED_UNCONFIRMED'); assert.equal(conflict.state.removeCalls, 0);
  assert.equal(conflict.objects.get(PATH)?.toString(), 'SYNTHETIC OTHER OWNER');
});

test('accepted overwrite fails acceptance and cleanup recognizes only this run’s exact replacement probe', async () => {
  const f = fixture(); f.state.permitOverwrite = true;
  const result = await f.run(); assert.equal(result.status, 'FAIL'); assert.equal(result.failure?.code, 'OVERWRITE_WAS_ACCEPTED');
  assert.equal(result.cleanup.state, 'REMOVED'); assert.equal(f.objects.size, 0);
});

test('anonymous success, server errors, disclosed bodies and missing objects are never reported as privacy proof', async t => {
  for (const status of [200, 500]) await t.test('anonymous HTTP ' + status, async () => {
    const f = fixture(); f.state.anonymousStatus = status;
    const result = await f.run(); assert.equal(result.status, 'FAIL'); assert.equal(result.checks.anonymousDenied, 'FAIL'); assert.equal(result.cleanup.state, 'REMOVED');
  });
  await t.test('403 containing source bytes', async () => {
    const f = fixture(); f.state.discloseOnError = true;
    const result = await f.run(); assert.equal(result.status, 'FAIL'); assert.equal(result.failure?.code, 'ANONYMOUS_CONTENT_DISCLOSED');
  });
  await t.test('404 after the existing object disappears', async () => {
    const f = fixture(); f.state.anonymousStatus = 404; f.state.deleteBeforeAnonymous = true;
    const result = await f.run(); assert.equal(result.status, 'FAIL'); assert.equal(result.checks.anonymousDenied, 'FAIL'); assert.equal(result.cleanup.state, 'ALREADY_ABSENT');
  });
  await t.test('denial response exceeds its byte bound', async () => {
    const f = fixture(); f.state.oversizedDenial = true;
    const result = await f.run(); assert.equal(result.status, 'FAIL'); assert.equal(result.failure?.code, 'RESPONSE_SIZE_EXCEEDED');
  });
});

test('cleanup cannot turn an unconfirmed deletion into success or leak a provider exception', async () => {
  const f = fixture(); f.state.anonymousStatus = 500; f.state.deletionFails = true;
  const failed = await f.run(); assert.equal(failed.status, 'FAIL'); assert.equal(failed.cleanup.state, 'RETAINED_UNCONFIRMED'); assert.equal(failed.cleanup.errorCode, 'UNEXPECTED_CANARY_FAILURE'); assert.ok(!JSON.stringify(failed).includes(SECRET));
  const ignored = fixture(); ignored.state.deletionNoop = true;
  const result = await ignored.run(); assert.equal(result.status, 'FAIL'); assert.equal(result.failure?.stage, 'deletion'); assert.equal(result.cleanup.state, 'RETAINED_UNCONFIRMED'); assert.ok(ignored.objects.has(PATH));
});

test('wrong target, missing/conflicting release identity and a check deadline fail without broadening authority', async () => {
  const wrong = fixture();
  const target = await wrong.run({configuration: () => ({...railwayStorageConfiguration(ENV), bucket: 'another-private-bucket'})});
  assert.equal(target.status, 'FAIL'); assert.equal(target.failure?.code, 'CANARY_TARGET_MISMATCH'); assert.equal(wrong.paths.length, 0);
  const missing = fixture(), identity = await missing.run({env: {RAILWAY_GIT_COMMIT_SHA: SECRET}});
  assert.equal(identity.status, 'FAIL'); assert.equal(identity.commitSha, null); assert.ok(!JSON.stringify(identity).includes(SECRET)); assert.equal(missing.paths.length, 0);
  const conflict = await fixture().run({env: {RAILWAY_GIT_COMMIT_SHA: SHA, DIS_RELEASE_SHA: 'b'.repeat(40)}});
  assert.equal(conflict.failure?.code, 'RELEASE_SHA_CONFLICT');
  const fallback = await fixture().run({env: {DIS_RELEASE_SHA: SHA}}); assert.equal(fallback.status, 'PASS'); assert.equal(fallback.commitSource, 'DIS_RELEASE_SHA');
  let clock = Date.now(); const bounded = fixture();
  const result = await bounded.run({now: () => clock, onProgress: receipt => {if (receipt.checks.put === 'PASS') clock += 90001;}});
  assert.equal(result.status, 'FAIL'); assert.equal(result.failure?.code, 'CANARY_CHECK_DEADLINE'); assert.equal(result.cleanup.state, 'REMOVED');
});
