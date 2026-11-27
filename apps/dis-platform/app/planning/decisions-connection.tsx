'use client';
import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import type {DecisionsConnectionStatus, DecisionsReadResult, DecisionsToolSummary} from '../../lib/integrations/decisions-contract';

const BASE = '/api/organizations/connections/decisions';
const MAX_READOUT = 50000, MAX_ARGUMENT_BYTES = 32768;
type Props = {organizationId: string; onUseReadout?: (text: string) => void};
type Field = {name: string; label: string; description: string; required: boolean; type: 'string' | 'number' | 'integer' | 'boolean'; schema: Record<string, unknown>};
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const fieldValue = (values: Record<string, string>, name: string) => Object.hasOwn(values, name) ? values[name] : '';
function simpleFields(schema: Record<string, unknown>): Field[] | null {
  // Render only scalar properties the provider actually advertised. Complex
  // schemas stay visible in the explicit JSON panel; never infer missing fields.
  if (schema.type !== 'object' || ['allOf', 'anyOf', 'oneOf', 'not', 'if', '$ref', 'dependentRequired', 'dependentSchemas', 'patternProperties'].some(key => key in schema)) return null;
  if (schema.properties !== undefined && !record(schema.properties)) return null;
  const properties = record(schema.properties) ? schema.properties : {}, keys = Object.keys(properties);
  if (keys.length > 12 || schema.required !== undefined && (!Array.isArray(schema.required) || schema.required.some(key => typeof key !== 'string' || !keys.includes(key)))) return null;
  if (record(schema.additionalProperties)) return null;
  const fields: Field[] = [];
  for (const name of keys) {
    const value = properties[name];
    if (!record(value) || !['string', 'number', 'integer', 'boolean'].includes(String(value.type)) || ['allOf', 'anyOf', 'oneOf', 'not', '$ref', 'const'].some(key => key in value)) return null;
    if (value.enum !== undefined && (!Array.isArray(value.enum) || value.enum.length > 50 || value.enum.some(option => !['string', 'number', 'boolean'].includes(typeof option)))) return null;
    fields.push({name, label: typeof value.title === 'string' ? value.title : name, description: typeof value.description === 'string' ? value.description : '',
      required: Array.isArray(schema.required) && schema.required.includes(name), type: value.type as Field['type'], schema: value});
  }
  return fields;
}
function argumentsFor(fields: Field[] | null, values: Record<string, string>, json: string, advanced: boolean): Record<string, unknown> {
  let args: Record<string, unknown>;
  if (advanced || !fields) {
    if (new TextEncoder().encode(json).byteLength > MAX_ARGUMENT_BYTES) throw Error('These inputs exceed the source request limit. Narrow the request before reading.');
    let parsed: unknown;
    try { parsed = JSON.parse(json); } catch { throw Error('Enter a JSON object that matches the displayed input contract.'); }
    if (!record(parsed)) throw Error('The inputs must be one JSON object.');
    args = parsed;
  } else {
    args = Object.create(null) as Record<string, unknown>;
    for (const field of fields) {
      const raw = fieldValue(values, field.name);
      if (!raw && !field.required) continue;
      if (Array.isArray(field.schema.enum)) {
        if (!raw) throw Error('Choose a value for ' + field.label + '.');
        const option = JSON.parse(raw);
        if (!field.schema.enum.some(item => item === option)) throw Error('Choose an advertised value for ' + field.label + '.');
        args[field.name] = option;
      } else if (field.type === 'string') {
        const length = Array.from(raw).length;
        if (typeof field.schema.minLength === 'number' && length < field.schema.minLength || typeof field.schema.maxLength === 'number' && length > field.schema.maxLength) throw Error(field.label + ' does not meet the source’s length limits.');
        args[field.name] = raw;
      } else if (field.type === 'boolean') {
        if (!['true', 'false'].includes(raw)) throw Error('Choose yes or no for ' + field.label + '.');
        args[field.name] = raw === 'true';
      } else {
        const number = Number(raw);
        if (!raw.trim() || !Number.isFinite(number) || field.type === 'integer' && !Number.isSafeInteger(number)) throw Error('Enter a valid number for ' + field.label + '.');
        if (typeof field.schema.minimum === 'number' && number < field.schema.minimum || typeof field.schema.maximum === 'number' && number > field.schema.maximum) throw Error(field.label + ' is outside the source’s allowed range.');
        args[field.name] = number;
      }
    }
  }
  if (new TextEncoder().encode(JSON.stringify(args)).byteLength > MAX_ARGUMENT_BYTES) throw Error('These inputs exceed the source request limit. Narrow the request before reading.');
  return args;
}
function returnedText(read: DecisionsReadResult) {
  const content = Array.isArray(read.result.content) ? read.result.content : [];
  const blocks = content.filter(item => record(item) && item.type === 'text' && typeof item.text === 'string').map(item => (item as {text: string}).text);
  if (record(read.result.structuredContent)) blocks.push('Structured source response:\n' + JSON.stringify(read.result.structuredContent, null, 2));
  const sourceText = blocks.join('\n\n');
  if (!sourceText.trim()) return '';
  return ['Decisions source readout', 'Retrieved: ' + read.retrievedAt, 'Source capability: ' + read.tool, 'Source resource: ' + read.resource,
    'Private source material. Review before use. This readout does not record a DIS approval or completed action.', '', sourceText].join('\n');
}
async function request(path: string, signal: AbortSignal, body?: unknown) {
  const response = await fetch(path, body === undefined ? {cache: 'no-store', signal} : {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(body), signal});
  const data = await response.json();
  if (!response.ok) throw Error(data.error || 'The connection could not be updated.');
  return data;
}

