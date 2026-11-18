// Synthetic test fixtures only. Never use these receipts as product acceptance.
import fs from 'node:fs';
import path from 'node:path';
import { REQUIREMENTS, digest } from './gate.mjs';
export function manifestFixture() {
  return {
    manifestVersion:'1.1.0',interpretationVersion:'1.1.0-evidence.1',declarationKind:'REQUIREMENTS_NOT_ATTESTATION',
    platform:{id:'iss-fixture',name:'Synthetic gate fixture',tier:'TIER_1_COMMERCIAL_CIVIC',runtimeTargets:['WEB_PWA'],plannedRuntimeTargets:['IOS_APP_STORE','ANDROID_PLAY_STORE'],repoOwner:'fixture-owner',repository:'fixture-owner/fixture-repo',sourceRoots:['client/src'],cartridges:[]},
    experienceTrack:{ucdNarrative:{primaryPersona:'A synthetic tester of gate failure behavior',coreJobToBeDone:'Distinguish configuration checks from verified release evidence.',timeToFirstValueSeconds:30,fullOutcomeBudgetSeconds:600,emptyStateCopyAudited:true},
      higStandards:{maxPrimaryActionsPerView:3,springPhysicsEnabled:true,optimisticUiEnabled:true,optimisticUiPolicy:'REVERSIBLE_PENDING_ONLY',supportsDarkAndLight:true,prePermissionPriming:true,permissionPolicy:'CONTEXTUAL_PLATFORM_SPECIFIC'},
      performanceBudgets:{firstContentfulPaintMs:1200,interactionToNextPaintMs:100,targetFps:60,offlineFirstReady:true},
      accessibility:{wcagVersion:'2.2',wcagLevel:'AA',dynamicTypeScaling:true,reducedMotionFallback:true}},
    assuranceTrack:{dataClassification:['PUBLIC'],cryptography:{inTransit:'TLS_1_3',atRest:'AES_256_GCM',e2ePayloadEncryption:true,authMechanism:['OIDC_PKCE']},
      storeCompliance:{accountCreation:true,accountDeletionEndpoint:null,accountDeletionWebUrl:null,privacyManifestPath:null,playDataSafetyPath:null,pwaManifestPath:'client/public/manifest.webmanifest',tosUrl:null,privacyPolicyUrl:null},
      auditAndSbom:{sbomFormat:'CYCLONEDX_1_5',blockCriticalHighCves:true,immutableAuditLog:true,complianceFrameworks:['NIST_800_53']},
      applicability:{reviewStatus:'UNDETERMINED',basis:'Synthetic requirements fixture; no product applicability or compliance is represented.',reviewEvidencePath:null}},
    traceability:{requirementsMapped:[...REQUIREMENTS,'REQ-EBEAS-PWA','REQ-EBEAS-DELETION'],e2eSuitePath:'tests/e2e',checklistPath:'docs/engineering/ISS-EBEAS-RELEASE-CHECKLIST.md',evidencePath:'audit/ebeas-evidence.json',ironReceiptPath:'audit/iron-receipt.json',attestationOutputPath:'audit/attestation.json',signerWorkflow:'fixture-owner/fixture-repo/.github/workflows/iss-ebeas-release.yml',owner:'Synthetic fixture owner'},
  };
}
export function put(root,name,data) {
  const p=path.join(root,name);fs.mkdirSync(path.dirname(p),{recursive:true});
  fs.writeFileSync(p,typeof data==='string'?data:JSON.stringify(data,null,2)+'\n');
}
export function setupFixture(root,schema) {
  const manifest=manifestFixture();
  put(root,'iss-manifest.json',manifest);put(root,'schemas/iss-manifest.schema.json',schema);
  put(root,'client/src/main.ts','export const fixture = true;\n');
  put(root,'client/public/manifest.webmanifest',{name:'Synthetic fixture',start_url:'/',display:'standalone',icons:[{src:'/icon.svg',sizes:'any',type:'image/svg+xml'}]});
  put(root,'tests/e2e/fixture.test.mjs','// Path configuration fixture, not an executed application journey.\n');
  put(root,manifest.traceability.checklistPath,'# Synthetic checklist fixture\n');
  return manifest;
}
export function evidenceFixture(root,manifest,revision,now) {
  // These are forged fixture claims for negative tests of the real release gate.
  const reference={path:'audit/synthetic-only.txt',sha256:digest('SYNTHETIC ONLY\n')};
  put(root,reference.path,'SYNTHETIC ONLY\n');
  const sbom={bomFormat:'CycloneDX',specVersion:'1.5',components:[{name:'synthetic-only',version:'0.0.0'}]};
  put(root,'audit/sbom.json',sbom);
  put(root,'audit/iron-receipt.json',{syntheticInvalidReceipt:true});
  const checks=Object.fromEntries(manifest.traceability.requirementsMapped.map(id=>[id,{status:'PASSED',revision,executedAt:now.toISOString(),method:'Synthetic fixture claims, not acceptance',runner:'fixture-runner',mode:'synthetic',executedCases:1,failedCases:0,skippedCases:0,artifacts:[reference]}]));
  checks['REQ-EBEAS-COLD-USERS'].mode='manual';
  checks['REQ-EBEAS-SUPPLY-CHAIN'].artifacts.push({path:'audit/sbom.json',sha256:digest(fs.readFileSync(path.join(root,'audit/sbom.json')))});
  manifest.assuranceTrack.applicability.reviewStatus='REVIEWED';manifest.assuranceTrack.applicability.reviewEvidencePath=reference.path;
  return {version:'1.1.0',revision,repository:manifest.platform.repository,createdAt:now.toISOString(),builder:'fixture-builder',checks,
    unresolvedFindings:[],measurements:{device:'synthetic',network:'synthetic',workload:'synthetic',percentile:75,sampleCount:3,inpSampleCount:3,fcpMs:1000,inpMs:80,firstValueSeconds:20,sustainedFps:60},
    security:{criticalOpen:0,highOpen:0,secretScanPassed:true,sbomPath:'audit/sbom.json'},
    userAcceptance:{actualHumans:true,personas:[{id:'synthetic-only',persona:manifest.experienceTrack.ucdNarrative.primaryPersona,attempts:[0,1,2].map(i=>({participantId:`fixture-${i}`,firstTime:true,completed:true,assistanceCount:0,firstValueSeconds:20,fullOutcomeSeconds:180,artifactPath:reference.path}))}]},
    cryptography:{trustBoundary:'Synthetic claim about trust boundaries only.',keyCustody:'Synthetic claim about key custody only.',recoveryAndRevocation:'Synthetic claim about key lifecycle only.'},
    approval:{approvedBy:'fixture-reviewer',revision,authorityReference:'Synthetic fixture claim only',environment:'fixture'},
    ironReceiptSha256:digest(fs.readFileSync(path.join(root,'audit/iron-receipt.json'))),staticFindingDispositions:[]};
}
