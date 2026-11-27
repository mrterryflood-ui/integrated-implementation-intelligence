#!/usr/bin/env node
/**
 * withdrawal-pointer-gate.v1
 *
 * Ledger item Q04, sprint S878. AI review, authored by the DIS-RPLICE campaign loop.
 * Not qualified human scientific acceptance, not clinical acceptance, and no patient
 * benefit is claimed or implied.
 *
 * Purpose: enforce that every field withdrawn from comparability-contract.v0.3.json by
 * a correction side-car carries exactly one pointer, in the register, from the withdrawn
 * field to its withdrawal and to its replacement. The defect this closes is C-S868-5:
 * contract v0.3 prints withdrawn values with no marker, so a consumer cannot tell a
 * live figure from a withdrawn one.
 *
 * Deterministic and offline: no clock, no randomness, no network, no filesystem write.
 * Exit 0 = every control passed and every mutant refused. Exit 63 = refusal. Exit 7 = usage.
 */
'use strict';
const fs = require('fs');
const crypto = require('crypto');

const DEFAULTS = {
  contract: 'research/fragmentation-harm/comparability-contract.v0.3.json',
  sidecars: ['research/fragmentation-harm/completeness-pivot-gate-s850.v1.json'],
  register: 'research/fragmentation-harm/withdrawal-pointer-register-q04.v1.json'
};

function parseArgs(argv) {
  const out = { sidecars: [], mutant: null, verbose: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--contract') out.contract = argv[++i];
    else if (a === '--sidecar') out.sidecars.push(argv[++i]);
    else if (a === '--register') out.register = argv[++i];
    else if (a === '--mutant') out.mutant = argv[++i];
    else if (a === '--verbose') out.verbose = true;
    else { return { error: 'unknown argument: ' + a }; }
  }
  if (!out.contract) out.contract = DEFAULTS.contract;
  if (!out.register) out.register = DEFAULTS.register;
  if (out.sidecars.length === 0) out.sidecars = DEFAULTS.sidecars.slice();
  return out;
}

// ---- path resolution: records[0].a.b -> tokens -----------------------------
function tokens(path) {
  const out = [];
  for (const seg of path.split('.')) {
    const m = seg.match(/^([A-Za-z0-9_]+)((?:\[\d+\])*)$/);
    if (!m) throw new Error('bad path segment: ' + seg);
    out.push(m[1]);
    for (const idx of m[2].match(/\[\d+\]/g) || []) out.push(Number(idx.slice(1, -1)));
  }
  return out;
}
function resolve(root, path) {
  let cur = root;
  for (const t of tokens(path)) {
    if (cur === null || cur === undefined) throw new Error('path not present: ' + path);
    if (typeof t === 'number') {
      if (!Array.isArray(cur) || t >= cur.length) throw new Error('path not present: ' + path);
      cur = cur[t];
    } else {
      if (typeof cur !== 'object' || !(t in cur)) throw new Error('path not present: ' + path);
      cur = cur[t];
    }
  }
  return cur;
}

// ---- canonical decimal at 12 dp, half-up on the printed double -------------
function dec12(x) {
  if (typeof x !== 'number' || !isFinite(x)) throw new Error('not a finite number: ' + x);
  return x.toFixed(12);
}
function isNum(v) { return typeof v === 'number' && isFinite(v); }