export default function DecisionsConnection(props: Props) {
  // A different organization gets fresh inputs, receipts and consent. The old
  // instance aborts requests and cannot redirect or call back into the new draft.
  return <OrganizationConnection key={props.organizationId} {...props}/>;
}
function OrganizationConnection({organizationId, onUseReadout}: Props) {
  const [connection, setConnection] = useState<DecisionsConnectionStatus | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState(''), [consent, setConsent] = useState(false);
  const [toolName, setToolName] = useState(''), [values, setValues] = useState<Record<string, string>>({}), [json, setJson] = useState('{}'), [advanced, setAdvanced] = useState(false);
  const [read, setRead] = useState<DecisionsReadResult | null>(null), [reviewed, setReviewed] = useState(false);
  const life = useRef({active: false, generation: 0, controller: null as AbortController | null, running: false});
  useLayoutEffect(() => {
    const slot = life.current; slot.active = true; slot.generation++; slot.controller = new AbortController(); slot.running = false;
    return () => {slot.active = false; slot.generation++; slot.running = false; slot.controller?.abort();};
  }, [organizationId]);
  useEffect(() => {
    const slot = life.current, generation = slot.generation, controller = slot.controller!;
    const current = () => slot.active && generation === slot.generation && !controller.signal.aborted;
    request(BASE + '?' + new URLSearchParams({organizationId}), controller.signal).then(data => {if (current()) setConnection(data.connection);})
      .catch(cause => {if (current()) setError(cause instanceof Error ? cause.message : 'Connection settings could not be checked.');});
  }, [organizationId]);
  const run = async (work: (current: () => boolean, signal: AbortSignal) => Promise<void>) => {
    const slot = life.current;
    if (!slot.active || slot.running || !slot.controller) return;
    const generation = slot.generation, controller = slot.controller;
    const current = () => slot.active && generation === slot.generation && !controller.signal.aborted;
    slot.running = true; setBusy(true); setError('');
    try { await work(current, controller.signal); }
    catch (cause) { if (current()) setError(cause instanceof Error ? cause.message : 'The connection could not be updated.'); }
    finally { if (current()) {slot.running = false; setBusy(false);} }
  };
  const clearResult = () => {setRead(null); setReviewed(false);};
  const available = (connection?.tools || []).filter(tool => tool.readEnabled === true && tool.readOnlyHint === true);
  const selected: DecisionsToolSummary | undefined = available.find(tool => tool.name === toolName);
  const fields = selected ? simpleFields(selected.inputSchema) : null;
  const readout = read ? returnedText(read) : '', tooLong = readout.length > MAX_READOUT;
  const choose = (name: string) => {setToolName(name); setValues({}); setJson('{}'); setAdvanced(false); clearResult(); setError('');};
  const connect = () => run(async (current, signal) => {
    clearResult();
    const data = await request(BASE + '/start', signal, {organizationId, consent: true});
    if (!current()) return;
    const target = new URL(data.authorizationUrl);
    if (target.origin !== 'https://api.meetingculture.ai' || target.pathname !== '/entra-proxy/authorize' || target.username || target.password || target.hash) throw Error('The authorization address did not match the approved connection.');
    if (current()) window.location.assign(target.href);
  });
  const discover = () => run(async (current, signal) => {
    const data = await request(BASE + '/discover', signal, {organizationId});
    if (!current()) return;
    setConnection(data.connection); choose('');
  });
  const disconnect = () => run(async (current, signal) => {
    const data = await request(BASE + '/disconnect', signal, {organizationId});
    if (!current()) return;
    setConnection(data.connection); setConsent(false); choose('');
  });
  const readSource = () => run(async (current, signal) => {
    if (!selected) throw Error('Choose an approved source read first.');
    const args = argumentsFor(fields, values, json, advanced), requestedTool = selected.name;
    clearResult();
    const data = await request(BASE + '/read', signal, {organizationId, tool: requestedTool, arguments: args});
    if (!current()) return;
    if (!record(data.read) || data.read.source !== 'Decisions' || data.read.tool !== requestedTool || data.read.resource !== 'https://api.meetingculture.ai/mcp' || typeof data.read.retrievedAt !== 'string' || !record(data.read.result) || data.read.sharing !== 'PRIVATE_TO_CONNECTED_MEMBER') throw Error('The source returned an unsupported receipt. No text was added to your draft.');
    setConnection(data.connection); setRead(data.read as DecisionsReadResult); setReviewed(false);
  });
  const useReadout = () => {
    if (!life.current.active || life.current.running || !onUseReadout || !read || !reviewed) return;
    if (!readout || readout.length > MAX_READOUT) {setError('This source readout does not fit the 50,000-character draft section. Make a narrower source request; nothing has been added.'); return;}
    try { if (life.current.active) {onUseReadout(readout); if (life.current.active) setReviewed(false);} }
    catch (cause) { if (life.current.active) setError(cause instanceof Error ? cause.message : 'The readout could not be added to a private draft.'); }
  };
  const connectionControls = <><label className="org-check"><input type="checkbox" checked={consent} disabled={busy} onChange={event => setConsent(event.target.checked)}/> Connect my own Decisions account to this DIS organization. I will review the provider’s permissions before authorizing it.</label><div className="org-actions"><button disabled={busy || !consent} onClick={connect}>Connect Decisions</button>{connection && ['AUTHORIZED', 'REAUTHORIZATION_REQUIRED', 'AUTHORIZATION_PENDING'].includes(connection.state) && <button disabled={busy} onClick={disconnect}>Disconnect my account</button>}</div><p className="org-muted">Disconnect removes the credentials saved in DIS. Manage the provider’s consent separately in your Microsoft account.</p></>;
  return <section className="org-card">
    <p className="org-eyebrow">OPTIONAL CONNECTION</p><h3>Bring in Decisions when your team uses it</h3>
    <p>DIS supports its own preparation, proposals, voting, and implementation planning. This connection can add permitted material from your existing Decisions account.</p>
    {error && <p className="org-alert" role="alert">{error}</p>}
    {!connection && !error && <p role="status">Checking connection settings…</p>}
    {connection && <>
      <span className="org-badge">{connection.state.replaceAll('_', ' ')}</span><p>{connection.message}</p>
      {connection.authorizedAt && <p className="org-muted">Authorization recorded {new Date(connection.authorizedAt).toLocaleString()}. Service access is checked for each discovery and read.</p>}
      {connection.canStart && (connection.state === 'AUTHORIZED' ? <details><summary>Connection settings</summary>{connectionControls}</details> : connectionControls)}
      {connection.state === 'AUTHORIZED' && <button disabled={busy} onClick={discover}>Check available reads</button>}
      {connection.lastDiscoveredAt && <p className="org-muted">Available capabilities checked {new Date(connection.lastDiscoveredAt).toLocaleString()}.</p>}
      {connection.state === 'AUTHORIZED' && available.length > 0 && <form onSubmit={event => {event.preventDefault(); void readSource();}}>
        <h4>Read a permitted source</h4><p>The returned material is visible to you. Choose what belongs in your private draft after reviewing it.</p>
        <label>Available read<select value={toolName} disabled={busy} onChange={event => choose(event.target.value)}><option value="">Choose a source read</option>{available.map(tool => <option key={tool.name} value={tool.name}>{tool.title || tool.name}</option>)}</select></label>
        {selected && <>
          {selected.description && <p>{selected.description}</p>}
          {fields && !advanced ? <div className="org-form-grid">{fields.map(field => <label key={field.name}>{field.label}{field.required ? ' (required)' : ' (optional)'}
            {Array.isArray(field.schema.enum) ? <select disabled={busy} value={fieldValue(values, field.name)} onChange={event => {setValues({...values, [field.name]: event.target.value}); clearResult();}}><option value="">Choose a value</option>{field.schema.enum.map((option, index) => <option key={index} value={JSON.stringify(option)}>{String(option)}</option>)}</select> : field.type === 'boolean' ? <select disabled={busy} value={fieldValue(values, field.name)} onChange={event => {setValues({...values, [field.name]: event.target.value}); clearResult();}}><option value="">Choose a value</option><option value="true">Yes</option><option value="false">No</option></select> : <input disabled={busy} value={fieldValue(values, field.name)} type={field.type === 'string' ? 'text' : 'number'} step={field.type === 'integer' ? 1 : 'any'} min={typeof field.schema.minimum === 'number' ? field.schema.minimum : undefined} max={typeof field.schema.maximum === 'number' ? field.schema.maximum : undefined} maxLength={field.type === 'string' && typeof field.schema.maxLength === 'number' && field.schema.maxLength >= 0 ? Math.min(field.schema.maxLength, MAX_ARGUMENT_BYTES) : MAX_ARGUMENT_BYTES} onChange={event => {setValues({...values, [field.name]: event.target.value}); clearResult();}}/>}
            {field.description && <span className="org-field-help">{field.description}</span>}
          </label>)}</div> : <label>Advanced JSON inputs<textarea rows={8} value={json} disabled={busy} onChange={event => {setJson(event.target.value); clearResult();}}/><span className="org-field-help">Use the exact input contract below. The source validates these inputs; DIS does not invent missing fields.</span></label>}
          {fields && <label className="org-check"><input type="checkbox" checked={advanced} disabled={busy} onChange={event => {setAdvanced(event.target.checked); clearResult();}}/> Use advanced JSON inputs</label>}
          <details><summary>Review the advertised input contract</summary><pre>{JSON.stringify(selected.inputSchema, null, 2)}</pre><p className="org-digest">Reviewed schema: {selected.schemaDigest}</p></details>
          <button type="submit" disabled={busy}>Read from Decisions</button>
        </>}
      </form>}
      {connection.state === 'AUTHORIZED' && connection.lastDiscoveredAt && available.length === 0 && <p>No source reads are enabled here yet. Your connection administrator can review the available capabilities. Continue working with native DIS documents and drafts.</p>}
      {connection.tools.length > 0 && <details><summary>Capabilities advertised by the connected service</summary><ul>{connection.tools.map(tool => <li key={tool.name}><strong>{tool.title || tool.name}</strong> — {tool.readEnabled ? 'Approved for a user-requested read' : 'Not enabled for calls in DIS'}{tool.description && <p>{tool.description}</p>}</li>)}</ul><p>Discovery describes capabilities. It does not import documents, grant access to every document, or authorize writes.</p></details>}
    </>}
    {read && <section aria-label="Decisions source readout">
      <h4>Review the returned source</h4><p>Source: Decisions · Capability: {read.tool} · Retrieved {new Date(read.retrievedAt).toLocaleString()}</p><p className="org-muted">This receipt confirms a source response was returned. The content has not been independently verified as an approved DIS decision or a completed action.</p>
      {readout ? <pre>{readout}</pre> : <p>This response contains no text or structured text to add. Inspect the full response below.</p>}
      <details><summary>Full source response and receipt</summary><pre>{JSON.stringify(read, null, 2)}</pre></details>
      {tooLong && <p className="org-alert" role="alert">The source readout contains {readout.length.toLocaleString()} characters and exceeds a draft section’s 50,000-character limit. Make a narrower source request. Nothing will be truncated or added.</p>}
      {onUseReadout && readout && !tooLong && <><label className="org-check"><input type="checkbox" checked={reviewed} disabled={busy} onChange={event => setReviewed(event.target.checked)}/> I reviewed this returned text and want to use it in an unsaved private draft.</label><button disabled={busy || !reviewed} onClick={useReadout}>Use in a private draft</button><p className="org-muted">You will review and save the draft yourself. Sharing it with your organization is a separate submission.</p></>}
    </section>}
    {busy && <p role="status">Working with your optional Decisions source…</p>}
  </section>;
}
