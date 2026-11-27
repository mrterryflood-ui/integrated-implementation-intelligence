import {createHash, randomUUID} from 'node:crypto';
import {NetworkBudget, asRecord, parseRpc, boundedText} from '../ecosystem/transport';
import {DECISIONS, DecisionsError, type DecisionsConfiguration, type DecisionsDiscovery, type DecisionsToolSummary} from './decisions-contract';

// PostgreSQL JSONB may reorder object keys. Pin the schema's contents, not key order.
const canonical = (value: unknown): string => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']' :
  value !== null && typeof value === 'object' ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical((value as Record<string, unknown>)[key])).join(',') + '}' : JSON.stringify(value);
export const decisionsSchemaDigest = (schema: Record<string, unknown>) => createHash('sha256').update(canonical(schema)).digest('hex');
export function parseDecisionsTool(value: unknown, config: DecisionsConfiguration): DecisionsToolSummary {
  const tool = asRecord(value), annotations = tool.annotations === undefined ? {} : asRecord(tool.annotations);
  if (typeof tool.name !== 'string' || !/^[A-Za-z\d_.:-]{1,128}$/.test(tool.name)) throw new DecisionsError('TOOL_SCHEMA_INVALID', 'Decisions returned an unsupported capability name.');
  const inputSchema = asRecord(tool.inputSchema);
  if (inputSchema.type !== 'object' || Buffer.byteLength(JSON.stringify(inputSchema)) > 32768) throw new DecisionsError('TOOL_SCHEMA_INVALID', 'Decisions returned an unsupported input contract.');
  const schemaDigest = decisionsSchemaDigest(inputSchema);
  const readOnlyHint = annotations.readOnlyHint === true && annotations.destructiveHint !== true;
  return {name: tool.name, title: boundedText(tool.title, 180) || tool.name, description: boundedText(tool.description, 1600), inputSchema, schemaDigest,
    readOnlyHint, readEnabled: readOnlyHint && config.readAllowlist[tool.name] === schemaDigest};
}

/** Discovery and reviewed reads only. No model-supplied URL or unrestricted tools/call. */
export async function decisionsMcpSession(accessToken: string, config: DecisionsConfiguration, budget: NetworkBudget, now = Date.now()) {
  let protocol = '2025-06-18', session: string | null = null;
  const headers = () => new Headers({'content-type': 'application/json', accept: 'application/json, text/event-stream',
    authorization: 'Bearer ' + accessToken, 'MCP-Protocol-Version': protocol, ...(session ? {'Mcp-Session-Id': session} : {})});
  const send = async (method: string, params: Record<string, unknown>) => {
    const id = randomUUID(), wire = await budget.request(DECISIONS.resource,
      {method: 'POST', headers: headers(), body: JSON.stringify({jsonrpc: '2.0', id, method, params})}, DECISIONS.origin);
    if (wire.status === 401 || wire.status === 403) throw new DecisionsError('REAUTHORIZATION_REQUIRED', 'Decisions access was denied. Connect again or ask your organization administrator to review access.', 401);
    if (wire.status < 200 || wire.status >= 300) throw new DecisionsError('MCP_UNAVAILABLE', 'Decisions did not return a successful response.');
    return {wire, result: parseRpc(wire, id)};
  };
  const initialized = await send('initialize', {protocolVersion: protocol, capabilities: {}, clientInfo: {name: 'dis-optional-decisions', version: '1.0.0'}});
  if (!['2025-03-26', '2025-06-18', '2025-11-25'].includes(String(initialized.result.protocolVersion))) throw new DecisionsError('MCP_PROTOCOL_CHANGED', 'The Decisions protocol needs an operator review.');
  protocol = String(initialized.result.protocolVersion);
  session = initialized.wire.headers.get('mcp-session-id');
  if (session && (session.length > 256 || /[^\x21-\x7e]/.test(session))) throw new DecisionsError('MCP_SESSION_INVALID', 'Decisions returned an invalid session.');
  const info = asRecord(initialized.result.serverInfo), server = {name: boundedText(info.name, 100), version: boundedText(info.version, 80)};
  if (!server.name || !server.version || !asRecord(initialized.result.capabilities).tools) throw new DecisionsError('MCP_CAPABILITIES_INVALID', 'Decisions did not advertise supported tool discovery.');
  const notified = await budget.request(DECISIONS.resource, {method: 'POST', headers: headers(), body: JSON.stringify({jsonrpc: '2.0', method: 'notifications/initialized'})}, DECISIONS.origin);
  if (notified.status < 200 || notified.status >= 300) throw new DecisionsError('MCP_INITIALIZATION_FAILED', 'Decisions could not initialize this connection.');
  const tools: DecisionsToolSummary[] = [], names = new Set<string>(), cursors = new Set<string>();
  let cursor: string | undefined;
  for (let page = 0; page < 4; page++) {
    const listing = (await send('tools/list', cursor ? {cursor} : {})).result;
    if (!Array.isArray(listing.tools) || listing.tools.length > 200 || tools.length + listing.tools.length > 200) throw new DecisionsError('TOOL_LIST_TOO_LARGE', 'Decisions capability discovery exceeded its supported limit.');
    for (const value of listing.tools) {
      const tool = parseDecisionsTool(value, config);
      if (names.has(tool.name)) throw new DecisionsError('TOOL_DUPLICATE', 'Decisions returned conflicting capability definitions.');
      names.add(tool.name); tools.push(tool);
    }
    if (listing.nextCursor === undefined || listing.nextCursor === null) { cursor = undefined; break; }
    if (typeof listing.nextCursor !== 'string' || !listing.nextCursor || listing.nextCursor.length > 2048 || cursors.has(listing.nextCursor)) throw new DecisionsError('TOOL_CURSOR_INVALID', 'Decisions returned invalid capability pagination.');
    cursor = listing.nextCursor; cursors.add(cursor);
  }
  if (cursor) throw new DecisionsError('TOOL_LIST_INCOMPLETE', 'Decisions has more capabilities than this connection can safely inspect.');
  const discovery: DecisionsDiscovery = {server, protocol, tools, observedAt: new Date(now).toISOString()};
  if (Buffer.byteLength(JSON.stringify(discovery)) > 262144) throw new DecisionsError('TOOL_LIST_TOO_LARGE', 'The capability catalog exceeds its storage limit.');
  return {discovery, read: async (name: string, args: Record<string, unknown>) => {
    const tool = tools.find(item => item.name === name);
    if (!tool?.readEnabled || !tool.readOnlyHint || config.readAllowlist[name] !== tool.schemaDigest) throw new DecisionsError('READ_NOT_REVIEWED', 'This source capability has not been approved for reading in DIS.', 403);
    if (!args || typeof args !== 'object' || Array.isArray(args) || Buffer.byteLength(JSON.stringify(args)) > 32768) throw new DecisionsError('READ_INPUT_INVALID', 'The read request exceeds its supported input boundary.', 400);
    const called = (await send('tools/call', {name, arguments: args})).result;
    if (called.isError === true) throw new DecisionsError('READ_FAILED', 'Decisions reported that this read did not succeed.');
    if (!Array.isArray(called.content) && (!called.structuredContent || typeof called.structuredContent !== 'object')) throw new DecisionsError('READ_RESPONSE_INVALID', 'Decisions returned an unsupported read response.');
    return called;
  }};
}
