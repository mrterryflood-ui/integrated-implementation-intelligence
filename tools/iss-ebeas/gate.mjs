/** ISS-EBEAS 1.1.0 / evidence.1 + evidence.2-static.
 * Build validates requirements and scope. Release validates independently collected
 * receipts and invokes a signature verifier. Neither stage certifies legal/store
 * compliance, actual delivery, or a beneficiary outcome. No manifest commands run.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MAX_FILE = 25_000_000;
const SHA = /^[a-f0-9]{40}$/;
const HASH = /^[a-f0-9]{64}$/;
const OUTPUT = 'audit/attestation.json';
const EXCLUDED = new Set(['node_modules','.git','dist','build','coverage','.next','__pycache__']);
const CODE = /\.(?:[cm]?[jt]sx?|py|html?|css|json|swift|kt|java|vue|svelte|c|cc|cpp|cxx|h|hh|hpp|ino|sh|bash)$/;
export const REQUIREMENTS = [
  'REQ-EBEAS-JOURNEY','REQ-EBEAS-A11Y','REQ-EBEAS-PERFORMANCE','REQ-EBEAS-PERMISSIONS',
  'REQ-EBEAS-OFFLINE-DDIL','REQ-EBEAS-PRIVACY','REQ-EBEAS-CRYPTO','REQ-EBEAS-SUPPLY-CHAIN',
  'REQ-EBEAS-APPLICABILITY','REQ-EBEAS-AUTHORITY',
  'REQ-EBEAS-SOURCE','REQ-EBEAS-SCOPE','REQ-EBEAS-MANIFEST','REQ-EBEAS-BUILD','REQ-EBEAS-BOUNDARY',
  'REQ-EBEAS-STATES','REQ-EBEAS-COMMIT','REQ-EBEAS-MOTION','REQ-EBEAS-COLD-USERS','REQ-EBEAS-CLAIMS',
  'REQ-EBEAS-IDENTITY-CONTINUITY','REQ-EBEAS-ENTITY-ISOLATION','REQ-EBEAS-SOURCE-TRUTH',
  'REQ-EBEAS-E2E','REQ-EBEAS-PERSISTENCE','REQ-EBEAS-AUDIT','REQ-EBEAS-REVIEW','REQ-EBEAS-ROLLBACK','REQ-EBEAS-SUSTAINMENT',
];
export const canonical = value => JSON.stringify(sort(value));
function sort(value) {
  if (Array.isArray(value)) return value.map(sort);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k=>[k,sort(value[k])]));
  return value;
}
export const digest = value => crypto.createHash('sha256').update(value).digest('hex');
function insist(condition, code) { if (!condition) throw new Error(code); }
function text(value, min=1) { return typeof value === 'string' && value.trim().length >= min && value.length <= 2000; }
function principal(value) {
  if(typeof value!=='string' || value.length>200 || /[\p{Cc}\p{Cf}]/u.test(value)) return '';
  return value.normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
}

/** No absolute paths, traversal, symlinks, special files, or reads outside root. */
export function safePath(root, relative, { exists=true, file=false }={}) {
  insist(typeof relative === 'string' && /^[A-Za-z0-9_.@/-]+$/.test(relative) &&
    !path.isAbsolute(relative) && !relative.split('/').some(p=>p==='..'||p==='.'||!p), 'UNSAFE_PATH');
  root=fs.realpathSync(root);
  let cursor=root;
  for (const segment of relative.split('/')) {
    cursor=path.join(cursor,segment);
    if (fs.existsSync(cursor) || (()=>{try{fs.lstatSync(cursor);return true;}catch{return false;}})()) {
      const st=fs.lstatSync(cursor);
      insist(!st.isSymbolicLink(), 'SYMLINK_PATH');
      insist(st.isFile() || st.isDirectory(), 'SPECIAL_FILE');
      if (st.isFile()) insist(st.nlink===1,'HARDLINK_FILE');
    }
  }
  if (exists) {
    insist(fs.existsSync(cursor), 'MISSING_PATH');
    const st=fs.statSync(cursor);
    insist(!file || st.isFile(),'EXPECTED_FILE');
    if (st.isFile()) insist(st.size<=MAX_FILE,'OVERSIZED_FILE');
  }
  return cursor;
}
function readJson(root,relative) {
  const p=safePath(root,relative,{file:true});
  insist(fs.statSync(p).size<=2_000_000,'OVERSIZED_JSON');
  try {return JSON.parse(fs.readFileSync(p,'utf8'));} catch {throw new Error('MALFORMED_JSON');}
}
function command(executable,args,cwd,timeout=30_000) {
  return spawnSync(executable,args,{cwd,encoding:'utf8',timeout,maxBuffer:2_000_000,windowsHide:true});
}
function currentRevision(root,env) {
  const git=command('git',['rev-parse','--show-toplevel'],root);
  if (git.status===0 && fs.realpathSync(git.stdout.trim())===fs.realpathSync(root)) {
    const sha=command('git',['rev-parse','HEAD'],root).stdout.trim();
    if (SHA.test(sha)) return {revision:sha,source:'git'};
  }
  for (const name of ['GITHUB_SHA','RAILWAY_GIT_COMMIT_SHA']) {
    if (SHA.test(env[name]??'')) return {revision:env[name],source:name};
  }
  return {revision:null,source:'UNAVAILABLE'};
}
export function scanRoots(root,roots) {
  const files=new Map(), findings=[];
  for (const rel of roots) {
    const entry=safePath(root,rel);
    insist(fs.statSync(entry).isDirectory(),'SOURCE_ROOT_NOT_DIRECTORY');
    let count=0;
    function walk(dir) {
      for (const ent of fs.readdirSync(dir,{withFileTypes:true})) {
        if (EXCLUDED.has(ent.name)) continue;
        const full=path.join(dir,ent.name), relative=path.relative(root,full).split(path.sep).join('/');
        if (ent.isSymbolicLink()) throw new Error('SOURCE_SYMLINK');
        if (ent.isDirectory()) {walk(full);continue;}
        if (!CODE.test(ent.name)) continue;
        const p=safePath(root,relative,{file:true});
        const bytes=fs.readFileSync(p), body=bytes.toString('utf8');
        count++;
        insist(files.size<50_000,'SCAN_FILE_LIMIT');
        if (files.has(relative)) continue;
        files.set(relative,digest(bytes));
        if (/>\s*(?:No data|No records found|Error occurred|Invalid input)\s*</i.test(body))
          findings.push({code:'EMPTY_ERROR_COPY_REVIEW',path:relative});
        if (/navigator\s*\.\s*(?:geolocation|mediaDevices|bluetooth)|Notification\s*\.\s*requestPermission/.test(body))
          findings.push({code:'PERMISSION_JOURNEY_REVIEW',path:relative});
        if (/sk-(?:proj-)?[A-Za-z0-9_-]{32,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|AKIA[0-9A-Z]{16}/.test(body))
          findings.push({code:'POTENTIAL_SECRET_REVIEW',path:relative});
      }
    }
    walk(entry);
    insist(count>0,'EMPTY_SOURCE_ROOT');
  }
  return {roots,filesScanned:files.size,sourceDigest:digest(canonical([...files.entries()].sort())),findings};
}
function checkTime(value,now) {
  insist(typeof value==='string' && /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value),'INVALID_EVIDENCE_TIME');
  const time=Date.parse(value);
  insist(Number.isFinite(time) && time<=now+60_000 && time>=now-86_400_000,'STALE_OR_FUTURE_EVIDENCE');
}
function artifact(root,a) {
  insist(a && text(a.path) && HASH.test(a.sha256??''),'INVALID_ARTIFACT_REFERENCE');
  const file=safePath(root,a.path,{file:true});
  insist(fs.statSync(file).size>0,'EMPTY_ARTIFACT');
  insist(digest(fs.readFileSync(file))===a.sha256,'ARTIFACT_HASH_MISMATCH');
  return file;
}
/** Static delivery changes application-control applicability, never release authority.
 * This is review-record consistency. Source/browser/server checks must supply the
 * observations; a reviewed JSON assertion cannot establish their truth by itself.
 */
