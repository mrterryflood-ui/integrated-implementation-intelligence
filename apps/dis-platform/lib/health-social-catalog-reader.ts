/**
 * Read-only DIS adapter for ThriveUp public-catalog metadata.
 * This deliberately does not expose ThriveUp YHSI, referrals, individual case
 * data, provider search, mental-health screening or patient records.
 * Two separate purpose-specific keys AND two explicit production approvals are
 * required; configuration is not proof of data ownership or live acceptance.
 */
export type CatalogLane="health-ms-public-organizations"|"social-benefits-programs";
export type CatalogReading={ok:boolean;data:unknown|null;observedAt:string|null;reason:string};
const ORIGIN="https://thrivingcommunitiesforall.com";
const CONFIG={
 "health-ms-public-organizations":{
  path:"/api/partner/v1/ms/intelligence",
  scope:"health:read",
  envKey:"DIS_THRIVEUP_HEALTH_META_KEY",
  approval:"DIS_HEALTH_META_READ_APPROVED"
 },
 "social-benefits-programs":{
  path:"/api/partner/v1/benefits?limit=12",
  scope:"benefits:read",
  envKey:"DIS_THRIVEUP_SOCIAL_CATALOG_KEY",
  approval:"DIS_SOCIAL_CATALOG_READ_APPROVED"
 }
} as const;
const obj=(v:unknown):Record<string,unknown>=>v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};
const short=(v:unknown,max=140)=>typeof v==="string"&&v.trim()?v.trim().slice(0,max):null;
const date=(v:unknown)=>typeof v==="string"&&Number.isFinite(Date.parse(v))?new Date(v).toISOString():null;
export async function readHealthSocialCatalog(
 lane:CatalogLane,env:Record<string,string|undefined>,fetcher:typeof fetch=fetch
):Promise<CatalogReading>{
 const fail=(reason:string):CatalogReading=>({ok:false,data:null,observedAt:null,reason});
 const cfg=CONFIG[lane];
 if(!cfg)return fail("Unknown catalog lane; no upstream request.");
 if(env[cfg.approval]!=="true")return fail("Purpose-specific owner approval is not enabled; no upstream request.");
 const credential=env[cfg.envKey];
 if(typeof credential!=="string"||credential.length<24||credential.length>2048||/\s/.test(credential))
  return fail("Dedicated scoped catalog credential absent or invalid; no upstream request.");
 try{
  const res=await fetcher(ORIGIN+cfg.path,{
   method:"GET",headers:{"x-partner-key":credential,"Accept":"application/json"},
   redirect:"error",cache:"no-store",signal:AbortSignal.timeout(6500)
  });
  if(!res.ok)return fail("Partner refused or could not fulfill the scoped read; no data accepted.");
  const raw=await res.text();
  if(raw.length>64000)return fail("Partner catalog response exceeded bounded data budget.");
  const body=JSON.parse(raw) as unknown,x=obj(body);
  if(lane==="health-ms-public-organizations"){
   if(x.sourceStatus!=="live_catalog_read"||!Array.isArray(x.platforms))
    return fail("MS public-organization catalog lacked verified response schema.");
   const publicOrgs=x.platforms.filter((p:unknown)=>obj(p).visibility==="public")
    .slice(0,8).map((p:unknown)=>{
     const v=obj(p);
     return {name:short(v.name,120),domain:short(v.domain,60),
      role:short(v.role,75),freshness:v.healthFreshness==="recent"?"recent":"stale_or_unknown",
      status:"CATALOG_ENTRY_NOT_CLINICALLY_VERIFIED"};
    }).filter(p=>p.name);
   if(publicOrgs.length===0)return fail("No public organizational catalog entries returned.");
   return {ok:true,observedAt:date(x.generatedAt),
    reason:"Publicly visible organizational metadata only. Status is not proof of care availability, care quality, clinical accuracy or verified referral.",
    data:{publicOrganizations:publicOrgs,
     note:"No provider search, contact records, patient data, protected platform entries, research claims or private platform states imported."}};
  }
  if(!Number.isSafeInteger(x.count)||Number(x.count)<1||!Array.isArray(x.programs))
   return fail("Social-resource catalog lacked required bounded response fields.");
  const programs=x.programs.slice(0,12).map((p:unknown)=>{
   const v=obj(p);return {title:short(v.title,120),status:short(v.status,45),
    geography:short(v.geographicFocus,85)};
  }).filter(p=>p.title);
  if(!programs.length)return fail("No public program titles returned.");
  return {ok:true,observedAt:date(x.exportedAt),
   reason:"Source-reported public program catalog only; current benefit availability, geography fit and personal eligibility are unverified.",
   data:{reportedProgramCount:x.count,programs,note:"No beneficiary records, private case notes, contact details, screening results or participant identity imported."}};
 }catch{return fail("Catalog service unavailable or response invalid; no substitute evidence invented.");}
}
