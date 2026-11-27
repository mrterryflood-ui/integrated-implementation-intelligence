import {createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual} from 'node:crypto';
import {NetworkBudget, asRecord} from '../ecosystem/transport';
import {DECISIONS, DECISIONS_STATE_TTL_MS, DecisionsError, type DecisionsConfiguration} from './decisions-contract';

export type DecisionsBinding = {organizationId: string; subject: string; generation: string};
export type DecisionsPending = {state: string; verifier: string; clientId: string; redirectUri: string; issuer: string; resource: string; expiresAt: string; requireResponseIssuer: boolean};
export type DecisionsTokens = {accessToken: string; refreshToken: string | null; expiresAt: string; scopes: string[]};
const aad = (binding: DecisionsBinding, purpose: 'pending' | 'tokens') => Buffer.from(JSON.stringify({version: 1, purpose, ...binding}));
export const decisionsStateHash = (state: string) => createHash('sha256').update(state).digest('hex');

export function sealDecisions(value: unknown, config: DecisionsConfiguration, binding: DecisionsBinding, purpose: 'pending' | 'tokens'): string {
  const bytes = Buffer.from(JSON.stringify(value));
  if (bytes.byteLength > 64000) throw new DecisionsError('SECRET_TOO_LARGE', 'The connection response exceeds its storage limit.');
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', config.encryptionKey, iv);
  cipher.setAAD(aad(binding, purpose));
  const encrypted = Buffer.concat([cipher.update(bytes), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), encrypted.toString('base64url')].join('.');
}
export function openDecisions(value: string, config: DecisionsConfiguration, binding: DecisionsBinding, purpose: 'pending' | 'tokens'): Record<string, unknown> {
  try {
    if (typeof value !== 'string' || value.length > 90000) throw Error();
    const parts = value.split('.');
    if (parts.length !== 4 || parts[0] !== 'v1' || parts.slice(1).some(x => !/^[A-Za-z\d_-]+$/.test(x))) throw Error();
    const iv = Buffer.from(parts[1], 'base64url'), tag = Buffer.from(parts[2], 'base64url');
    if (iv.length !== 12 || tag.length !== 16) throw Error();
    const decipher = createDecipheriv('aes-256-gcm', config.encryptionKey, iv);
    decipher.setAAD(aad(binding, purpose)); decipher.setAuthTag(tag);
    return asRecord(JSON.parse(Buffer.concat([decipher.update(Buffer.from(parts[3], 'base64url')), decipher.final()]).toString('utf8')));
  } catch { throw new DecisionsError('SAVED_CONNECTION_INVALID', 'The saved connection cannot be opened. Connect your account again.', 409); }
}
const includes = (value: unknown, item: string) => Array.isArray(value) && value.includes(item);
export async function verifyDecisionsDiscovery(budget: NetworkBudget): Promise<{requireResponseIssuer: boolean}> {
  const resourceWire = await budget.request(DECISIONS.resourceMetadata, {headers: {accept: 'application/json'}}, DECISIONS.origin);
  const authWire = await budget.request(DECISIONS.authorizationMetadata, {headers: {accept: 'application/json'}}, DECISIONS.origin);
  if (resourceWire.status !== 200 || authWire.status !== 200) throw new DecisionsError('DISCOVERY_UNAVAILABLE', 'Decisions connection details are temporarily unavailable.');
  const resource = asRecord(resourceWire.data), auth = asRecord(authWire.data);
  if (resource.resource !== DECISIONS.resource || !Array.isArray(resource.authorization_servers) ||
      resource.authorization_servers.length !== 1 || resource.authorization_servers[0] !== DECISIONS.issuer ||
      !includes(resource.bearer_methods_supported, 'header') || !includes(resource.scopes_supported, DECISIONS.scope) ||
      !includes(resource.scopes_supported, 'offline_access') || auth.issuer !== DECISIONS.issuer ||
      auth.authorization_endpoint !== DECISIONS.authorization || auth.token_endpoint !== DECISIONS.token ||
      auth.client_id_metadata_document_supported !== true || !includes(auth.code_challenge_methods_supported, 'S256') ||
      !includes(auth.response_types_supported, 'code') || !includes(auth.grant_types_supported, 'authorization_code') ||
      !includes(auth.token_endpoint_auth_methods_supported, 'none')) {
    throw new DecisionsError('DISCOVERY_CHANGED', 'Decisions connection requirements changed. An operator must review the integration before connecting.', 503);
  }
  return {requireResponseIssuer: auth.authorization_response_iss_parameter_supported === true};
}
export function prepareDecisionsAuthorization(config: DecisionsConfiguration, requireResponseIssuer = false, now = Date.now()) {
  const state = randomBytes(32).toString('base64url'), verifier = randomBytes(48).toString('base64url');
  const pending: DecisionsPending = {state, verifier, clientId: config.clientId, redirectUri: config.redirectUri,
    resource: DECISIONS.resource, issuer: DECISIONS.issuer, expiresAt: new Date(now + DECISIONS_STATE_TTL_MS).toISOString(), requireResponseIssuer};
  const url = new URL(DECISIONS.authorization);
  url.search = new URLSearchParams({client_id: pending.clientId, redirect_uri: pending.redirectUri, response_type: 'code',
    scope: DECISIONS.scope + ' offline_access', resource: pending.resource, state,
    code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256'}).toString();
  return {pending, authorizationUrl: url.href};
}
export function parseDecisionsCallback(params: URLSearchParams) {
  for (const field of ['state', 'code', 'error', 'iss']) if (params.getAll(field).length > 1) throw new DecisionsError('INVALID_CALLBACK', 'The connection response is invalid. Start again.', 400);
  const state = params.get('state') || '', code = params.get('code'), error = params.get('error'), issuer = params.get('iss');
  if (!/^[A-Za-z\d_-]{43}$/.test(state) || (!!code === !!error) || (code && (code.length > 8192 || /[\u0000-\u001f\u007f]/.test(code))) ||
      (error && (error.length > 200 || !/^[A-Za-z\d_.-]+$/.test(error))) || (issuer !== null && issuer !== DECISIONS.issuer)) {
    throw new DecisionsError('INVALID_CALLBACK', 'The connection response is invalid. Start again.', 400);
  }
  return {state, code, error, issuer};
}
export function validateDecisionsPending(raw: Record<string, unknown>, state: string, issuer: string | null, config: DecisionsConfiguration, now = Date.now()): DecisionsPending {
  const pending = raw as unknown as DecisionsPending;
  if (typeof pending.state !== 'string' || !/^[A-Za-z\d_-]{43}$/.test(pending.state) || !/^[A-Za-z\d_-]{43}$/.test(state) ||
      !timingSafeEqual(Buffer.from(pending.state), Buffer.from(state)) || typeof pending.verifier !== 'string' || !/^[A-Za-z\d_-]{64}$/.test(pending.verifier) ||
      pending.clientId !== config.clientId || pending.redirectUri !== config.redirectUri || pending.issuer !== DECISIONS.issuer || pending.resource !== DECISIONS.resource ||
      typeof pending.expiresAt !== 'string' || !Number.isFinite(Date.parse(pending.expiresAt)) || Date.parse(pending.expiresAt) <= now ||
      Date.parse(pending.expiresAt) > now + DECISIONS_STATE_TTL_MS || typeof pending.requireResponseIssuer !== 'boolean' ||
      (pending.requireResponseIssuer && issuer !== DECISIONS.issuer)) {
    throw new DecisionsError('EXPIRED_STATE', 'This connection request is invalid or expired. Start again.', 400);
  }
  return pending;
}
function tokenText(value: unknown): value is string { return typeof value === 'string' && value.length > 0 && value.length <= 24000 && !/[\u0000-\u0020\u007f]/.test(value); }
export function validateDecisionsTokens(raw: Record<string, unknown>, previous: DecisionsTokens | null, now = Date.now()): DecisionsTokens {
  if (!tokenText(raw.access_token) || typeof raw.token_type !== 'string' || raw.token_type.toLowerCase() !== 'bearer' ||
      typeof raw.expires_in !== 'number' || !Number.isSafeInteger(raw.expires_in) || raw.expires_in < 30 || raw.expires_in > 86400 ||
      (raw.refresh_token !== undefined && !tokenText(raw.refresh_token)) || (raw.scope !== undefined && (typeof raw.scope !== 'string' || raw.scope.length > 4096))) {
    throw new DecisionsError('INVALID_TOKEN_RESPONSE', 'Decisions returned an unsupported authorization response. Connect again.');
  }
  const scopes = raw.scope === undefined ? (previous?.scopes || [DECISIONS.scope, 'offline_access']) : (raw.scope as string).split(/\s+/).filter(Boolean);
  if (!scopes.includes(DECISIONS.scope)) throw new DecisionsError('SCOPE_DENIED', 'Decisions did not grant the required meeting access.', 403);
  // Explicit response resource/issuer claims, if supplied, must match the pinned contract.
  if ((raw.resource !== undefined && raw.resource !== DECISIONS.resource) || (raw.issuer !== undefined && raw.issuer !== DECISIONS.issuer)) {
    throw new DecisionsError('TOKEN_BINDING_INVALID', 'The authorization response does not match this connection.');
  }
  return {accessToken: raw.access_token, refreshToken: raw.refresh_token as string || previous?.refreshToken || null,
    expiresAt: new Date(now + raw.expires_in * 1000).toISOString(), scopes};
}
export function validateStoredDecisionsTokens(raw: Record<string, unknown>): DecisionsTokens {
  if (!tokenText(raw.accessToken) || (raw.refreshToken !== null && !tokenText(raw.refreshToken)) || typeof raw.expiresAt !== 'string' ||
      !Number.isFinite(Date.parse(raw.expiresAt)) || !Array.isArray(raw.scopes) || raw.scopes.some(x => typeof x !== 'string') || !raw.scopes.includes(DECISIONS.scope)) {
    throw new DecisionsError('SAVED_CONNECTION_INVALID', 'The saved connection is invalid. Connect your account again.', 409);
  }
  return raw as unknown as DecisionsTokens;
}
export async function exchangeDecisionsToken(config: DecisionsConfiguration, budget: NetworkBudget, grant: {code: string; pending: DecisionsPending} | {previous: DecisionsTokens}, now = Date.now()): Promise<DecisionsTokens> {
  const body = new URLSearchParams({client_id: config.clientId, resource: DECISIONS.resource});
  let previous: DecisionsTokens | null = null;
  if ('code' in grant) {
    body.set('grant_type', 'authorization_code'); body.set('code', grant.code);
    body.set('redirect_uri', grant.pending.redirectUri); body.set('code_verifier', grant.pending.verifier);
  } else {
    previous = grant.previous;
    if (!previous.refreshToken) throw new DecisionsError('REAUTHORIZATION_REQUIRED', 'Connect your account again to renew access.', 401);
    body.set('grant_type', 'refresh_token'); body.set('refresh_token', previous.refreshToken);
  }
  const wire = await budget.request(DECISIONS.token, {method: 'POST', headers: {'content-type': 'application/x-www-form-urlencoded', accept: 'application/json'}, body: body.toString()}, DECISIONS.origin);
  if (wire.status === 400 || wire.status === 401 || wire.status === 403) throw new DecisionsError('REAUTHORIZATION_REQUIRED', 'Decisions did not authorize this connection. Connect your account again.', 401);
  if (wire.status !== 200) throw new DecisionsError('TOKEN_UNAVAILABLE', 'Decisions authorization is temporarily unavailable.');
  return validateDecisionsTokens(asRecord(wire.data), previous, now);
}
