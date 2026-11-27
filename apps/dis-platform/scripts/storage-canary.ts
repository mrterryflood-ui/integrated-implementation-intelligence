/** Deployment-only synthetic acceptance check. Importing this module performs no I/O. */
import {createHash, randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {ObjectStoreError, railwayObjectStore, railwayStorageConfiguration, type ObjectReceipt, type ObjectStorageConfiguration} from '../lib/organizations/object-store';

const TARGET = {endpoint: 'https://t3.storageapi.dev', bucket: 'privateoriginals-23xrka0j', urlStyle: 'virtual'} as const;
const CHECKS = ['configuration', 'initialAbsence', 'put', 'head', 'download', 'overwriteRefused', 'originalUnchanged', 'anonymousDenied', 'deletion'] as const;
type Check = typeof CHECKS[number];
type CheckState = 'NOT_RUN' | 'RUNNING' | 'PASS' | 'FAIL';
type Store = Pick<typeof railwayObjectStore, 'putBytes' | 'head' | 'get' | 'remove'>;
export type StorageCanaryReceipt = {
  schemaVersion: 'dis.storage.canary.v1'; synthetic: true; status: 'RUNNING' | 'PASS' | 'FAIL';
  runId: string; objectPath: string; target: typeof TARGET;
  commitSha: string | null; commitSource: 'RAILWAY_GIT_COMMIT_SHA' | 'DIS_RELEASE_SHA' | null;
  startedAt: string; finishedAt: string | null; durationMs: number | null;
  expected: {bytes: number; contentType: 'text/plain'; sha256: string};
  checks: Record<Check, CheckState>;
  anonymous: {httpStatus: number | null; responseBytes: number | null};
  cleanup: {state: 'NOT_NEEDED' | 'PENDING' | 'REMOVED' | 'ALREADY_ABSENT' | 'RETAINED_UNCONFIRMED'; ownershipVerified: boolean; errorCode: string | null};
  failure: {stage: string; code: string} | null;
};
type Options = {
  store?: Store; configuration?: () => ObjectStorageConfiguration; fetcher?: typeof fetch;
  env?: Record<string, string | undefined>; now?: () => number; uuid?: () => string;
  onProgress?: (receipt: StorageCanaryReceipt) => void;
};
class CanaryFailure extends Error {constructor(readonly code: string) {super('Synthetic storage canary did not pass.');}}
const digest = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const knownStoreCodes = new Set(['STORAGE_NOT_CONFIGURED', 'STORAGE_ENDPOINT_INVALID', 'STORAGE_PATH_INVALID', 'OBJECT_RECEIPT_INVALID', 'OBJECT_ALREADY_EXISTS', 'OBJECT_NOT_FOUND', 'OBJECT_CHANGED', 'STORAGE_UNAVAILABLE', 'STORAGE_TIMEOUT']);
const safeCode = (error: unknown) => error instanceof CanaryFailure ? error.code : error instanceof ObjectStoreError && knownStoreCodes.has(error.code) ? error.code : 'UNEXPECTED_CANARY_FAILURE';
const notFound = (error: unknown) => error instanceof ObjectStoreError && error.code === 'OBJECT_NOT_FOUND' && error.status === 404;

function releaseIdentity(env: Record<string, string | undefined>) {
  const railway = env.RAILWAY_GIT_COMMIT_SHA, artifact = env.DIS_RELEASE_SHA;
  if (railway && !/^[a-f0-9]{40}$/i.test(railway) || artifact && !/^[a-f0-9]{40}$/i.test(artifact)) throw new CanaryFailure('INVALID_RELEASE_SHA');
  if (railway && artifact && railway.toLowerCase() !== artifact.toLowerCase()) throw new CanaryFailure('RELEASE_SHA_CONFLICT');
  if (railway) return {commitSha: railway.toLowerCase(), commitSource: 'RAILWAY_GIT_COMMIT_SHA' as const};
  if (artifact) return {commitSha: artifact.toLowerCase(), commitSource: 'DIS_RELEASE_SHA' as const};
  throw new CanaryFailure('RELEASE_SHA_UNAVAILABLE');
}
function checkReceipt(actual: ObjectReceipt, path: string, bytes: Buffer) {
  if (actual.pathname !== path || actual.size !== bytes.length || actual.contentType !== 'text/plain' || actual.sha256 !== digest(bytes)) throw new CanaryFailure('OBJECT_RECEIPT_MISMATCH');
}
async function boundedBytes(stream: ReadableStream<Uint8Array> | null, limit: number) {
  if (!stream) return Buffer.alloc(0);
  const reader = stream.getReader(), chunks: Buffer[] = []; let size = 0;
  try {
    for (;;) {const item = await reader.read(); if (item.done) break; size += item.value.byteLength; if (size > limit) throw new CanaryFailure('RESPONSE_SIZE_EXCEEDED'); chunks.push(Buffer.from(item.value));}
    return Buffer.concat(chunks);
  } finally {await reader.cancel().catch(() => {}); reader.releaseLock();}
}

/** One new random key only. Tests inject a synthetic store/transport; production
 * defaults use the same adapter/configuration as application uploads. */
export async function runStorageCanary(options: Options = {}): Promise<StorageCanaryReceipt> {
  const store = options.store || railwayObjectStore, fetcher = options.fetcher || fetch, now = options.now || Date.now;
  const started = now(), runId = (options.uuid || randomUUID)();
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(runId)) throw new CanaryFailure('INVALID_CANARY_RUN_ID');
  const path = 'railway/dis/' + runId + '/dis-storage-canary.txt';
  const original = Buffer.from('DIS storage deployment canary\nSynthetic data only.\nRun: ' + runId + '\n', 'utf8');
  const replacement = Buffer.from('DIS synthetic overwrite probe\nRun: ' + runId + '\n', 'utf8');
  const receipt: StorageCanaryReceipt = {
    schemaVersion: 'dis.storage.canary.v1', synthetic: true, status: 'RUNNING', runId, objectPath: path, target: TARGET,
    commitSha: null, commitSource: null, startedAt: new Date(started).toISOString(), finishedAt: null, durationMs: null,
    expected: {bytes: original.length, contentType: 'text/plain', sha256: digest(original)},
    checks: Object.fromEntries(CHECKS.map(name => [name, 'NOT_RUN'])) as Record<Check, CheckState>,
    anonymous: {httpStatus: null, responseBytes: null}, cleanup: {state: 'NOT_NEEDED', ownershipVerified: false, errorCode: null}, failure: null,
  };
  const progress = () => {try {options.onProgress?.(JSON.parse(JSON.stringify(receipt)));} catch {/* Reporting never changes storage authority. */}};
  let current: Check = 'configuration', initialAbsence = false, mayOwn = false, overwriteAttempted = false, removed = false;
  const step = async (name: Check, work: () => Promise<void>) => {
    current = name;
    // Actual adapter operations each have a 45-second deadline. Do not begin a
    // further check after 90 seconds; the CLI's independent watchdog also bounds cleanup.
    if (now() - started >= 90000) throw new CanaryFailure('CANARY_CHECK_DEADLINE');
    receipt.checks[name] = 'RUNNING'; progress(); await work(); receipt.checks[name] = 'PASS'; progress();
  };
  const requireAbsent = async () => {
    try {await store.head(path);} catch (error) {if (notFound(error)) return; throw error;}
    throw new CanaryFailure('OBJECT_STILL_EXISTS');
  };
  const readExact = async (expected: Buffer) => {
    const observed = await store.get(path, {size: expected.length, contentType: 'text/plain', sha256: digest(expected)});
    try {checkReceipt(observed, path, expected);} catch (error) {await observed.stream.cancel().catch(() => {}); throw error;}
    const bytes = await boundedBytes(observed.stream, expected.length);
    if (!bytes.equals(expected)) throw new CanaryFailure('OBJECT_BYTES_MISMATCH');
  };
  progress();
  try {
    let config: ObjectStorageConfiguration;
    await step('configuration', async () => {
      config = (options.configuration || railwayStorageConfiguration)();
      if (config.endpoint !== TARGET.endpoint || config.bucket !== TARGET.bucket || config.urlStyle !== TARGET.urlStyle) throw new CanaryFailure('CANARY_TARGET_MISMATCH');
      Object.assign(receipt, releaseIdentity(options.env || process.env));
    });
    await step('initialAbsence', async () => {await requireAbsent(); initialAbsence = true;});
    await step('put', async () => {
      mayOwn = true; receipt.cleanup.state = 'PENDING'; progress();
      try {checkReceipt(await store.putBytes(path, original, 'text/plain'), path, original);}
      catch (error) {
        // A definite conditional-write refusal does not grant ownership of a
        // competing/pre-existing object, even after the preceding absent HEAD.
        if (error instanceof ObjectStoreError && error.code === 'OBJECT_ALREADY_EXISTS') {mayOwn = false; receipt.cleanup.state = 'RETAINED_UNCONFIRMED';}
        throw error;
      }
    });
    await step('head', async () => {checkReceipt(await store.head(path), path, original);});
    await step('download', async () => {await readExact(original); receipt.cleanup.ownershipVerified = true;});
    await step('overwriteRefused', async () => {
      overwriteAttempted = true;
      try {await store.putBytes(path, replacement, 'text/plain');}
      catch (error) {if (error instanceof ObjectStoreError && error.code === 'OBJECT_ALREADY_EXISTS' && error.status === 409) return; throw error;}
      throw new CanaryFailure('OVERWRITE_WAS_ACCEPTED');
    });
    await step('originalUnchanged', async () => {checkReceipt(await store.head(path), path, original); await readExact(original);});
    await step('anonymousDenied', async () => {
      const url = new URL(TARGET.endpoint); url.hostname = TARGET.bucket + '.' + url.hostname; url.pathname = '/' + path.split('/').map(encodeURIComponent).join('/');
      const response = await fetcher(url.href, {method: 'GET', credentials: 'omit', redirect: 'error', cache: 'no-store', referrerPolicy: 'no-referrer', headers: {accept: 'application/octet-stream'}, signal: AbortSignal.timeout(10000)});
      receipt.anonymous.httpStatus = response.status;
      if (response.redirected || response.url && response.url !== url.href) {await response.body?.cancel().catch(() => {}); throw new CanaryFailure('ANONYMOUS_REDIRECT');}
      const bytes = await boundedBytes(response.body, 16384); receipt.anonymous.responseBytes = bytes.length;
      if (![401, 403, 404].includes(response.status)) throw new CanaryFailure('ANONYMOUS_ACCESS_NOT_DENIED');
      if (bytes.includes(original) || bytes.includes(Buffer.from('DIS storage deployment canary'))) throw new CanaryFailure('ANONYMOUS_CONTENT_DISCLOSED');
      // A masked 404 proves denial only while authenticated access still confirms
      // the same existing object. Network errors/5xx never count as privacy proof.
      checkReceipt(await store.head(path), path, original);
    });
    await step('deletion', async () => {await store.remove(path); await requireAbsent(); removed = true; receipt.cleanup.state = 'REMOVED';});
  } catch (error) {
    receipt.checks[current] = 'FAIL'; receipt.failure = {stage: current, code: safeCode(error)};
  } finally {
    if (initialAbsence && mayOwn && !removed) {
      receipt.cleanup.state = 'PENDING'; progress();
      try {
        let found: ObjectReceipt;
        try {found = await store.head(path);} catch (error) {if (notFound(error)) {receipt.cleanup.state = 'ALREADY_ABSENT'; removed = true;} else throw error;}
        if (!removed) {
          const candidate = found!.sha256 === digest(original) && found!.size === original.length ? original :
            overwriteAttempted && receipt.cleanup.ownershipVerified && found!.sha256 === digest(replacement) && found!.size === replacement.length ? replacement : null;
          if (!candidate) throw new CanaryFailure('CLEANUP_OWNERSHIP_UNCONFIRMED');
          checkReceipt(found!, path, candidate); await readExact(candidate); receipt.cleanup.ownershipVerified = true;
          await store.remove(path); await requireAbsent(); removed = true; receipt.cleanup.state = 'REMOVED';
        }
      } catch (error) {receipt.cleanup.state = 'RETAINED_UNCONFIRMED'; receipt.cleanup.errorCode = safeCode(error);}
      progress();
    }
  }
  receipt.status = receipt.failure === null && CHECKS.every(name => receipt.checks[name] === 'PASS') && receipt.cleanup.state === 'REMOVED' ? 'PASS' : 'FAIL';
  receipt.finishedAt = new Date(now()).toISOString(); receipt.durationMs = Math.max(0, now() - started); progress();
  return receipt;
}

