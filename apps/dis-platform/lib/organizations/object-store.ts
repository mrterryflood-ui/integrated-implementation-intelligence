import {S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand, DeleteObjectCommand, type S3ClientConfig} from '@aws-sdk/client-s3';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {chmod, mkdtemp, open, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

export const PRIVATE_OBJECT_MAX_BYTES = 100 * 1024 * 1024;
const PROVIDER_TIMEOUT = 45000;
export class ObjectStoreError extends Error {
  constructor(public readonly code: string, message: string, public readonly status = 503) { super(message); }
}
export type ObjectStorageConfiguration = {endpoint: string; bucket: string; region: string; accessKeyId: string; secretAccessKey: string; urlStyle: 'virtual' | 'path'};
export type ObjectReceipt = {pathname: string; size: number; contentType: string; sha256: string};
export type ObjectExpectation = {size: number; contentType: string; sha256: string};
export type PrivateSpool = {path: string; size: number; sha256: string; cleanup: () => Promise<void>};

export function railwayStorageConfiguration(env: Record<string, string | undefined> = process.env): ObjectStorageConfiguration {
  if (env.DIS_OBJECT_STORAGE_PROVIDER !== 'railway') throw new ObjectStoreError('STORAGE_NOT_CONFIGURED', 'Private Railway object storage is not configured.');
  let endpoint: URL;
  try { endpoint = new URL(env.DIS_S3_ENDPOINT || ''); } catch { throw new ObjectStoreError('STORAGE_NOT_CONFIGURED', 'Private Railway object storage is not configured.'); }
  if (endpoint.protocol !== 'https:' || !/^[a-z0-9-]+\.storageapi\.dev$/.test(endpoint.hostname) || endpoint.port || endpoint.username || endpoint.password || endpoint.pathname !== '/' || endpoint.search || endpoint.hash) throw new ObjectStoreError('STORAGE_ENDPOINT_INVALID', 'Private storage needs its reviewed Railway endpoint.');
  const bucket = env.DIS_S3_BUCKET || '', region = env.DIS_S3_REGION || 'auto', accessKeyId = env.DIS_S3_ACCESS_KEY_ID || '', secretAccessKey = env.DIS_S3_SECRET_ACCESS_KEY || '', urlStyle = env.DIS_S3_URL_STYLE || 'virtual';
  if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket) || !/^[a-z0-9-]{1,64}$/.test(region) || !/^[\x21-\x7e]{8,1024}$/.test(accessKeyId) || !/^[\x21-\x7e]{16,2048}$/.test(secretAccessKey) || !['virtual', 'path'].includes(urlStyle)) throw new ObjectStoreError('STORAGE_NOT_CONFIGURED', 'Private Railway storage credentials or URL style need operator configuration.');
  return {endpoint: endpoint.origin, bucket, region, accessKeyId, secretAccessKey, urlStyle: urlStyle as 'virtual' | 'path'};
}
export function railwayStorageConfigured(env: Record<string, string | undefined> = process.env) { try {railwayStorageConfiguration(env); return true;} catch {return false;} }
/** A provider discriminator only. Every operation also validates the complete key. */
export const isRailwayObjectPath = (path: unknown): path is string => typeof path === 'string' && path.startsWith('railway/');
const UUID = '[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}';
const KEY = new RegExp('^railway/(?:organizations/' + UUID + '/' + UUID + '|dis/' + UUID + ')/[A-Za-z0-9._ -]{1,160}$', 'i');
export function validateRailwayObjectPath(path: unknown): asserts path is string {
  if (typeof path !== 'string' || !KEY.test(path) || ['.', '..'].includes(path.split('/').at(-1)!)) throw new ObjectStoreError('STORAGE_PATH_INVALID', 'The stored object path is outside the supported private namespace.', 400);
}
function expectation(value: ObjectExpectation) {
  if (!Number.isSafeInteger(value.size) || value.size < 1 || value.size > PRIVATE_OBJECT_MAX_BYTES || !/^[a-f0-9]{64}$/.test(value.sha256) || !/^[a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*$/i.test(value.contentType) || value.contentType.length > 160) throw new ObjectStoreError('OBJECT_RECEIPT_INVALID', 'The object size, type or fingerprint is invalid.', 409);
}
function receipt(path: string, result: {ContentLength?: number; ContentType?: string; Metadata?: Record<string, string>; ChecksumSHA256?: string}): ObjectReceipt {
  const value = {pathname: path, size: result.ContentLength!, contentType: result.ContentType || '', sha256: result.Metadata?.['dis-sha256'] || ''};
  expectation(value);
  if (result.Metadata?.['dis-byte-size'] !== String(value.size) || result.Metadata?.['dis-scan-state'] !== 'NOT_SCANNED' || result.ChecksumSHA256 && result.ChecksumSHA256 !== Buffer.from(value.sha256, 'hex').toString('base64')) throw new ObjectStoreError('OBJECT_RECEIPT_INVALID', 'The stored object did not match its private upload receipt.', 409);
  return value;
}
function match(actual: ObjectReceipt, expected: ObjectExpectation) {
  expectation(expected);
  if (actual.size !== expected.size || actual.sha256 !== expected.sha256 || actual.contentType !== expected.contentType) throw new ObjectStoreError('OBJECT_CHANGED', 'The original object differs from its saved size, type or fingerprint.', 409);
}
function safeFailure(error: unknown): ObjectStoreError {
  if (error instanceof ObjectStoreError) return error;
  const status = (error as {$metadata?: {httpStatusCode?: number}})?.$metadata?.httpStatusCode;
  if (status === 412 || status === 409) return new ObjectStoreError('OBJECT_ALREADY_EXISTS', 'The reserved object already exists. Verify its saved receipt before retrying.', 409);
  if (status === 404) return new ObjectStoreError('OBJECT_NOT_FOUND', 'The original object is not available in private storage.', 404);
  return new ObjectStoreError('STORAGE_UNAVAILABLE', 'Private object storage did not confirm this operation. No successful completion is recorded.');
}
type Dependencies = {configuration?: () => ObjectStorageConfiguration; requestHandler?: S3ClientConfig['requestHandler']};
export function createRailwayObjectStore(deps: Dependencies = {}) {
  function client() {
    const config = (deps.configuration || railwayStorageConfiguration)();
    const s3 = new S3Client({endpoint: config.endpoint, region: config.region, forcePathStyle: config.urlStyle === 'path',
      credentials: {accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey}, maxAttempts: 1, followRegionRedirects: false,
      useAccelerateEndpoint: false, useDualstackEndpoint: false, useFipsEndpoint: false,
      requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED',
      requestHandler: deps.requestHandler || {connectionTimeout: 5000, requestTimeout: PROVIDER_TIMEOUT, socketTimeout: PROVIDER_TIMEOUT}});
    const expectedHost = config.urlStyle === 'path' ? new URL(config.endpoint).hostname : config.bucket + '.' + new URL(config.endpoint).hostname;
    s3.middlewareStack.add(next => async args => {
      const request = args.request as {hostname?: string; protocol?: string; port?: number; path?: string; method?: string};
      if (request.hostname !== expectedHost || request.protocol !== 'https:' || request.port && request.port !== 443 || !['GET', 'HEAD', 'PUT', 'DELETE'].includes(request.method || '')) throw new ObjectStoreError('STORAGE_ENDPOINT_INVALID', 'The storage request did not match its reviewed endpoint.');
      return next(args);
    }, {step: 'finalizeRequest', priority: 'high', name: 'disPinnedPrivateStorage'});
    return {s3, config};
  }
  const head = async (path: string): Promise<ObjectReceipt> => {
    validateRailwayObjectPath(path); const {s3, config} = client();
    try { return receipt(path, await s3.send(new HeadObjectCommand({Bucket: config.bucket, Key: path, ChecksumMode: 'ENABLED'}), {abortSignal: AbortSignal.timeout(PROVIDER_TIMEOUT)})); }
    catch (error) {throw safeFailure(error);} finally {s3.destroy();}
  };
  const put = async (path: string, expected: ObjectExpectation, body: Buffer | ReturnType<typeof createReadStream>): Promise<ObjectReceipt> => {
    validateRailwayObjectPath(path); expectation(expected); const {s3, config} = client();
    const signal = AbortSignal.timeout(PROVIDER_TIMEOUT);
    try {
      const result = await s3.send(new PutObjectCommand({Bucket: config.bucket, Key: path, Body: body, ContentLength: expected.size, ContentType: expected.contentType,
        IfNoneMatch: '*', ACL: 'private', ChecksumSHA256: Buffer.from(expected.sha256, 'hex').toString('base64'), CacheControl: 'private, no-store',
        Metadata: {'dis-sha256': expected.sha256, 'dis-byte-size': String(expected.size), 'dis-scan-state': 'NOT_SCANNED'}}), {abortSignal: signal});
      if (result.ChecksumSHA256 && result.ChecksumSHA256 !== Buffer.from(expected.sha256, 'hex').toString('base64')) throw new ObjectStoreError('OBJECT_RECEIPT_INVALID', 'Storage did not confirm the uploaded fingerprint.', 409);
      const observed = receipt(path, await s3.send(new HeadObjectCommand({Bucket: config.bucket, Key: path, ChecksumMode: 'ENABLED'}), {abortSignal: signal}));
      match(observed, expected); return observed;
    } catch (error) {throw safeFailure(error);} finally {if (!Buffer.isBuffer(body)) body.destroy(); s3.destroy();}
  };
  return {head,
    putBytes: async (path: string, bytes: Uint8Array, contentType: string) => {
      const buffer = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      return put(path, {size: buffer.length, contentType, sha256: createHash('sha256').update(buffer).digest('hex')}, buffer);
    },
    putFile: async (path: string, source: PrivateSpool, contentType: string) => {
      validateRailwayObjectPath(path); expectation({size: source.size, sha256: source.sha256, contentType});
      const stream = createReadStream(source.path);
      try {return await put(path, {size: source.size, sha256: source.sha256, contentType}, stream);} finally {stream.destroy();}
    },
    get: async (path: string, expected: ObjectExpectation) => {
      validateRailwayObjectPath(path); expectation(expected); const {s3, config} = client();
      const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT);
      let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
      const cleanup = () => {clearTimeout(timeout); s3.destroy();};
      try {
        const result = await s3.send(new GetObjectCommand({Bucket: config.bucket, Key: path, ChecksumMode: 'ENABLED'}), {abortSignal: controller.signal});
        if (!result.Body) throw new ObjectStoreError('OBJECT_NOT_FOUND', 'The original object body is unavailable.', 404);
        reader = result.Body.transformToWebStream().getReader();
        const actual = receipt(path, result); match(actual, expected);
        const source = reader, hash = createHash('sha256'); let count = 0, pending: Uint8Array | undefined;
        const stream = new ReadableStream<Uint8Array>({
          async pull(output) {
            try {
              const item = await source.read();
              if (controller.signal.aborted) throw new ObjectStoreError('STORAGE_TIMEOUT', 'The original download exceeded its time limit.');
              if (item.done) {
                if (count !== expected.size || hash.digest('hex') !== expected.sha256) throw new ObjectStoreError('OBJECT_CHANGED', 'The original failed its size or fingerprint check.', 409);
                // Withhold the final chunk until the complete stream is verified.
                if (pending) output.enqueue(pending); output.close(); cleanup(); return;
              }
              count += item.value.byteLength;
              if (count > expected.size || count > PRIVATE_OBJECT_MAX_BYTES) throw new ObjectStoreError('OBJECT_CHANGED', 'The original exceeded its saved size.', 409);
              hash.update(item.value); if (pending) output.enqueue(pending); pending = item.value;
            } catch (error) {controller.abort(); await source.cancel().catch(() => {}); cleanup(); output.error(safeFailure(error));}
          },
          async cancel() {controller.abort(); await source.cancel().catch(() => {}); cleanup();},
        });
        return {...actual, stream};
      } catch (error) {controller.abort(); await reader?.cancel().catch(() => {}); cleanup(); throw safeFailure(error);}
    },
    remove: async (path: string) => {
      validateRailwayObjectPath(path); const {s3, config} = client();
      try {await s3.send(new DeleteObjectCommand({Bucket: config.bucket, Key: path}), {abortSignal: AbortSignal.timeout(PROVIDER_TIMEOUT)});}
      catch (error) {throw safeFailure(error);} finally {s3.destroy();}
    },
  };
}
export const railwayObjectStore = createRailwayObjectStore();

