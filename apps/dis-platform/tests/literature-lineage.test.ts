import test from "node:test";
import assert from "node:assert/strict";
import {boundDiscoveryLeads} from "../lib/evidence-action-bridge";
import {buildResearchWorkflowCase,emptyResearchWorkflow,workflowFromSavedReport,savedWorkflowBridge} from "../lib/research-workflow";
import type {IntelligenceRecord} from "../lib/consultation-research";
import {retainedAbstractSummary} from "../lib/literature-lineage";

const lead=(id:string,url:string,summary:string,title=id):IntelligenceRecord=>({
 id,kind:"SCHOLARLY",title,summary,source:"Source-derived test fixture",url,
 retrievedAt:"2026-11-09T17:00:00Z",sourceStatus:"DISCOVERY_ONLY"
});
// Exact registration clause from each publisher XML abstract. These are two
// reports from SCORE; the product only observes a shared registration mention.
// DOI 10.1186/s43058-026-00858-6 (Ferrari 2026) and 10.1007/s11606-025-10151-2
// (Ganguly 2026). Cohort, endpoint and design equivalence are NOT asserted.
const score=[
 lead("score-functions","https://doi.org/10.1186/s43058-026-00858-6","ClinicalTrials.gov Identifier: NCT04406714.","What makes patient navigation work? Identifying functions and forms and conducting causal loop diagramming to specify components of a successful colorectal cancer patient navigation program"),
 lead("score-followup","https://doi.org/10.1007/s11606-025-10151-2","ClinicalTrials.gov Identifier: NCT04406714.","Time to Follow-Up Colonoscopy After Positive Fecal Immunochemical Test with Centralized Patient Navigation: A Randomized Clinical Trial")
];

test("two source-derived SCORE reports surface a candidate connection without collapsing papers",()=>{
 const rows=boundDiscoveryLeads(score);
 assert.equal(rows.length,2);
 const lineage=rows[0].lineage!;
 assert.ok(lineage,"The paper card must retain an explicit registration-link review");
 assert.deepEqual(lineage.registrationMentions,[{registrationId:"NCT04406714",fields:["summary"]}]);
 assert.deepEqual(lineage.candidateConnections,[{registrationId:"NCT04406714",otherLeadId:"score-followup",otherTitle:score[1].title,otherUrl:score[1].url}]);
 assert.equal(lineage.familyVerified,false);
 assert.equal(lineage.independentStudyCount,null);
 assert.ok(rows.every(x=>!x.claimVerified&&!x.independentConfirmation));
});

test("reference-only citation remains a candidate, never a verified study family",()=>{
 const rows=boundDiscoveryLeads([score[0],lead("citation","https://example.org/review","We discuss another trial, NCT04406714, as background.")]);
 assert.equal(rows[1].lineage!.candidateConnections.length,1);
 assert.equal(rows[1].lineage!.familyVerified,false);
 assert.equal(rows[1].lineage!.independentStudyCount,null);
});

test("different and missing registrations leave study independence unresolved",()=>{
 const rows=boundDiscoveryLeads([score[0],lead("different","https://example.org/different","NCT01234567"),lead("missing","https://example.org/missing","No registry field in available abstract")]);
 assert.ok(rows.every(x=>x.lineage!.candidateConnections.length===0));
 assert.deepEqual(rows[2].lineage!.registrationMentions,[]);
 assert.ok(rows.every(x=>x.lineage!.independentStudyCount===null));
});

test("duplicate URL records do not create a second publication or self-connection",()=>{
 const rows=boundDiscoveryLeads([score[0],{...score[0],id:"same-paper"},score[1]]);
 assert.equal(rows.length,2);
 assert.equal(rows[0].lineage!.candidateConnections.length,1);
 assert.equal(rows[0].lineage!.candidateConnections[0].otherLeadId,"score-followup");
});

test("malformed registry tokens do not become identifiers",()=>{
 const rows=boundDiscoveryLeads([lead("malformed","https://example.org/malformed","XNCT04406714 NCT044067149 NCT0440671 NCT04406714extra NCT 04406714")]);
 assert.deepEqual(rows[0].lineage!.registrationMentions,[]);
});

test("case and repeated mentions normalize while retaining which fields contain them",()=>{
 const rows=boundDiscoveryLeads([lead("repeat","https://clinicaltrials.gov/study/NCT04406714","nct04406714; NCT04406714","Registration NCT04406714")]);
 assert.deepEqual(rows[0].lineage!.registrationMentions,[{registrationId:"NCT04406714",fields:["title","summary","url"]}]);
});

test("multiple shared IDs remain distinct candidate links rather than a transitive family",()=>{
 const rows=boundDiscoveryLeads([lead("a","https://example.org/a","NCT04406714"),lead("b","https://example.org/b","NCT04406714 and NCT01234567"),lead("c","https://example.org/c","NCT01234567")]);
 assert.deepEqual(rows[0].lineage!.candidateConnections.map(x=>x.otherLeadId),["b"]);
 assert.deepEqual(rows[2].lineage!.candidateConnections.map(x=>x.otherLeadId),["b"]);
 assert.equal(rows[1].lineage!.candidateConnections.length,2);
});

test("derived links do not mutate the retained source records or accept supplied verification",()=>{
 const input=score.map(x=>({...x,familyVerified:true,lineage:{familyVerified:true}}));
 const before=JSON.stringify(input),rows=boundDiscoveryLeads(input);
 assert.equal(JSON.stringify(input),before);
 assert.ok(rows.every(x=>x.lineage!.familyVerified===false));
});

test("source-preserving workflow save and reopen recomputes the same connections",()=>{
 const workflow=emptyResearchWorkflow();
 workflow.publicAggregateConfirmed=true;workflow.retrievalQuery="SCORE colorectal patient navigation";workflow.leads=score;
 const built=buildResearchWorkflowCase(workflow),saved=JSON.parse(JSON.stringify(built.report));
 const reopened=workflowFromSavedReport(saved);
 const bridge=savedWorkflowBridge(saved,reopened.leads);
 assert.deepEqual(bridge.literature,boundDiscoveryLeads(score));
 assert.equal((saved.investigation.literature[0] as any).lineage.candidateConnections[0].otherLeadId,"score-followup");
 assert.deepEqual(reopened.leads,score);
});

test("a registration after 600 characters survives the existing workflow bound",()=>{
 const padded="Synthetic length stress for the source-derived registration clause. ".repeat(15)+score[0].summary;
 assert.ok(padded.indexOf("NCT04406714")>600);
 const before=boundDiscoveryLeads([score[0],{...score[1],summary:padded.slice(0,600)}]);
 assert.equal(before[0].lineage!.candidateConnections.length,0);
 const after=boundDiscoveryLeads([score[0],{...score[1],summary:retainedAbstractSummary(padded)}]);
 assert.equal(after[0].lineage!.candidateConnections.length,1);
});

test("long or upstream-clipped abstracts disclose omission within 5,000 characters",()=>{
 const long=retainedAbstractSummary("A".repeat(6000));
 assert.equal(long.length,5000);assert.match(long,/excerpt truncated/);
 const upstream=retainedAbstractSummary("Short clipped upstream excerpt",true);
 assert.match(upstream,/excerpt truncated/);
 assert.equal(retainedAbstractSummary(null),"Abstract unavailable; inspect original source.");
});
