/**
 * DIS -> RPLICE private partner adapter.
 * No browser key, automatic cross-account data sharing, mock fallback,
 * user-entered remote URL, or claim that model-simulated lenses are humans.
 */
export const RPLICE_DEFAULT_ORIGIN = "https://www.bettersciencelab.com";
export const PARALLAX_EVIDENCE_STATE = "OPERATOR_DECLARED_UNVERIFIED";

export type RpliceBridgeEnv = {
  RPLICE_BASE_URL?: string;
  RPLICE_API_KEY?: string;
};
export type Perspective = {
  id: string;
  name: string;
  role?: string;
  angle?: string;
  visible?: string[];
  invisible?: string[];
  unknownKnowns?: string[];
  pricesWhom?: string[];
};
export class RpliceBridgeError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
    this.name = "RpliceBridgeError";
  }
}
function urlFromEnv(env: RpliceBridgeEnv) {
  const configured = (env.RPLICE_BASE_URL || RPLICE_DEFAULT_ORIGIN).trim();
  let url: URL;
  try { url = new URL(configured); }
  catch { throw new RpliceBridgeError(503, "RPLICE base URL not configured correctly"); }
  if (
    url.protocol !== "https:" ||
    url.username || url.password || url.search || url.hash ||
    (url.pathname !== "/" && url.pathname !== "") ||
    !url.hostname || url.port
  ) {
    throw new RpliceBridgeError(503, "RPLICE must use an HTTPS origin without credentials, path or port");
  }
  return url.origin;
}
const tidy = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
function strings(value: unknown, count = 12) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, count).filter((x): x is string => typeof x === "string")
    .map(x => tidy(x, 280)).filter(Boolean);
}
export function validatePerspectives(value: unknown): Perspective[] {
  if (!Array.isArray(value) || value.length < 2 || value.length > 12)
    throw new RpliceBridgeError(400, "Supply two to twelve stakeholder perspectives");
  const parsed = value.map(raw => {
    if (!raw || typeof raw !== "object") throw new RpliceBridgeError(400, "Invalid stakeholder perspective");
    const s = raw as Record<string, unknown>;
    const id = tidy(s.id, 100), name = tidy(s.name, 120);
    if (!id || !name || !/^[\w-]+$/.test(id)) throw new RpliceBridgeError(400, "Each perspective requires a valid identifier and name");
    return {
      id, name, role: tidy(s.role, 160), angle: tidy(s.angle, 600),
      visible: strings(s.visible), invisible: strings(s.invisible),
      unknownKnowns: strings(s.unknownKnowns), pricesWhom: strings(s.pricesWhom),
    };
  });
  if (new Set(parsed.map(p => p.id)).size !== parsed.length)
    throw new RpliceBridgeError(400, "Stakeholder identifiers must be unique");
  return parsed;
}
export async function readRpliceContract(env: RpliceBridgeEnv, fetcher: typeof fetch = fetch) {
  const origin = urlFromEnv(env);
  let response: Response;
  try {
    response = await fetcher(origin + "/api/v1/connect/exchange-contract", {
      method: "GET", cache: "no-store", headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(7000),
    });
  } catch { throw new RpliceBridgeError(503, "RPLICE connection unavailable"); }
  if (!response.ok) throw new RpliceBridgeError(503, "RPLICE contract unavailable");
  const obj = await response.json().catch(() => null);
  if (!obj || typeof obj !== "object" ||
      typeof obj.contractVersion !== "string" ||
      !obj.surfaces?.publicMethodology || !obj.mcp?.catalog) {
    throw new RpliceBridgeError(503, "RPLICE contract did not match the expected shape");
  }
  return { state: "CONTRACT_DISCOVERED_NOT_USER_AUTHORIZED", version: obj.contractVersion,
    supportsParallax: false, note: "Contract discovery alone does not prove that private tools, organizational approval or data exchange are operational." };
}
export async function compareRpliceParallax(
  input: { scenario?: unknown; stakeholders: unknown },
  env: RpliceBridgeEnv,
  fetcher: typeof fetch = fetch,
) {
  const base = urlFromEnv(env);
  const key = env.RPLICE_API_KEY?.trim() || "";
  if (!key || !/^rplice_[a-f\d]{32,}$/i.test(key))
    throw new RpliceBridgeError(503, "RPLICE private partner connection not configured");
  const stakeholders = validatePerspectives(input.stakeholders);
  const scenario = tidy(input.scenario, 4000);
  let response: Response;
  try {
    response = await fetcher(base + "/api/v1/public/parallax/compare", {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(10000),
      headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: "Bearer " + key },
      body: JSON.stringify({ scenario, stakeholders }),
    });
  } catch { throw new RpliceBridgeError(503, "RPLICE analysis temporarily unavailable"); }
  if (response.status === 401 || response.status === 403) throw new RpliceBridgeError(503, "RPLICE partner authorization unavailable");
  if (!response.ok) throw new RpliceBridgeError(503, "RPLICE Parallax engine unavailable");
  let payload: any;
  try { payload = await response.json(); }
  catch { throw new RpliceBridgeError(503, "RPLICE returned an invalid response"); }
  if (payload?.result?.state !== PARALLAX_EVIDENCE_STATE ||
      !Array.isArray(payload.result.displacement) ||
      !Array.isArray(payload.result.asymmetry) ||
      !payload.provenance || payload.provenance.model !== "deterministic") {
    throw new RpliceBridgeError(503, "RPLICE Parallax did not provide verifiable output metadata");
  }
  return { ...payload, source: "RPLICE", factState: PARALLAX_EVIDENCE_STATE,
    assurance: "An operator-declared comparison is not verified human testimony, stakeholder agreement, causal evidence or independently validated outcome." };
}
