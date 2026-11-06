/**
 * DIS → RPLICE method handoff schema, not a remote invocation.
 *
 * The source-of-truth RPLICE runtime retains ownership of SALP, Parallax,
 * implementation methodology and specialized agent tools. DIS does not
 * duplicate the algorithms, impersonate a collaborator or infer that any
 * partner method ran. This read-only projection is suitable for the public
 * DIS MCP tool and owner-reviewed cross-platform API design.
 */
import type {FullImplementationFlow} from "./implementation-journey";
import type {ResearchProgram} from "./research-program";
import {CONNECTOR_REGISTRY} from "./integration-registry";

export type RplicePlanningHandoff={
 schemaVersion:"dis-rplice-handoff-proposal-v1";
 author:"DIS";
 specialistOwner:"RPLICE";
 status:"DRAFT_NOT_SENT";
 capabilityCatalogState:"CONTRACT_VERIFIED_NOT_E2E_ACCEPTED";
 actualRpcMethod:"NOT_DISCOVERED_OR_AUTHORIZED";
 partnerExecutionVerified:false;
 hasConsentToShareCase:false;
 secretTransferOccurred:false;
 dataClass:"PUBLIC_AGGREGATE_AND_SYNTHETIC_METHOD_DATA_ONLY";
 actionAuthorized:false;
 namedRealParticipantsVerified:false;
 methodology:{
  requested:["Structural Anchor and Leverage Protocol","MAP-GAP","EPIS/CFIR/RE-AIM relevance","FRAME adaptation tracking"];
  rationale:string;
  existingRplIceReadInterface:"GET /api/v1/public/frameworks — authorized read-only metadata, not case evaluation";
  possiblePrivateMethodExecution:"NOT_ENABLED_OR_VERIFIED";
 };
 investigation:{
  id:string;question:string;sourceGeography:string;
  targetGeography:string;
  currentStep:string;
  disputedEvidence:string[];
  requiredMethods:string[];
  proposedStrategy:string;
  mechanismAndCoreFunction:"NOT_EMPIRICALLY_VALIDATED";
  transportability:"REQUIRES_SITE_SPECIFIC_REASSESSMENT";
 };
 boundaries:string[];
 nextAuthorizedAction:string;
};
export function proposeRpliceHandoff(program:ResearchProgram,flow:FullImplementationFlow):RplicePlanningHandoff{
 const reg=CONNECTOR_REGISTRY.find(c=>c.id==="rplice");
 if(!reg||reg.access!=="PARTNER_CREDENTIALS_REQUIRED"||reg.write.length!==0)
   throw Error("RPLICE source catalog unexpectedly permits a write or lacks an approved owner boundary");
 const candidates=flow.nodes.filter(n=>["SALP","EBI_FIT","ADAPT","SCALE"].includes(n.id));
 const disputedEvidence=program.issues.slice(0,7).map(x=>x.code+": "+x.finding);
 return {
  schemaVersion:"dis-rplice-handoff-proposal-v1",author:"DIS",specialistOwner:"RPLICE",
  status:"DRAFT_NOT_SENT",capabilityCatalogState:"CONTRACT_VERIFIED_NOT_E2E_ACCEPTED",
  actualRpcMethod:"NOT_DISCOVERED_OR_AUTHORIZED",partnerExecutionVerified:false,
  hasConsentToShareCase:false,secretTransferOccurred:false,
  dataClass:"PUBLIC_AGGREGATE_AND_SYNTHETIC_METHOD_DATA_ONLY",actionAuthorized:false,
  namedRealParticipantsVerified:false,
  methodology:{
   requested:["Structural Anchor and Leverage Protocol","MAP-GAP","EPIS/CFIR/RE-AIM relevance","FRAME adaptation tracking"],
   rationale:"Request an evidence-linked systems anchor/lever appraisal, fit-for-setting analysis and a change/adaptation protocol. RPLICE owns its specialized method, not DIS.",
   existingRplIceReadInterface:"GET /api/v1/public/frameworks — authorized read-only metadata, not case evaluation",
   possiblePrivateMethodExecution:"NOT_ENABLED_OR_VERIFIED"
  },
  investigation:{
   id:program.caseId,question:program.question.slice(0,800),
   sourceGeography:program.population.targetName.slice(0,150),
   targetGeography:flow.crossSiteTransport.destinationSite.slice(0,150),
   currentStep:flow.currentRecommendedPhase,
   disputedEvidence,
   requiredMethods:candidates.map(n=>n.id+": "+n.gates[0].question),
   proposedStrategy:flow.crossSiteTransport.candidateEbi,
   mechanismAndCoreFunction:"NOT_EMPIRICALLY_VALIDATED",
   transportability:"REQUIRES_SITE_SPECIFIC_REASSESSMENT"
  },
  boundaries:[
   "Case packet is locally constructed; no RPLICE call or data transfer occurred.",
   "RPLICE framework discovery is available only via existing server-only scoped credential and an authorized reader, not public transfer of any API secret.",
   "Public municipal/county data or synthetic researcher prompts are not individual health records, licensed medical recommendations or verified stakeholder testimony.",
   "No live SALP score, predictive status dial, resource command, intervention approval, clinic partnership or pilot execution is asserted.",
   "Future invocation must use actual versioned RPLICE MCP/REST method discovery, privacy scope, consent, tenancy controls and independent acceptance before use."
  ],
  nextAuthorizedAction:"Obtain RPLICE's exact, currently deployed read-only method catalog and identity/consent contract. Validate the schema and a redacted synthetic round trip before any private case transfer."
 };
}
