import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {NEUROINCLUSIVE_TOPICS,getNeuroinclusiveTopic,neuroinclusiveResearchCase} from "../lib/neuroinclusive-exercise";
import {buildResearchProgram} from "../lib/research-program";
import {buildImplementationJourney} from "../lib/implementation-journey";
import {proposeRpliceHandoff} from "../lib/rplice-implementation-handoff";

test("ten distinct cases cover multiple neurodevelopmental cohorts with source-bounded scope",()=>{
  assert.equal(NEUROINCLUSIVE_TOPICS.length,10);
  assert.equal(new Set(NEUROINCLUSIVE_TOPICS.map(x=>x.id)).size,10);
  assert.ok(NEUROINCLUSIVE_TOPICS.some(x=>x.id==="autism-constipation"));
  assert.ok(NEUROINCLUSIVE_TOPICS.some(x=>x.id==="id-colorectal-screening"));
  assert.ok(NEUROINCLUSIVE_TOPICS.some(x=>x.id==="adhd-urinary"));
  for(const topic of NEUROINCLUSIVE_TOPICS){
    assert.equal(getNeuroinclusiveTopic(topic.id).id,topic.id);
    assert.match(topic.sourceDoi,/^10\.\d{4,9}\/\S+$/);
    assert.ok(topic.sourceTitle.length>24&&topic.limitations.length>40);
    assert.ok(topic.denominatorDefinition.length>50&&topic.alternativeExplanation.length>40);
    assert.ok(topic.potentialHarm.length>20);
  }
  assert.throws(()=>getNeuroinclusiveTopic("nonexistent" as never),/Unknown research exercise/);
});

test("all ten use the real DIS program and twenty-stage implementation engine without fabricated local cohort or approvals",()=>{
  for(const topic of NEUROINCLUSIVE_TOPICS){
    const spec=neuroinclusiveResearchCase(topic.id);
    const program=buildResearchProgram(spec);
    const flow=buildImplementationJourney(program,"Unverified partner site");
    assert.equal(spec.site,"general",topic.id);
    assert.equal(spec.population.proxyUnit,spec.population.targetName,topic.id);
    assert.equal(spec.indicators.length,0,"study statistics never presented as local-site indicator: "+topic.id);
    assert.equal(program.status,"RESEARCH_DESIGN_NOT_FIELD_VALIDATED",topic.id);
    assert.equal(program.indicators.length,0,topic.id);
    assert.equal(program.sourceReviewStatus,"CURATED_PUBLIC_REFERENCES_NOT_LIVE_DATA_PIPELINE",topic.id);
    assert.equal(program.issues.find(x=>x.code==="NO_MEASURED_BASELINE")?.severity,"BLOCK_PROGRAM_CLAIM",topic.id);
    assert.equal(program.issues.find(x=>x.code==="SUBGROUP_RATES_UNVERIFIED")?.severity,"RESEARCH_GAP",topic.id);
    assert.equal(program.issues.find(x=>x.code==="DRIVERS_ARE_HYPOTHESES")?.severity,"RESEARCH_GAP",topic.id);
    assert.equal(program.localCausalEffectsEstablished,false);
    assert.equal(program.individualDataProcessed,false);
    assert.equal(program.interventionAuthorized,false);
    assert.equal(program.strategies.length,1);
    assert.equal(program.strategies[0].basis,"CANDIDATE_TO_EVALUATE");
    assert.equal(program.strategies[0].localEffect,"NOT_ESTABLISHED");
    assert.equal(program.dataSources.length,1);
    assert.equal(program.dataSources[0].connection,"CURATED_REFERENCE_ONLY");
    assert.equal(program.dataSources[0].url,"https://doi.org/"+topic.sourceDoi);
    assert.equal(flow.schemaVersion,"dis-implementation-journey-v1");
    assert.equal(flow.caseId,program.caseId);
    assert.equal(flow.nodes.length,20);
    assert.equal(flow.acceptance.stagesActuallyCompleted,0);
    assert.equal(flow.acceptance.realPilotExecuted,false);
    assert.equal(flow.acceptance.patientDataProcessed,false);
    assert.equal(flow.acceptance.partnersCommitted,false);
    assert.equal(flow.acceptance.externalCommunicationAuthorized,false);
    assert.equal(flow.crossSiteTransport.decision,"HOLD_PENDING_LOCAL_ADAPTATION_AND_VALIDATION");
    assert.equal(flow.crossSiteTransport.automaticReplicationAuthorized,false);
    assert.ok(flow.collaborationRoles.every(x=>x.participationState==="NOT_CONFIRMED"));
  }
});

test("RPLICE methodology packet stays a draft with no shared case, secret, execution or invented review",()=>{
  for(const topic of NEUROINCLUSIVE_TOPICS){
    const program=buildResearchProgram(neuroinclusiveResearchCase(topic.id));
    const packet=proposeRpliceHandoff(program,buildImplementationJourney(program,"Prospective site, not selected"));
    assert.equal(packet.status,"DRAFT_NOT_SENT");
    assert.equal(packet.actualRpcMethod,"NOT_DISCOVERED_OR_AUTHORIZED");
    assert.equal(packet.partnerExecutionVerified,false);
    assert.equal(packet.hasConsentToShareCase,false);
    assert.equal(packet.secretTransferOccurred,false);
    assert.equal(packet.actionAuthorized,false);
    assert.equal(packet.namedRealParticipantsVerified,false);
    assert.equal(packet.investigation.mechanismAndCoreFunction,"NOT_EMPIRICALLY_VALIDATED");
    assert.equal(packet.investigation.transportability,"REQUIRES_SITE_SPECIFIC_REASSESSMENT");
    assert.equal(packet.dataClass,"PUBLIC_AGGREGATE_AND_SYNTHETIC_METHOD_DATA_ONLY");
  }
});

test("research studio presents all ten cases via the existing program and retains boundaries on study and local data",()=>{
  const src=readFileSync("app/research-program/page.tsx","utf8");
  assert.match(src,/NEUROINCLUSIVE_TOPICS\.map/);
  assert.match(src,/neuroinclusiveResearchCase\(neuroTopic\)/);
  assert.match(src,/buildResearchProgram\(caseSpec\)/);
  assert.match(src,/buildImplementationJourney\(program,destination,stellarOverrides\)/);
  assert.match(src,/No pilot-site measurements/);
  assert.match(src,/Published comparisons are not pilot-site baselines/);
  assert.match(src,/No participant is enrolled/);
  assert.match(src,/No public statistical baseline was provided/);
  assert.doesNotMatch(src,/\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/);
});

test("screening and symptom evaluation are not merged or assigned invented universal clinical thresholds",()=>{
  const screen=getNeuroinclusiveTopic("id-colorectal-screening");
  const symptoms=getNeuroinclusiveTopic("id-bowel-cancer-care");
  assert.match(screen.population,/eligible for guideline-based/);
  assert.match(screen.limitations,/no universal earlier screening age/i);
  assert.match(symptoms.question,/symptomatic evaluation/i);
  for(const topic of NEUROINCLUSIVE_TOPICS){
    const spec=neuroinclusiveResearchCase(topic.id);
    assert.ok(!spec.strategies.some(x=>x.basis==="EVIDENCE_FOR_SCREENING_UPTAKE"),"observational associations never upgraded to intervention efficacy");
    assert.ok(!spec.indicators.some(x=>x.value!==null),"no local baseline in retrospective research exercises");
    assert.ok(spec.strategies.every(x=>x.potentialHarm.trim().length>15));
  }
});