function validateStaticApplicability(root,evidence,manifest,revision,now) {
  if (!manifest.platform.runtimeTargets.includes('WEB_STATIC')) return;
  const boundary=manifest.platform.staticDelivery;
  const review=readJson(root,manifest.assuranceTrack.applicability.reviewEvidencePath);
  insist(review.version===1 && review.kind==='STATIC_DELIVERY_APPLICABILITY_REVIEW' &&
    review.disposition==='APPLICABLE_STATIC_DELIVERY','STATIC_APPLICABILITY_REVIEW_REQUIRED');
  insist(review.revision===revision && review.repository===manifest.platform.repository &&
    review.sourceDigest===evidence.sourceDigest && HASH.test(review.sourceDigest??''),'STATIC_REVIEW_SOURCE_MISMATCH');
  insist(review.boundaryDigest===digest(canonical(boundary)),'STATIC_REVIEW_BOUNDARY_MISMATCH');
  checkTime(review.reviewedAt,now);
  insist(principal(review.reviewedBy) && principal(review.reviewedBy)!==principal(evidence.builder),
    'STATIC_INDEPENDENT_REVIEW_REQUIRED');
  insist(text(review.rationale,20) && Array.isArray(review.unresolvedScopeFindings) &&
    review.unresolvedScopeFindings.length===0,'STATIC_SCOPE_REVIEW_INCOMPLETE');
  insist(Array.isArray(review.sources) && review.sources.length>0 && review.sources.length<=100,
    'STATIC_REVIEW_SOURCES_REQUIRED');
  for (const source of review.sources) artifact(root,source);
  insist(boundary.entrypoints.every(entry=>review.sources.some(source=>source.path===entry)),
    'STATIC_ENTRYPOINT_NOT_REVIEWED');
  // Existing mandatory evidence checks remain required and executable, including
  // negative tests of unsupported writes/accounts/storage and honest offline behavior.
  const required=['REQ-EBEAS-E2E','REQ-EBEAS-IDENTITY-CONTINUITY','REQ-EBEAS-ENTITY-ISOLATION',
    'REQ-EBEAS-PERSISTENCE','REQ-EBEAS-PERMISSIONS','REQ-EBEAS-OFFLINE-DDIL','REQ-EBEAS-PRIVACY','REQ-EBEAS-CRYPTO'];
  insist(Array.isArray(review.evidenceRequirements) && required.every(id=>review.evidenceRequirements.includes(id)),
    'STATIC_ABSENCE_EVIDENCE_UNMAPPED');
}
export function validateEvidence(root,evidence,manifest,revision,now=Date.now()) {
  insist(evidence && evidence.version==='1.1.0' && evidence.revision===revision,'EVIDENCE_REVISION_MISMATCH');
  insist(evidence.repository===manifest.platform.repository,'EVIDENCE_REPOSITORY_MISMATCH');
  checkTime(evidence.createdAt,now);
  insist(principal(evidence.builder) && evidence.checks && typeof evidence.checks==='object','EVIDENCE_IDENTITY_REQUIRED');
  const required=[...REQUIREMENTS];
  const targets=manifest.platform.runtimeTargets;
  for (const [target,id] of Object.entries({WEB_PWA:'REQ-EBEAS-PWA',IOS_APP_STORE:'REQ-EBEAS-IOS-BUILD',ANDROID_PLAY_STORE:'REQ-EBEAS-ANDROID-BUILD',TAURI_DESKTOP:'REQ-EBEAS-DESKTOP-BUILD',EDGE_DDIL:'REQ-EBEAS-OFFLINE-DDIL'}))
    if (targets.includes(target) && !required.includes(id)) required.push(id);
  if(targets.includes('IOS_APP_STORE')||targets.includes('ANDROID_PLAY_STORE')) required.push('REQ-EBEAS-STORE-PRIVACY','REQ-EBEAS-STORE-PACKAGE');
  insist(typeof manifest.assuranceTrack.storeCompliance.accountCreation==='boolean','ACCOUNT_APPLICABILITY_UNRESOLVED');
  if (manifest.assuranceTrack.storeCompliance.accountCreation) required.push('REQ-EBEAS-DELETION');
  insist(required.every(id=>manifest.traceability.requirementsMapped.includes(id)),'MISSING_REQUIREMENT_MAPPING');
  // Additional application-specific controls remain obligations. Post-promotion
  // observations are separate states and cannot be manufactured before deployment.
  const separateStages=new Set(['REQ-EBEAS-PROVENANCE','REQ-EBEAS-IRON','REQ-EBEAS-RELEASE','REQ-EBEAS-DEPLOYMENT','REQ-EBEAS-LIVE']);
  for(const id of manifest.traceability.requirementsMapped) if(!required.includes(id)&&!separateStages.has(id)) required.push(id);
  for (const id of required) {
    const c=evidence.checks[id];
    insist(c && c.status==='PASSED' && c.revision===revision,`CHECK_NOT_PASSED:${id}`);
    checkTime(c.executedAt,now);
    insist(text(c.method) && text(c.runner) && ['static','synthetic','staging','live','manual'].includes(c.mode),`CHECK_METHOD_REQUIRED:${id}`);
    insist(Array.isArray(c.artifacts) && c.artifacts.length>0 && c.artifacts.length<=100,`CHECK_ARTIFACTS_REQUIRED:${id}`);
    for (const a of c.artifacts) artifact(root,a);
    // Browser/lifecycle assertions cannot be discharged by filename/static scans.
    if (['REQ-EBEAS-JOURNEY','REQ-EBEAS-A11Y','REQ-EBEAS-PERFORMANCE','REQ-EBEAS-PERMISSIONS','REQ-EBEAS-OFFLINE-DDIL','REQ-EBEAS-DELETION','REQ-EBEAS-PWA',
      'REQ-EBEAS-E2E','REQ-EBEAS-IDENTITY-CONTINUITY','REQ-EBEAS-ENTITY-ISOLATION','REQ-EBEAS-PERSISTENCE','REQ-EBEAS-AUDIT'].includes(id)) {
      insist(c.mode!=='static',`EXECUTED_JOURNEY_REQUIRED:${id}`);
      insist(Number.isInteger(c.executedCases) && c.executedCases>0 && c.failedCases===0 && c.skippedCases===0,`EXECUTED_RESULTS_REQUIRED:${id}`);
    }
  }
  insist(evidence.unresolvedFindings?.length===0 && Array.isArray(evidence.unresolvedFindings),'UNRESOLVED_FINDINGS');
  const perf=evidence.measurements;
  const budget=manifest.experienceTrack.performanceBudgets;
  insist(perf && text(perf.device) && text(perf.network) && text(perf.workload) && perf.percentile===75 &&
    Number.isInteger(perf.sampleCount) && perf.sampleCount>0 && Number.isInteger(perf.inpSampleCount) && perf.inpSampleCount>0,'MEASUREMENT_CONTEXT_REQUIRED');
  for (const [key,limit] of [['fcpMs',budget.firstContentfulPaintMs],['inpMs',budget.interactionToNextPaintMs],['firstValueSeconds',manifest.experienceTrack.ucdNarrative.timeToFirstValueSeconds]])
    insist(typeof perf[key]==='number' && Number.isFinite(perf[key]) && perf[key]>0 && perf[key]<=limit,`PERFORMANCE_BUDGET:${key}`);
  insist(typeof perf.sustainedFps==='number' && Number.isFinite(perf.sustainedFps) && perf.sustainedFps>=budget.targetFps,'FPS_BUDGET');
  insist(evidence.security && evidence.security.criticalOpen===0 && evidence.security.highOpen===0 && evidence.security.secretScanPassed===true,'SECURITY_FINDINGS');
  const sbom=readJson(root,evidence.security.sbomPath);
  if (manifest.assuranceTrack.auditAndSbom.sbomFormat==='CYCLONEDX_1_5')
    insist(sbom.bomFormat==='CycloneDX' && sbom.specVersion==='1.5' && sbom.components?.length>0,'INVALID_CYCLONEDX_SBOM');
  else insist(sbom.spdxVersion==='SPDX-2.3' && sbom.packages?.length>0,'INVALID_SPDX_SBOM');
  insist(evidence.checks['REQ-EBEAS-SUPPLY-CHAIN'].artifacts.some(a=>a.path===evidence.security.sbomPath),'SBOM_NOT_HASH_BOUND');
  const human=evidence.userAcceptance;
  insist(human && human.actualHumans===true && Array.isArray(human.personas) && human.personas.length>0,'ACTUAL_USER_TESTS_REQUIRED');
  insist(['manual','live'].includes(evidence.checks['REQ-EBEAS-COLD-USERS'].mode),'ACTUAL_USER_EVIDENCE_MODE');
  insist(human.personas.some(p=>p.persona===manifest.experienceTrack.ucdNarrative.primaryPersona),'PRIMARY_PERSONA_NOT_TESTED');
  const participants=new Set();
  const firstValueTimes=[];
  for (const persona of human.personas) {
    insist(text(persona.id) && text(persona.persona) && Array.isArray(persona.attempts) && persona.attempts.length>=3 && persona.attempts.length<=100,'THREE_UNASSISTED_USERS_PER_PERSONA');
    let completed=0;
    for(const attempt of persona.attempts) {
      insist(/^[A-Za-z0-9_-]{3,64}$/.test(attempt.participantId??'') && !participants.has(attempt.participantId),'DUPLICATE_OR_INVALID_PARTICIPANT');
      participants.add(attempt.participantId);
      const timeValid=v=>Number.isFinite(v)&&v>0 || (!attempt.completed && v===null);
      insist(typeof attempt.firstTime==='boolean' && typeof attempt.completed==='boolean' && Number.isInteger(attempt.assistanceCount) && attempt.assistanceCount>=0 &&
        timeValid(attempt.firstValueSeconds) && timeValid(attempt.fullOutcomeSeconds),'INVALID_USER_ATTEMPT');
      insist(evidence.checks['REQ-EBEAS-COLD-USERS'].artifacts.some(a=>a.path===attempt.artifactPath),'USER_ATTEMPT_NOT_HASH_BOUND');
      if(attempt.firstTime && attempt.assistanceCount===0) firstValueTimes.push(attempt.firstValueSeconds??Infinity);
      if(attempt.firstTime && attempt.completed && attempt.assistanceCount===0 &&
        attempt.firstValueSeconds<=manifest.experienceTrack.ucdNarrative.timeToFirstValueSeconds &&
        attempt.fullOutcomeSeconds<=manifest.experienceTrack.ucdNarrative.fullOutcomeBudgetSeconds) completed++;
    }
    insist(completed>=3,'THREE_UNASSISTED_USERS_PER_PERSONA');
  }
  firstValueTimes.sort((a,b)=>a-b);
  const observedFirstValueP75=firstValueTimes[Math.ceil(firstValueTimes.length*0.75)-1];
  insist(Number.isFinite(observedFirstValueP75) && Math.abs(perf.firstValueSeconds-observedFirstValueP75)<=0.001,'FIRST_VALUE_SUMMARY_MISMATCH');
  // Full trust-boundary/key-lifecycle evidence is separately independently reviewed.
  const crypt=evidence.cryptography;
  insist(crypt && text(crypt.trustBoundary,20) && text(crypt.keyCustody,20) && text(crypt.recoveryAndRevocation,20),'CRYPTOGRAPHIC_BOUNDARY_REQUIRED');
  if (manifest.assuranceTrack.cryptography.atRest==='FIPS_140_3_MODULE')
    insist(crypt.fips && /^https:\/\/csrc\.nist\.gov\/projects\/cryptographic-module-validation-program\/certificate\/\d+$/i.test(crypt.fips.certificateUrl??'') &&
      text(crypt.fips.moduleVersion) && text(crypt.fips.operatingEnvironment) && crypt.fips.approvedMode===true,'FIPS_MODULE_EVIDENCE_REQUIRED');
  insist(manifest.assuranceTrack.applicability.reviewStatus==='REVIEWED' && manifest.assuranceTrack.applicability.reviewEvidencePath,'REGULATORY_APPLICABILITY_UNRESOLVED');
  insist(evidence.checks['REQ-EBEAS-APPLICABILITY'].artifacts.some(a=>a.path===manifest.assuranceTrack.applicability.reviewEvidencePath),'APPLICABILITY_NOT_HASH_BOUND');
  validateStaticApplicability(root,evidence,manifest,revision,now);
  insist(evidence.approval && principal(evidence.approval.approvedBy) && principal(evidence.approval.approvedBy)!==principal(evidence.builder) &&
    evidence.approval.revision===revision && text(evidence.approval.authorityReference) && text(evidence.approval.environment),'RELEASE_AUTHORITY_REQUIRED');
  artifact(root,{path:manifest.traceability.ironReceiptPath,sha256:evidence.ironReceiptSha256});
  return required;
}
function storeArtifacts(root,m) {
  const t=m.platform.runtimeTargets, c=m.assuranceTrack.storeCompliance;
  if (t.includes('WEB_STATIC')) {
    for (const entry of m.platform.staticDelivery.entrypoints) safePath(root,entry,{file:true});
    // Build confirms paths and declarations only. Independent review and executed
    // scope-negatives are still mandatory in validateEvidence before release.
  }
  if (t.includes('WEB_PWA')) {
    insist(c.pwaManifestPath,'PWA_MANIFEST_UNRESOLVED');
    const pwa=readJson(root,c.pwaManifestPath);
    insist(text(pwa.name)||text(pwa.short_name),'PWA_NAME_REQUIRED');
    insist(text(pwa.start_url) && ['standalone','minimal-ui','fullscreen','window-controls-overlay'].includes(pwa.display),'PWA_INSTALL_CONFIGURATION');
    insist(Array.isArray(pwa.icons)&&pwa.icons.length>0,'PWA_ICONS_REQUIRED');
    // Install/relaunch/offline, icon rendering and HTTPS require executed browser evidence.
  }
  if (t.includes('IOS_APP_STORE')) {
    insist(c.privacyManifestPath?.endsWith('PrivacyInfo.xcprivacy'),'IOS_MANIFEST_UNRESOLVED');
    safePath(root,c.privacyManifestPath,{file:true});
  }
  if (t.includes('ANDROID_PLAY_STORE')) {
    insist(c.playDataSafetyPath,'PLAY_DATA_SAFETY_UNRESOLVED');
    const play=readJson(root,c.playDataSafetyPath);
    insist(play && typeof play==='object' && !Array.isArray(play) && Object.keys(play).length>0,'EMPTY_PLAY_DATA_SAFETY');
    if (c.accountCreation) insist(c.accountDeletionWebUrl,'PLAY_EXTERNAL_DELETION_REQUIRED');
  }
  if (t.includes('IOS_APP_STORE')||t.includes('ANDROID_PLAY_STORE'))
    insist(c.tosUrl && c.privacyPolicyUrl,'STORE_POLICIES_UNRESOLVED');
}

