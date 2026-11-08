import EvidenceActionClient from "./evidence-action-client";
import "../research-program.css";
export const metadata={
  title:"DIS | Evidence-to-Action Research Bridge",
  description:"Colorectal case study connecting existing DIS evidence, source discovery, denominator crosswalks, competing explanations, counterfactual readiness and corrective-action verification."
};
export default async function EvidenceActionPage({searchParams}:{searchParams:Promise<{caseId?:string|string[]}>}){
 const params=await searchParams;const caseId=typeof params.caseId==="string"?params.caseId:"";
 return <EvidenceActionClient key={caseId} caseId={caseId}/>;
}
