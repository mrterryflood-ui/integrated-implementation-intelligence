/** Optional Decisions integration. Vendor discovery observed 2026-11-27; a
 * configured client is not a vendor-accepted client or a witnessed connection. */
export const DECISIONS = Object.freeze({
  origin: 'https://api.meetingculture.ai',
  resource: 'https://api.meetingculture.ai/mcp',
  resourceMetadata: 'https://api.meetingculture.ai/.well-known/oauth-protected-resource/mcp',
  issuer: 'https://api.meetingculture.ai/entra-proxy',
  authorizationMetadata: 'https://api.meetingculture.ai/.well-known/oauth-authorization-server/entra-proxy',
  authorization: 'https://api.meetingculture.ai/entra-proxy/authorize',
  token: 'https://api.meetingculture.ai/entra-proxy/token',
  scope: 'api://app.boarddecisions.com/botid-3a432a73-84ab-4af9-abab-f4278dcdafdb/access_as_user',
  observedAt: '2026-11-27',
});
export const DECISIONS_CLIENT_PATH = '/api/integrations/decisions/client';
export const DECISIONS_CALLBACK_PATH = '/api/organizations/connections/decisions/callback';
export const DECISIONS_STATE_TTL_MS = 10 * 60 * 1000;

export class DecisionsError extends Error {
  constructor(public readonly code: string, message: string, public readonly status = 502) { super(message); }
}
export type DecisionsConfiguration = {
  publicOrigin: string;
  clientId: string;
  redirectUri: string;
  encryptionKey: Buffer;
  /** Exact reviewed tool name -> digest of its advertised input schema. Empty denies calls. */
  readAllowlist: Readonly<Record<string, string>>;
};
export type DecisionsToolSummary = {
  name: string; title: string; description: string;
  inputSchema: Record<string, unknown>; schemaDigest: string;
  readOnlyHint: boolean; readEnabled: boolean;
};
export type DecisionsDiscovery = {
  server: {name: string; version: string}; protocol: string;
  tools: DecisionsToolSummary[]; observedAt: string;
};
export type DecisionsConnectionStatus = {
  state: 'NOT_CONFIGURED' | 'NOT_CONNECTED' | 'AUTHORIZATION_PENDING' | 'AUTHORIZED' | 'REAUTHORIZATION_REQUIRED';
  authorizedAt: string | null; lastDiscoveredAt: string | null;
  expiresAt: string | null; tools: DecisionsToolSummary[];
  message: string; canStart: boolean;
  optional: true; sharing: 'PRIVATE_TO_CONNECTED_MEMBER';
};
export type DecisionsStartResult = {authorizationUrl: string; expiresAt: string};
export type DecisionsReadResult = {
  source: 'Decisions'; resource: typeof DECISIONS.resource; tool: string;
  retrievedAt: string; result: Record<string, unknown>;
  sharing: 'PRIVATE_TO_CONNECTED_MEMBER'; sourceVerifiedByProvider: false;
};

export function decisionsConfiguration(env: Record<string, string | undefined> = process.env): DecisionsConfiguration {
  let origin: URL;
  try { origin = new URL(env.DIS_PUBLIC_ORIGIN || ''); }
  catch { throw new DecisionsError('NOT_CONFIGURED', 'This optional connection is not configured. Your DIS workspace remains available.', 503); }
  if (origin.protocol !== 'https:' || origin.username || origin.password || origin.port || origin.search || origin.hash || origin.pathname !== '/' ||
      !origin.hostname.includes('.') || origin.hostname === 'localhost' || origin.hostname.endsWith('.localhost') || /^[\d.]+$/.test(origin.hostname) || origin.hostname.includes(':')) {
    throw new DecisionsError('NOT_CONFIGURED', 'This optional connection needs a configured public HTTPS address.', 503);
  }
  const encoded = env.DIS_CONNECTOR_ENCRYPTION_KEY || '';
  // Accept exactly a 256-bit hexadecimal or canonical base64/base64url key.
  let encryptionKey: Buffer;
  if (/^[a-f\d]{64}$/i.test(encoded)) encryptionKey = Buffer.from(encoded, 'hex');
  else if (/^[A-Za-z\d+/]{43}=$/.test(encoded)) encryptionKey = Buffer.from(encoded, 'base64');
  else if (/^[A-Za-z\d_-]{43}$/.test(encoded)) encryptionKey = Buffer.from(encoded, 'base64url');
  else throw new DecisionsError('NOT_CONFIGURED', 'Secure storage for this optional connection is not configured.', 503);
  if (encryptionKey.length !== 32) throw new DecisionsError('NOT_CONFIGURED', 'Secure storage for this optional connection is not configured.', 503);
  let raw: unknown = {};
  try { raw = JSON.parse(env.DIS_DECISIONS_READ_TOOL_ALLOWLIST || '{}'); }
  catch { throw new DecisionsError('NOT_CONFIGURED', 'The reviewed read capabilities need operator configuration.', 503); }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || Object.keys(raw).length > 100 ||
      Object.entries(raw).some(([name, hash]) => !/^[A-Za-z\d_.:-]{1,128}$/.test(name) || typeof hash !== 'string' || !/^[a-f\d]{64}$/.test(hash))) {
    throw new DecisionsError('NOT_CONFIGURED', 'The reviewed read capabilities need operator configuration.', 503);
  }
  return {publicOrigin: origin.origin, clientId: origin.origin + DECISIONS_CLIENT_PATH,
    redirectUri: origin.origin + DECISIONS_CALLBACK_PATH, encryptionKey,
    readAllowlist: Object.freeze({...raw as Record<string, string>})};
}

export function decisionsClientMetadata(config: DecisionsConfiguration) {
  return {client_id: config.clientId, client_name: 'DIS optional Decisions connection', client_uri: config.publicOrigin,
    redirect_uris: [config.redirectUri], grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'],
    token_endpoint_auth_method: 'none', scope: DECISIONS.scope + ' offline_access'};
}