export async function evaluate({root=process.cwd(),stage='release',env=process.env,now=new Date()}={}) {
  root=fs.realpathSync(root);
  const checks=[], identity=currentRevision(root,env);
  let manifest, scan;
  async function check(id,track,fn) {
    try {const detail=await fn();checks.push({id,track,status:'PASSED',detail});return true;}
    catch(e) {checks.push({id,track,status:'FAILED',detail:/^[A-Z0-9_:-]+$/.test(e.message??'')?e.message:'CHECK_EXECUTION_FAILED'});return false;}
  }
  const validStage=await check('G0-INVOCATION','TRACEABILITY',()=>{insist(['build','evidence','release'].includes(stage),'UNKNOWN_STAGE');return {stage};});
  const valid=await check('G1-MANIFEST','TRACEABILITY',async()=>{
    manifest=readJson(root,'iss-manifest.json');
    const schema=readJson(root,'schemas/iss-manifest.schema.json');
    const {default:Ajv}=await import('ajv');
    const {default:addFormats}=await import('ajv-formats');
    const ajv=new Ajv({allErrors:true,strict:true});addFormats(ajv);
    const validate=ajv.compile(schema);
    insist(validate(manifest),'MANIFEST_SCHEMA_INVALID');
    insist(manifest.platform.repository.split('/')[0]===manifest.platform.repoOwner,'REPOSITORY_OWNER_MISMATCH');
    if(env.GITHUB_REPOSITORY) insist(env.GITHUB_REPOSITORY.toLowerCase()===manifest.platform.repository.toLowerCase(),'RUNNER_REPOSITORY_MISMATCH');
    insist(!manifest.platform.runtimeTargets.some(t=>manifest.platform.plannedRuntimeTargets.includes(t)),'DUPLICATE_PLANNED_TARGET');
    return {manifestSha256:digest(fs.readFileSync(safePath(root,'iss-manifest.json'))),schemaSha256:digest(fs.readFileSync(safePath(root,'schemas/iss-manifest.schema.json'))),declarationKind:manifest.declarationKind};
  });
  if (valid && validStage) {
    await check('G2-RISK-PROFILE','ASSURANCE',()=>{
      const a=manifest.assuranceTrack, tier=manifest.platform.tier, frameworks=a.auditAndSbom.complianceFrameworks;
      if(tier==='TIER_2_HEALTH_COMMUNITY') insist(frameworks.includes('HIPAA_HITECH'),'HEALTH_PROFILE_TARGET_REQUIRED');
      if(tier==='TIER_3_DEFENSE_DDIL') insist((frameworks.includes('NIST_800_171_CMMC_L2')||frameworks.includes('NIST_800_53')) && a.cryptography.atRest==='FIPS_140_3_MODULE','DEFENSE_PROFILE_TARGET_REQUIRED');
      return {tier,meaning:'Internal requirements profile; applicability and validated implementation remain evidence obligations.'};
    });
    await check('G3-SOURCE-SCOPE','EXPERIENCE',()=>{
      scan=scanRoots(root,manifest.platform.sourceRoots);
      return {...scan,heuristicStatus:scan.findings.length?'REVIEW_REQUIRED':'NO_PATTERN_MATCH',limitation:'Heuristics do not prove HIG, accessibility, permission sequencing or absence of secrets.'};
    });
    await check('G4-TRACEABILITY','TRACEABILITY',()=>{
      safePath(root,manifest.traceability.e2eSuitePath);
      safePath(root,manifest.traceability.checklistPath,{file:true});
      insist(REQUIREMENTS.every(id=>manifest.traceability.requirementsMapped.includes(id)),'MISSING_REQUIREMENT_MAPPING');
      return {e2eConfigured:true,e2eExecutedByThisCheck:false,checklist:manifest.traceability.checklistPath};
    });
    await check('G5-RUNTIME-ARTIFACTS','ASSURANCE',()=>{storeArtifacts(root,manifest);return {configuredTargets:manifest.platform.runtimeTargets,plannedTargets:manifest.platform.plannedRuntimeTargets,storeReadiness:'NOT_VERIFIED'};});
    if(stage==='release' || stage==='evidence') {
      let evidence;
      await check('G6-REVISION','TRACEABILITY',()=>{
        insist(SHA.test(identity.revision??''),'EXACT_REVISION_UNAVAILABLE');
        if(identity.source==='git') {
          insist(command('git',['diff','--quiet'],root).status===0 && command('git',['diff','--cached','--quiet'],root).status===0,'DIRTY_TRACKED_SOURCE');
        }
        return identity;
      });
      await check('G7-EXECUTED-EVIDENCE','ASSURANCE',()=>{
        insist(SHA.test(identity.revision??''),'EXACT_REVISION_UNAVAILABLE');
        evidence=readJson(root,manifest.traceability.evidencePath);
        const required=validateEvidence(root,evidence,manifest,identity.revision,now.getTime());
        // The signed receipt must bind the exact scanned source, not a previous build.
        insist(scan && evidence.sourceDigest===scan.sourceDigest,'SOURCE_DIGEST_MISMATCH');
        const dispositions=evidence.staticFindingDispositions;
        insist(Array.isArray(dispositions),'STATIC_REVIEW_REQUIRED');
        for(const f of scan.findings) insist(dispositions.some(d=>d.code===f.code && d.path===f.path && text(d.rationale,20) &&
          principal(d.reviewedBy) && principal(d.reviewedBy)!==principal(evidence.builder) && ['FALSE_POSITIVE','RESOLVED_BY_EXECUTED_TEST'].includes(d.disposition)),'STATIC_FINDING_UNRESOLVED');
        return {requirements:required,scope:'Signed evidence consistency; reviewers remain responsible for truthful collection and instrument fit.'};
      });
      await check('G8-IRON-ACCEPTANCE','TRACEABILITY',()=>{
        insist(SHA.test(identity.revision??''),'EXACT_REVISION_UNAVAILABLE');
        const receipt=safePath(root,manifest.traceability.ironReceiptPath,{file:true});
        const iron=readJson(root,manifest.traceability.ironReceiptPath);
        for(const c of Object.values(iron.checks??{})) for(const a of c.artifacts??[]) artifact(root,a);
        const result=command('python3',[path.join(HERE,'iron_gate.py'),receipt,'--artifacts',root,'--revision',identity.revision,'--stage','candidate'],root);
        insist(result.status===0,'IRON_ACCEPTANCE_FAILED');
        return {policy:'IRON-ENG-001',version:'1.0.0',receiptConsistency:'PASSED',authenticityEstablishedByThisCheck:false};
      });
      if(stage==='release') await check('G9-SIGNED-PROVENANCE','TRACEABILITY',()=>{
        insist(evidence && SHA.test(identity.revision??''),'EVIDENCE_REQUIRED');
        insist(manifest.traceability.signerWorkflow.startsWith(`${manifest.platform.repository}/.github/workflows/`),'UNTRUSTED_SIGNER_SCOPE');
        const input=safePath(root,manifest.traceability.evidencePath,{file:true});
        const bundle=safePath(root,'audit/ebeas-evidence.sigstore.jsonl',{file:true});
        insist(command('gh',['attestation','verify','--help'],root).status===0,'ATTESTATION_VERIFIER_UNAVAILABLE');
        const args=['attestation','verify',input,'--bundle',bundle,'--repo',manifest.platform.repository,'--signer-workflow',manifest.traceability.signerWorkflow,
          '--source-digest',identity.revision,'--cert-oidc-issuer','https://token.actions.githubusercontent.com','--deny-self-hosted-runners','--format','json'];
        const result=command('gh',args,root,45_000);
        insist(result.status===0,'PROVENANCE_VERIFICATION_FAILED');
        let output;try{output=JSON.parse(result.stdout);}catch{throw new Error('INVALID_PROVENANCE_RESULT');}
        insist(Array.isArray(output)&&output.length>0,'EMPTY_PROVENANCE_RESULT');
        return {signature:'VERIFIED_BY_GH',verifierOutputSha256:digest(result.stdout),repository:manifest.platform.repository,revision:identity.revision,
          limitation:'Verified origin and digest do not certify security, store approval, deployment or user outcome.'};
      });
    }
  }
  const passed=checks.every(c=>c.status==='PASSED');
  const payload={standard:'ISS-EBEAS-1.1',interpretation:manifest?.interpretationVersion??'UNAVAILABLE',platformId:manifest?.platform?.id??'UNKNOWN',timestamp:now.toISOString(),
    stage,revision:identity.revision,revisionSource:identity.source,status:passed?'PASS':'FAIL',
    releaseReadiness:stage==='build'?'NOT_EVALUATED':!passed?'BLOCKED':stage==='evidence'?'PROVENANCE_PENDING':'EVIDENCE_CHECKS_PASSED',
    storeApproval:'NOT_ESTABLISHED',deployment:'NOT_ESTABLISHED',signature:'UNSIGNED_LOCAL_RECEIPT',checks};
  return {...payload,sha256Attestation:digest(canonical(payload))};
}