// ---- exact rational arithmetic over BigInt (repo convention) ---------------
function gcd(a, b) { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { const t = a % b; a = b; b = t; } return a || 1n; }
function F(n, d = 1n) { if (d < 0n) { n = -n; d = -d; } const g = gcd(n < 0n ? -n : n, d); return [n / g, d / g]; }
const sub = (a, b) => F(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
const mul = (a, b) => F(a[0] * b[0], a[1] * b[1]);
const div = (a, b) => F(a[0] * b[1], a[1] * b[0]);
function decF(f, dp = 12) {
  const neg = f[0] < 0n; let n = neg ? -f[0] : f[0]; const d = f[1];
  const sc = 10n ** BigInt(dp); let q = (n * sc) / d; const r = (n * sc) % d;
  if (r * 2n >= d) q += 1n;
  const s = q.toString().padStart(dp + 1, '0');
  return (neg ? '-' : '') + s.slice(0, s.length - dp) + '.' + s.slice(s.length - dp);
}

// ---- load ------------------------------------------------------------------
function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.error) { process.stderr.write('usage error: ' + args.error + '\n'); process.exit(7); }

  const contractRaw = fs.readFileSync(args.contract);
  const contract = JSON.parse(contractRaw.toString('utf8'));
  const sidecars = args.sidecars.map(p => ({ path: p, doc: readJson(p) }));
  let register = readJson(args.register);

  // ---- mutants are applied to the register only, never to the contract ------
  const MUTANTS = {
    'M1-drop-pointer': r => { r.withdrawal_pointers.pop(); },
    'M2-shift-withdrawn-value': r => { r.withdrawal_pointers[0].value_withdrawn = 0.403777800001; },
    'M3-drop-band': r => { delete r.identification_bands; },
    'M4-pointer-to-nonexistent-path': r => { r.withdrawal_pointers[0].path = 'records[0].resolution.no_such_field'; },
    'M5-duplicate-pointer': r => { r.withdrawal_pointers.push(JSON.parse(JSON.stringify(r.withdrawal_pointers[0]))); },
    'M6-band-equals-s868-quote': r => { r.identification_bands['records[0].contrast_pp'].identification_band_pp = [0.2026, 0.3778]; },
    'M7-wrong-blob-binding': r => { r.binds_to.blob_sha256 = '0'.repeat(64); },
    'M8-drop-orphan-pointer': r => { r.withdrawal_pointers = r.withdrawal_pointers.filter(p => p.path !== 'records[0].resolution.ordering_margin_harris_cases'); }
  };
  const mutantApplied = [];
  if (args.mutant) {
    if (!MUTANTS[args.mutant]) { process.stderr.write('unknown mutant: ' + args.mutant + '\n'); process.exit(7); }
    MUTANTS[args.mutant](register);
    mutantApplied.push(args.mutant);
  }

  const fail = (code, msg) => { process.stderr.write('REFUSED ' + code + ': ' + msg + '\n'); process.exit(63); };
  const controls = [];
  const ok = (code, detail) => controls.push({ code, detail });

  // ---- C01 contract identity ------------------------------------------------
  const sha256 = crypto.createHash('sha256').update(contractRaw).digest('hex');
  const blobSha = crypto.createHash('sha1')
    .update(Buffer.concat([Buffer.from('blob ' + contractRaw.length + '\0'), contractRaw]))
    .digest('hex');
  if (!register.binds_to || typeof register.binds_to !== 'object') fail('C01', 'register carries no binds_to block');
  if (register.binds_to.blob_sha256 !== sha256) {
    fail('C01', 'register binds to ' + register.binds_to.blob_sha256 + ' but the contract bytes hash to ' + sha256);
  }
  ok('C01', 'contract sha256 ' + sha256 + ', git blob ' + blobSha);

  // ---- C02 register is bound to the same file the side-cars withdraw from ---
  for (const s of sidecars) {
    if (!Array.isArray(s.doc.withdrawn_fields_in_v0_3)) fail('C02', s.path + ' has no withdrawn_fields_in_v0_3 array');
  }
  ok('C02', 'side-cars loaded: ' + sidecars.map(s => s.path).join(', '));

  // ---- C03..C07 pointer coverage, uniqueness, existence, value fidelity -----
  const pointers = register.withdrawal_pointers;
  if (!Array.isArray(pointers) || pointers.length === 0) fail('C03', 'register has no withdrawal_pointers');

  const seen = new Map();
  for (const p of pointers) {
    if (!p.path) fail('C03', 'a pointer carries no path');
    if (seen.has(p.path)) fail('C03', 'duplicate pointer for ' + p.path);
    seen.set(p.path, p);
    try { resolve(contract, p.path); } catch (e) { fail('C03', 'pointer names a path absent from the contract: ' + p.path); }
  }
  ok('C03', pointers.length + ' pointers, each resolving to exactly one contract path');

  let withdrawnCount = 0, substringCount = 0;
  const labellingDefects = [];
  for (const s of sidecars) {
    for (const w of s.doc.withdrawn_fields_in_v0_3) {
      const partial = / \(partial\)$/.test(w.path);
      const path = partial ? w.path.replace(/ \(partial\)$/, '') : w.path;
      const p = seen.get(path);
      if (!p) fail('C04', 'withdrawn field has no pointer: ' + path);
      let actual;
      try { actual = resolve(contract, path); } catch (e) { fail('C04', 'withdrawn path absent from contract: ' + path); }
      if (partial) {
        if (typeof actual !== 'string' || typeof w.value_withdrawn !== 'string') fail('C04', 'partial withdrawal on a non-string: ' + path);
        if (actual.indexOf(w.value_withdrawn) === -1) fail('C04', 'withdrawn substring not present in ' + path);
        if (p.kind !== 'field_substring') fail('C04', 'partial withdrawal ' + path + ' must be kind field_substring, register says ' + p.kind);
        substringCount++;
      } else if (isNum(w.value_withdrawn)) {
        if (!isNum(actual)) fail('C04', 'withdrawn value is numeric but the contract field is not: ' + path);
        if (dec12(actual) !== dec12(w.value_withdrawn)) {
          fail('C04', 'value drift at ' + path + ': side-car ' + dec12(w.value_withdrawn) + ', contract ' + dec12(actual));
        }
        if (p.kind !== 'field_value') fail('C04', path + ' must be kind field_value, register says ' + p.kind);
        if (dec12(p.value_withdrawn) !== dec12(w.value_withdrawn)) {
          fail('C04', 'register value for ' + path + ' disagrees with the side-car');
        }
        withdrawnCount++;
      } else {
        if (actual !== w.value_withdrawn) {
          const isPrefix = typeof actual === 'string' && typeof w.value_withdrawn === 'string' &&
            actual.length > w.value_withdrawn.length && actual.indexOf(w.value_withdrawn) === 0;
          if (!isPrefix) fail('C04', 'string drift at ' + path);
          if (p.kind !== 'field_substring') fail('C04', 'unlabelled prefix withdrawal at ' + path + ' must be declared kind field_substring in the register');
          labellingDefects.push(path + ' is withdrawn by a ' + w.value_withdrawn.length + '-character prefix of a ' + actual.length + '-character string but is not labelled (partial) in ' + s.path);
          substringCount++;
          continue;
        }
        if (p.kind !== 'field_value') fail('C04', path + ' must be kind field_value, register says ' + p.kind);
        withdrawnCount++;
      }
      if (!p.pointer_to || !p.pointer_to.file || !p.pointer_to.json_path) fail('C05', 'pointer for ' + path + ' names no target');
      const target = sidecars.find(x => x.path === p.pointer_to.file);
      if (!target) fail('C05', 'pointer for ' + path + ' targets a side-car not loaded: ' + p.pointer_to.file);
      try { resolve(target.doc, p.pointer_to.json_path); } catch (e) { fail('C05', 'pointer for ' + path + ' names a json_path absent from its side-car'); }
      if (!p.withdrawn_by || !Array.isArray(p.withdrawn_by) || p.withdrawn_by.length === 0) fail('C05', 'pointer for ' + path + ' names no withdrawal code');
      if (!p.replacement || typeof p.replacement.statement !== 'string' || p.replacement.statement.length < 20) {
        fail('C05', 'pointer for ' + path + ' carries no replacement statement');
      }
      if (p.replacement.json_path) {
        try { resolve(target.doc, p.replacement.json_path); } catch (e) { fail('C05', 'replacement json_path absent from ' + target.path + ': ' + p.replacement.json_path); }
      }
    }
  }
  ok('C04', withdrawnCount + ' exact-value withdrawals verified against contract bytes, ' + substringCount + ' partial withdrawals verified by containment');
  ok('C05', 'every pointer resolves to a live json_path inside a loaded side-car and names a withdrawal code');

  // ---- C06 no pointer without a withdrawal ---------------------------------
  const withdrawnPaths = new Set();
  for (const s of sidecars) for (const w of s.doc.withdrawn_fields_in_v0_3) withdrawnPaths.add(w.path.replace(/ \(partial\)$/, ''));
  for (const p of pointers) {
    if (withdrawnPaths.has(p.path)) continue;
    if (p.state !== 'DEPENDENT_ON_WITHDRAWN') {
      fail('C06', 'pointer for ' + p.path + ' is neither a listed withdrawal nor declared DEPENDENT_ON_WITHDRAWN');
    }
  }
  ok('C06', 'no undeclared pointer');

  // ---- C07..C10 recompute every carried quantity ----------------------------
  const rec = contract.records[0];
  const cells = rec.cells;
  // the contract prints average annual late counts; the side-car carries the five-year totals
  const lateH = F(BigInt(cells.hinds.average_annual_late) * 5n), totH = F(BigInt(589));
  const lateR = F(BigInt(cells.harris.average_annual_late) * 5n), totR = F(BigInt(8660));
  if (Number(cells.hinds.average_annual_late) * 5 !== 375) fail('C07', 'five times the Hinds average annual late count is not the carried 375');
  if (Number(cells.harris.average_annual_late) * 5 !== 5490) fail('C07', 'five times the Harris average annual late count is not the carried 5490');
  if (Number(cells.hinds.average_annual_late) !== 75) fail('C07', 'Hinds carried late count is not 75');
  if (Number(cells.harris.average_annual_late) !== 1098) fail('C07', 'Harris carried late count is not 1098');
  const sH = div(lateH, totH), sR = div(lateR, totR);
  const contrast = mul(sub(sH, sR), F(100n));
  const contrastRec = decF(contrast);
  if (dec12(rec.contrast_pp) !== contrastRec) {
    fail('C07', 'contrast_pp does not reproduce: contract ' + dec12(rec.contrast_pp) + ', exact ' + contrastRec);
  }
  ok('C07', 'contrast_pp ' + contrastRec + ' reproduces exactly from 375/589 and 5490/8660');

  const oneH = div(F(100n), totH), oneR = div(F(100n), totR);
  if (dec12(rec.resolution.one_case_pp.hinds) !== decF(oneH)) fail('C08', 'one_case_pp.hinds does not reproduce');
  if (dec12(rec.resolution.one_case_pp.harris) !== decF(oneR)) fail('C08', 'one_case_pp.harris does not reproduce');
  ok('C08', 'one_case_pp ' + decF(oneH) + ' and ' + decF(oneR) + ' reproduce exactly');

  const casesH = div(contrast, oneH), casesR = div(contrast, oneR);
  if (dec12(rec.resolution.contrast_in_cases.hinds) !== decF(casesH)) fail('C09', 'contrast_in_cases.hinds does not reproduce');
  if (dec12(rec.resolution.contrast_in_cases.harris) !== decF(casesR)) fail('C09', 'contrast_in_cases.harris does not reproduce');
  ok('C09', 'contrast_in_cases ' + decF(casesH) + ' and ' + decF(casesR) + ' reproduce exactly');

  // ---- C10 printed-cell rounding envelope ----------------------------------
  const printedH = Number(cells.hinds.percent_late), printedR = Number(cells.harris.percent_late);
  if (Math.round(Number(decF(mul(sH, F(100n)), 12)) * 10) / 10 !== printedH) fail('C10', 'Hinds printed percent is not the one-decimal rounding of the carried cells');
  if (Math.round(Number(decF(mul(sR, F(100n)), 12)) * 10) / 10 !== printedR) fail('C10', 'Harris printed percent is not the one-decimal rounding of the carried cells');
  const envLo = sub(F(BigInt(Math.round(printedH * 100) - 5), 100n), F(BigInt(Math.round(printedR * 100) + 5), 100n));
  const envHi = sub(F(BigInt(Math.round(printedH * 100) + 5), 100n), F(BigInt(Math.round(printedR * 100) - 5), 100n));
  const envLoD = decF(envLo), envHiD = decF(envHi);
  if (dec12(rec.resolution.printed_cell_envelope_pp[0]) !== envLoD) fail('C10', 'printed_cell_envelope_pp lower bound does not reproduce');
  if (dec12(rec.resolution.printed_cell_envelope_pp[1]) !== envHiD) fail('C10', 'printed_cell_envelope_pp upper bound does not reproduce');
  ok('C10', 'printed-cell rounding envelope ' + envLoD + ' to ' + envHiD + ' pp reproduces from the two printed one-decimal cells');

  // ---- C11 the identification band is attached and equals the envelope ------
  const bandEntry = register.identification_bands && register.identification_bands['records[0].contrast_pp'];
  if (!bandEntry) fail('C11', 'no identification band attached to records[0].contrast_pp');
  if (bandEntry.band_kind !== 'printed_cell_rounding_envelope') {
    fail('C11', 'band_kind is ' + bandEntry.band_kind + '; only a recomputable band may be attached');
  }
  if (dec12(bandEntry.identification_band_pp[0]) !== envLoD || dec12(bandEntry.identification_band_pp[1]) !== envHiD) {
    fail('C11', 'attached band ' + dec12(bandEntry.identification_band_pp[0]) + ' to ' + dec12(bandEntry.identification_band_pp[1]) +
      ' is not the recomputed envelope ' + envLoD + ' to ' + envHiD);
  }
  if (bandEntry.interval_open !== true) fail('C11', 'a rounding envelope is an open interval; interval_open must be true');
  const pointInBand = Number(contrastRec) > Number(envLoD) && Number(contrastRec) < Number(envHiD);
  if (!pointInBand) fail('C11', 'the printed point falls outside its own envelope');
  ok('C11', 'band ' + envLoD + ' to ' + envHiD + ' pp attached to contrast_pp, point ' + contrastRec + ' inside');

  // ---- C12 orphan scan: a live number whose only source is a withdrawn one --
  const withdrawnNums = [];
  for (const p of pointers) {
    if (p.kind === 'field_value' && isNum(p.value_withdrawn) && p.state !== 'DEPENDENT_ON_WITHDRAWN') {
      withdrawnNums.push({ path: p.path, value: p.value_withdrawn });
    }
  }
  const liveNums = [];
  (function walk(node, prefix) {
    if (node === null || typeof node !== 'object') return;
    for (const k of Object.keys(node)) {
      const v = node[k];
      const p = prefix ? prefix + '.' + k : k;
      if (isNum(v)) liveNums.push({ path: p, value: v });
      else if (typeof v === 'object') walk(v, p);
    }
  })(rec.resolution, 'records[0].resolution');
  const withdrawnSet = new Set(withdrawnNums.map(w => w.path));
  const detected = [];
  for (const live of liveNums) {
    if (withdrawnSet.has(live.path)) continue;
    if (/\.\d+$/.test(live.path)) continue; // array members are primitives, not derived scalars
    for (const w of withdrawnNums) {
      for (const other of liveNums) {
        if (other.path === live.path || withdrawnSet.has(other.path)) continue;
        const diff = Number(decF(sub(F(BigInt(Math.round(w.value * 1e12)), 10n ** 12n), F(BigInt(Math.round(other.value * 1e12)), 10n ** 12n))));
        if (Math.abs(diff - live.value) < 1e-9) {
          detected.push({ dependent: live.path, minuend: w.path, subtrahend: other.path, recomputed: Number(diff.toFixed(12)) });
        }
      }
    }
  }
  detected.sort((a, b) => (a.dependent + a.minuend).localeCompare(b.dependent + b.minuend));
  const declared = ((register.orphan_scan && register.orphan_scan.detected) || []).slice()
    .sort((a, b) => (a.dependent + a.minuend).localeCompare(b.dependent + b.minuend));
  if (detected.length !== declared.length) {
    fail('C12', 'orphan scan found ' + detected.length + ' dependency, register declares ' + declared.length);
  }
  for (let i = 0; i < detected.length; i++) {
    if (detected[i].dependent !== declared[i].dependent) fail('C12', 'orphan scan dependency mismatch at position ' + i);
    if (Math.abs(detected[i].recomputed - declared[i].recomputed) > 1e-12) fail('C12', 'orphan scan recomputation mismatch at ' + detected[i].dependent);
    const p = seen.get(detected[i].dependent);
    if (!p) fail('C12', 'orphan dependency ' + detected[i].dependent + ' carries no pointer');
    if (p.state !== 'DEPENDENT_ON_WITHDRAWN') fail('C12', 'orphan dependency ' + detected[i].dependent + ' must be state DEPENDENT_ON_WITHDRAWN');
  }
  ok('C12', 'orphan scan found ' + detected.length + ' live quantity whose only source is a withdrawn field, all pointed');

  // ---- C13 the withdrawn pivot is not silently restored ---------------------
  const pivotPrinted = dec12(rec.resolution.completeness_pivot_pp);
  if (pivotPrinted !== '0.403777800000') fail('C13', 'completeness_pivot_pp changed in the contract; this register is bound to a different state');
  ok('C13', 'completeness_pivot_pp still reads ' + pivotPrinted + ' in the contract and is pointed as withdrawn');

  // ---- C14 no substitution for the unmeasured primary outcome ---------------
  const fo = rec.follow_up_completion_after_abnormal_test;
  if (!fo || fo.state !== 'UNKNOWN') fail('C14', 'follow-up completion must remain UNKNOWN; no band or pivot may stand in for it');
  ok('C14', 'completed follow-up after an abnormal test remains UNKNOWN at both counties');

  // ---- C15 mechanism guard: no ancestry or biomarker variable is introduced -
  const banned = /^(race|races|ethnicity|ancestry|biomarker|msi|mmr)$/i;
  const offenders = [];
  (function walk(node, prefix) {
    if (node === null || typeof node !== 'object') return;
    for (const k of Object.keys(node)) {
      if (banned.test(k)) offenders.push(prefix + '.' + k);
      const v = node[k];
      if (v && typeof v === 'object') walk(v, prefix ? prefix + '.' + k : k);
    }
  })(register, '');
  if (offenders.length) fail('C15', 'register introduces ancestry or biomarker variables: ' + offenders.join(', '));
  ok('C15', 'no ancestry-linked or biomarker variable appears in the register; the mechanism assigned is measurement artefact');

  // ---- C16 authorship and authority statements are present ------------------
  for (const k of ['authorship', 'status', 'defect_closed', 'pilot_primary_outcome']) {
    if (!register[k] || typeof register[k] !== 'string') fail('C16', 'register omits ' + k);
  }
  if (!/AI review/i.test(register.authorship)) fail('C16', 'register authorship does not carry the AI review label');
  ok('C16', 'AI review label, status, defect and primary-outcome statements present');

  // ---- receipt -------------------------------------------------------------
  const receipt = {
    gate: 'withdrawal-pointer-gate.v1',
    ledger_item: 'Q04',
    sprint: 'S878',
    authorship: 'AI review, unverified by human - not scientific acceptance, not clinical acceptance, no patient benefit claimed or measured',
    contract: {
      path: args.contract,
      bytes: contractRaw.length,
      sha256,
      git_blob_sha1: blobSha
    },
    sidecars: sidecars.map(s => ({ path: s.path, withdrawn_fields: s.doc.withdrawn_fields_in_v0_3.length })),
    register: {
      path: args.register,
      pointers: pointers.length,
      by_state: pointers.reduce((acc, p) => { acc[p.state] = (acc[p.state] || 0) + 1; return acc; }, {}),
      paths: pointers.map(p => p.path).sort()
    },
    recomputed: {
      contrast_pp: contrastRec,
      one_case_pp: { hinds: decF(oneH), harris: decF(oneR) },
      contrast_in_cases: { hinds: decF(casesH), harris: decF(casesR) },
      printed_cell_envelope_pp: { lower: envLoD, upper: envHiD, width_pp: decF(sub(envHi, envLo)) }
    },
    identification_band_pp: {
      target: 'records[0].contrast_pp',
      band: [envLoD, envHiD],
      band_kind: bandEntry.band_kind,
      point_inside: pointInBand
    },
    orphan_scan: detected,
    sidecar_labelling_defects: labellingDefects,
    controls: controls.length,
    controls_passed: controls.map(c => c.code).sort(),
    mutants_applied: mutantApplied,
    verdict: 'PASS',
    limits: [
      'this gate reads three files and executes no repository test, lint, type check, build or CI leg of its own',
      'it proves the pointer layer is complete against the side-car it is given, not against withdrawals recorded anywhere else',
      'it asserts no county measurement; completed 180-day follow-up after an abnormal screening-indication colorectal test remains unmeasured at both counties'
    ]
  };
  process.stdout.write(JSON.stringify(receipt, null, 2) + '\n');
  process.exit(0);
}

try { main(); } catch (e) { process.stderr.write('REFUSED EXCEPTION: ' + (e && e.message) + '\n'); process.exit(63); }
