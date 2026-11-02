import {createHash} from 'node:crypto';
import type {Queryable} from './database';
import {createOrganization,OrganizationError} from './service';

export function normalizeVerifiedEmail(value:unknown):string|null{
 if(typeof value!=='string'||value.length>254)return null;
 const email=value.trim().toLowerCase();
 return /^[a-z0-9.!#$%&'*+/=?^_\x60{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(email)?email:null;
}
export function verifiedPrimaryEmail(user:unknown):string|null{
 if(!user||typeof user!=='object')return null;
 const u=user as {primaryEmailAddressId?:string;emailAddresses?:Array<{id:string;emailAddress:string;verification?:{status?:string}}>};
 const address=u.emailAddresses?.find(a=>a.id===u.primaryEmailAddressId);
 return address?.verification?.status==='verified'?normalizeVerifiedEmail(address.emailAddress):null;
}
export function emailInviteFingerprint(email:string){
 const normalized=normalizeVerifiedEmail(email);
 if(!normalized)throw new OrganizationError('A valid email address is required');
 return createHash('sha256').update('DIS_VERIFIED_EMAIL_INVITATION_V1\n'+normalized).digest('hex');
}
export function bootstrapConfig(env:Record<string,string|undefined>){
 const owner=normalizeVerifiedEmail(env.DIS_BOOTSTRAP_PLANNER_EMAIL);
 const name=(env.DIS_BOOTSTRAP_ORGANIZATION_NAME||'').trim();
 const roster=(env.DIS_BOOTSTRAP_MEMBER_EMAILS||'').split(',').map(x=>x.trim()).filter(Boolean);
 if(env.DIS_BOOTSTRAP_ENABLED!=='approved')return null;
 if(!owner||!name||name.length>160||roster.length<1||roster.length>30)return null;
 const normalized=roster.map(normalizeVerifiedEmail);
 if(normalized.some(x=>!x)||new Set(normalized).size!==normalized.length||normalized.includes(owner))return null;
 return {owner,name,roster:normalized as string[]};
}
/** This only seeds access for the operator-approved chapter; it cannot appoint decision makers.
 * Verified user email is obtained server-side from Clerk, NEVER browser request body.
 */
export async function provisionVerifiedOrganizationLogin(
 db:Queryable,actor:string,displayName:string,verifiedEmail:string|null,
 env:Record<string,string|undefined>=process.env
){
 if(!verifiedEmail)return {joined:0,bootstrapCreated:false};
 const config=bootstrapConfig(env);
 let bootstrapCreated=false;
 if(config&&verifiedEmail===config.owner){
  await db.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))",['dis-bootstrap:'+config.name+':'+actor]);
  let organization=(await db.query('SELECT id FROM dis_organizations WHERE created_by=$1 AND name=$2 ORDER BY created_at LIMIT 1',[actor,config.name])).rows[0];
  if(!organization){organization=await createOrganization(db,actor,config.name,displayName);bootstrapCreated=true;}
  for(const email of config.roster){
   await db.query('INSERT INTO dis_organization_email_invites(organization_id,email_fingerprint,approved_by) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[organization.id,emailInviteFingerprint(email),actor]);
  }
 }
 // The DB function cannot grant admin, facilitator or chapter decision authority.
 const joined=(await db.query('SELECT dis_redeem_verified_email_invites($1,$2,$3) AS n',[emailInviteFingerprint(verifiedEmail),actor,displayName])).rows[0]?.n||0;
 return {joined:Number(joined),bootstrapCreated};
}
export async function preapproveVerifiedEmail(db:Queryable,actor:string,orgId:string,email:unknown){
 // Called only after the organization service has enforced the authenticated admin role.
 const fingerprint=emailInviteFingerprint(String(email||''));
 const result=await db.query('INSERT INTO dis_organization_email_invites(organization_id,email_fingerprint,approved_by) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING organization_id',[orgId,fingerprint,actor]);
 return {queued:result.rows.length>0,emailsSent:0,decisionAuthorityGranted:false};
}