export function writeReceipt(root,receipt) {
  const target=safePath(root,OUTPUT,{exists:false});
  fs.mkdirSync(path.dirname(target),{recursive:true});
  // Refuse existing links/special files again after mkdir; immutable temp then rename.
  safePath(root,OUTPUT,{exists:false});
  const temporary=path.join(path.dirname(target),`.attestation-${crypto.randomUUID()}.tmp`);
  fs.writeFileSync(temporary,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});
  try {fs.renameSync(temporary,target);} finally {if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
}
export async function runCli(args=process.argv.slice(2)) {
  let stage='release';
  if(args.length===2 && args[0]==='--stage') stage=args[1];
  else if(args.length) stage='invalid';
  const receipt=await evaluate({stage});
  try{writeReceipt(process.cwd(),receipt);}catch{console.error('ISS-EBEAS: UNSAFE_OR_UNWRITABLE_RECEIPT_PATH');process.exitCode=1;}
  for(const c of receipt.checks) console.log(`${c.status} [${c.track}] ${c.id}: ${typeof c.detail==='string'?c.detail:JSON.stringify(c.detail)}`);
  console.log(`ISS-EBEAS ${receipt.status}; release=${receipt.releaseReadiness}; receipt=UNSIGNED_SHA256:${receipt.sha256Attestation}`);
  if(receipt.status!=='PASS') process.exitCode=1;
  return receipt;
}
if(process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url) await runCli();
