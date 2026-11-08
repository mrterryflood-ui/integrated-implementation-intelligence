/** Client coverage accounting. A final older page is complete only when the
 * preceding pages were traversed contiguously for the same case revision. */
import type {CaseLearningEvent} from "./longitudinal-learning";
import type {CaseHistoryPageInfo} from "./case-history-pagination";
export type HistoryView={caseId:string;caseVersion:number|null;events:CaseLearningEvent[];page:CaseHistoryPageInfo|null;complete:boolean;issue:string|null};
export const emptyHistoryView=(caseId:string):HistoryView=>({caseId:caseId.toLowerCase(),caseVersion:null,events:[],page:null,complete:false,issue:null});
const object=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==="object"&&!Array.isArray(x);
const older=(a:CaseLearningEvent,b:CaseLearningEvent)=>a.created_at<b.created_at||a.created_at===b.created_at&&a.id.toLowerCase()<b.id.toLowerCase();
export function receiveHistoryPage(previous:HistoryView,raw:unknown,requestedCursor:string|null=null):HistoryView{
 if(!object(raw)||!object(raw.case)||typeof raw.case.id!=="string"||raw.case.id.toLowerCase()!==previous.caseId||!Number.isSafeInteger(raw.case.version)||Number(raw.case.version)<1||!Array.isArray(raw.history)||raw.history.length>250)throw Error("History response does not match this case.");
 const events=raw.history as CaseLearningEvent[];
 if(events.some(e=>!object(e)||typeof e.id!=="string"||typeof e.event_type!=="string"||typeof e.created_at!=="string"||!Object.prototype.hasOwnProperty.call(e,"payload"))||new Set(events.map(e=>e.id)).size!==events.length)throw Error("History records require review; no coverage claim was changed.");
 const p=raw.historyPage;
 if(p===undefined&&requestedCursor===null)return {caseId:previous.caseId,caseVersion:raw.case.version as number,events:structuredClone(events),page:null,complete:false,issue:"History continuation metadata is unavailable; coverage is not established."};
 if(!object(p)||typeof p.hasMore!=="boolean"||typeof p.isFirstPage!=="boolean"||typeof p.incompleteCoverage!=="boolean"||p.caseVersion!==raw.case.version||p.returnedCount!==events.length||p.limit!==250||p.order!=="created_at_desc_id_desc"||p.maxResponseBytes!==3145728||
   (p.hasMore?(typeof p.nextCursor!=="string"||!p.nextCursor||p.nextCursor.length>512||!events.length):p.nextCursor!==null)||p.isFirstPage!==(requestedCursor===null)||p.incompleteCoverage!==(!p.isFirstPage||p.hasMore))throw Error("History pagination metadata is inconsistent; reload recent history.");
 if(requestedCursor!==null){
  if(!previous.page||previous.page.nextCursor!==requestedCursor||previous.caseVersion!==p.caseVersion)throw Error("The case or history changed during retrieval. Refresh recent history before continuing.");
  const ids=new Set(previous.events.map(e=>e.id));
  if(events.some(e=>ids.has(e.id))||previous.events.length&&events.length&&!older(events[0],previous.events[previous.events.length-1]))throw Error("History pages overlap or arrive out of order. Refresh recent history.");
 }
 for(let i=1;i<events.length;i++)if(!older(events[i],events[i-1]))throw Error("History order requires review.");
 return {caseId:previous.caseId,caseVersion:p.caseVersion as number,events:requestedCursor===null?structuredClone(events):[...previous.events,...structuredClone(events)],page:p as unknown as CaseHistoryPageInfo,complete:!p.hasMore,issue:null};
}