async function main() {
  let latest: StorageCanaryReceipt | null = null;
  const watchdog = setTimeout(() => {
    const failure = latest ? {...latest, status: 'FAIL', finishedAt: new Date().toISOString(), durationMs: Date.now() - Date.parse(latest.startedAt),
      checks: Object.fromEntries(Object.entries(latest.checks).map(([name, state]) => [name, state === 'RUNNING' ? 'FAIL' : state])),
      failure: {stage: 'watchdog', code: 'CANARY_TOTAL_TIMEOUT'}, cleanup: {...latest.cleanup, state: latest.cleanup.state === 'REMOVED' ? 'REMOVED' : 'RETAINED_UNCONFIRMED'}} :
      {schemaVersion: 'dis.storage.canary.v1', synthetic: true, status: 'FAIL', failure: {stage: 'watchdog', code: 'CANARY_TOTAL_TIMEOUT'}};
    process.stdout.write(JSON.stringify(failure) + '\n', () => process.exit(1));
    setTimeout(() => process.exit(1), 1000).unref();
  }, 240000);
  try {
    const result = await runStorageCanary({onProgress: receipt => {latest = receipt;}});
    process.stdout.write(JSON.stringify(result) + '\n'); process.exitCode = result.status === 'PASS' ? 0 : 1;
  } catch {
    process.stdout.write(JSON.stringify({schemaVersion: 'dis.storage.canary.v1', synthetic: true, status: 'FAIL', failure: {stage: 'initialization', code: 'CANARY_INITIALIZATION_FAILED'}, finishedAt: new Date().toISOString()}) + '\n');
    process.exitCode = 1;
  } finally {clearTimeout(watchdog);}
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) void main();
