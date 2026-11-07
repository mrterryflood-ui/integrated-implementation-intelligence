/** Runtime input checks, not source authentication, privacy certification or scientific review. */
export const PUBLIC_MEASUREMENT_KEYS=[
 "id","title","sourceUrl","condition","construct","geography","populationFrame",
 "period","numeratorDefinition","denominatorDefinition","unit","methodVersion","value"
] as const;
export const CORRECTION_RECEIPT_KEYS=[
 "proposedActionId","deliveryRecordedAt","sourceUrl","eligibleDenominator","completedNumerator",
 "coreFunctionChecked","balancingHarmsReviewed","comparisonRecorded","reviewerIdentity"
] as const;
export function objectRecord(value:unknown):Record<string,unknown>|null{
 return value!==null&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:null;
}
export function credentialFreeHttps(value:unknown):boolean{
 if(typeof value!=="string"||value!==value.trim())return false;
 try{const url=new URL(value);return url.protocol==="https:"&&Boolean(url.hostname)&&!url.username&&!url.password;}
 catch{return false;}
}
/** Aliases are used for bounds only; never convert/relabel a source-reported unit. */
export function scaleViolation(value:unknown,unit:unknown):string|null{
 if(value===null)return null;
 if(typeof value!=="number"||!Number.isFinite(value)||value<0)return "Measurement must be finite and nonnegative, or explicitly unknown.";
 const label=typeof unit==="string"?unit.trim().toLowerCase().replace(/\s+/g," "):"";
 if(["%","percent","percentage","per cent","percentage (%)"].includes(label)&&value>100)
  return "Percent cannot exceed 100, regardless of the recognized unit alias.";
 if(["proportion","fraction","probability"].includes(label)&&value>1)
  return "A declared proportion, fraction or probability cannot exceed 1.";
 return null;
}
/** Explicit zone + real calendar date. Date.parse alone normalizes impossible dates. */
export function strictTimestamp(value:unknown):number|null{
 if(typeof value!=="string")return null;
 const match=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})$/.exec(value);
 if(!match)return null;
 const [year,month,day,hour,minute,second]=match.slice(1,7).map(x=>x===undefined?0:Number(x));
 const leap=year%4===0&&(year%100!==0||year%400===0);
 const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
 if(month<1||month>12||day<1||day>days[month-1]||hour>23||minute>59||second>59)return null;
 const zone=match[8];
 if(zone!=="Z"&&(Number(zone.slice(1,3))>23||Number(zone.slice(4,6))>59))return null;
 const result=Date.parse(value);return Number.isFinite(result)?result:null;
}
export function hasOnlyKeys(record:Record<string,unknown>,keys:readonly string[]):boolean{
 return Object.keys(record).every(key=>keys.includes(key));
}
