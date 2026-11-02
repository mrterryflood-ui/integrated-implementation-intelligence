import {inOrganizationTransaction} from '../../../../lib/organizations/database';
import {membership,uuid,OrganizationError,storeEvidence} from '../../../../lib/organizations/service';
import {organizationActor,readOrganizationAction,organizationFailure,organizationResponse} from '../../../../lib/organizations/http';
import {integratedInvestigation} from '../../../../lib/integrated-research';
import {sanitizeIntake} from '../../../../lib/consultation';
import {looksLikePrivateRecord} from '../../../../lib/answer-release-policy';
import {parseEngagement} from '../../../../lib/ecosystem/contracts';
import {executeEngagement} from '../../../../lib/ecosystem/orchestrator';
export const runtime='nodejs';export const maxDuration=90;
export async function POST(req:Request){try{
 const actor=await organizationActor(),input=await readOrganizationAction(req),org=uuid(input.organizationId);
 if(input.externalConsent!==true||input.shareWithOrganization!==true)throw new OrganizationError('Approve external research and sharing its result with this organization',403);
 const intake=sanitizeIntake(input.intake||{});if(intake.mission.length<8||looksLikePrivateRecord(JSON.stringify(intake)))throw new OrganizationError('Use a non-identifying organizational question');
 await inOrganizationTransaction(actor,async db=>{await membership(db,org,actor,true);const quota=await db.query('INSERT INTO dis_consult_usage(subject_id,calls) VALUES($1,1) ON CONFLICT(subject_id,usage_day) DO UPDATE SET calls=dis_consult_usage.calls+1 WHERE dis_consult_usage.calls<20 RETURNING calls',[actor]);if(!quota.rows.length)throw new OrganizationError('Daily research limit reached',429);});
 const bundle=await integratedInvestigation(intake);let ecosystem:any=null;
 if(input.includePlatformEvidence===true){
  const engagement=parseEngagement({problem:intake.mission,audience:intake.audience,geography:{kind:'unspecified',label:intake.geography},domains:['community','education','funding','business','social-care'],externalConsent:true});
  ecosystem=await executeEngagement(engagement,{kind:'AUTHENTICATED_AGGREGATE',subjectId:actor});
  const ids=new Set(bundle.records.map(x=>x.id));let n=9000;
  for(const item of ecosystem.items){while(ids.has('E'+n))n++;const id='E'+n++;ids.add(id);bundle.records.push({id,kind:'TECHNICAL_REPORT',title:item.title,summary:item.summary,source:item.source,url:item.url,retrievedAt:item.retrievedAt,sourceStatus:'DISCOVERY_ONLY'});}
  bundle.coverage={...bundle.coverage,...Object.fromEntries(ecosystem.receipts.map((r:any)=>[r.platformId+'/'+r.capabilityId,r.state]))};
  bundle.errors.push(...ecosystem.receipts.filter((r:any)=>r.state!=='RETURNED').map((r:any)=>r.capabilityId+': '+r.state+' — '+r.reason));
 }
 return organizationResponse({evidence:await inOrganizationTransaction(actor,db=>storeEvidence(db,org,actor,{...bundle,ecosystemReceipts:ecosystem?.receipts||[],ecosystemReceiptHash:ecosystem?.receiptHash||null})),notice:'Public and permitted platform evidence share this source register. Unavailable integrations remain visible, not simulated.'});
 }catch(e){return organizationFailure(e)}}