let activeSpools = 0;
/** Exact-size, hashed quarantine spool. No user filename becomes a local path. */
export async function spoolPrivateOriginal(stream: ReadableStream<Uint8Array> | null, expected: number, options: {signal?: AbortSignal; timeoutMs?: number} = {}): Promise<PrivateSpool> {
  if (!stream || stream.locked || !Number.isSafeInteger(expected) || expected < 1 || expected > PRIVATE_OBJECT_MAX_BYTES) throw new ObjectStoreError('UPLOAD_SIZE_INVALID', 'The original must fit its reserved size and the 100 MiB limit.', 413);
  if (activeSpools >= 2) throw new ObjectStoreError('UPLOAD_BUSY', 'Two originals are already being verified. Try this upload again shortly.', 429);
  activeSpools++;
  let directory: string | undefined, released = false;
  const cleanup = async () => {if (released) return; released = true; try {if (directory) await rm(directory, {recursive: true, force: true});} finally {activeSpools--;}};
  const controller = new AbortController(), signal = options.signal ? AbortSignal.any([controller.signal, options.signal]) : controller.signal;
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 120000);
  const reader = stream.getReader(), hash = createHash('sha256'); let file: Awaited<ReturnType<typeof open>> | undefined, success = false, size = 0;
  const abort = () => {void reader.cancel().catch(() => {});}; signal.addEventListener('abort', abort, {once: true});
  try {
    if (signal.aborted) throw new ObjectStoreError('UPLOAD_ABORTED', 'The original upload was interrupted.', 400);
    directory = await mkdtemp(join(tmpdir(), 'dis-private-original-')); await chmod(directory, 0o700);
    const path = join(directory, 'original.bin'); file = await open(path, 'wx', 0o600);
    for (;;) {
      const item = await reader.read();
      if (signal.aborted) throw new ObjectStoreError('UPLOAD_ABORTED', 'The original upload was interrupted or exceeded its time limit.', 400);
      if (item.done) break;
      size += item.value.byteLength;
      if (size > expected || size > PRIVATE_OBJECT_MAX_BYTES) throw new ObjectStoreError('UPLOAD_SIZE_INVALID', 'The original exceeds its reserved size.', 413);
      let offset = 0;
      while (offset < item.value.byteLength) {const written = await file.write(item.value, offset, item.value.byteLength - offset); if (!written.bytesWritten) throw Error('Incomplete private spool write'); offset += written.bytesWritten;}
      hash.update(item.value);
    }
    if (size !== expected) throw new ObjectStoreError('UPLOAD_INCOMPLETE', 'The original upload did not contain the reserved number of bytes.', 409);
    await file.close(); file = undefined; success = true;
    return {path, size, sha256: hash.digest('hex'), cleanup};
  } catch (error) {if (error instanceof ObjectStoreError) throw error; throw new ObjectStoreError('UPLOAD_FAILED', 'The original could not be verified in private temporary storage.');}
  finally {clearTimeout(timeout); signal.removeEventListener('abort', abort); await reader.cancel().catch(() => {}); reader.releaseLock(); await file?.close().catch(() => {}); if (!success) await cleanup();}
}
