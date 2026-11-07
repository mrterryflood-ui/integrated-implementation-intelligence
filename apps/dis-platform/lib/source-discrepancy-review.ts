/** Deterministic source-drift review. A change never silently replaces the accepted baseline. */
export type SourceCell={id:string;sourceUrl:string;sourceVersion:string;retrievedAt:string;period:string;construct:string;geography:string;population:string;value:number;unit:string};
export type Discrepancy={id:string;previous:SourceCell;candidate:SourceCell;changes:string[];state:"REVIEW_REQUIRED";decision:"NO_AUTOMATIC_REPLACEMENT";verifiedBy:null};
const fields=(["sourceUrl","sourceVersion","period","construct","geography","population","value","unit"] as const);
export function sourceDiscrepancies(previous:readonly SourceCell[],candidate:readonly SourceCell[]):Discrepancy[]{
 const old=new Map(previous.map(x=>[x.id,x]));const seen=new Set<string>();
 if(old.size!==previous.length)throw Error("Duplicate prior source identity");
 const out:Discrepancy[]=[];
 for(const c of candidate){
  if(seen.has(c.id))throw Error("Duplicate candidate source identity");seen.add(c.id);
  const p=old.get(c.id);if(!p)continue;
  if(!Number.isFinite(c.value)||!Number.isFinite(p.value)||!c.sourceUrl.startsWith("https://")||!p.sourceUrl.startsWith("https://"))throw Error("Invalid source measurement");
  const changes=fields.filter(k=>p[k]!==c[k]);
  if(changes.length)out.push({id:c.id,previous:structuredClone(p),candidate:structuredClone(c),changes,state:"REVIEW_REQUIRED",decision:"NO_AUTOMATIC_REPLACEMENT",verifiedBy:null});
 }
 return out;
}
/** Source-label correction, 2026-11-07: these are different observation windows.
 * The earlier candidate was incorrectly labeled 2018-2022 in our own ledger.
 * These source-reported rows are not raw-byte snapshots or independently adjudicated records.
 * A rendered-page creation date is not the observation window or registry submission.
 */
export const HARRIS_HISTORICAL_CONFLICT={
 previous:{id:"CRC-HARRIS-LATE-INC",sourceUrl:"https://www.statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=county&cancer=020&race=00&ruralurban=0&sex=0&sortOrder=desc&sortVariableName=name&stage=211&statefips=48&type=incd&year=0",sourceVersion:"SEER November 2024 submission; retrieved table labels 2018-2022",retrievedAt:"2026-11-07",period:"2018-2022",construct:"AGE_ADJUSTED_LATE_STAGE_INCIDENCE",geography:"Harris County TX",population:"All races, both sexes, all ages",value:23.3,unit:"per_100k"},
 candidate:{id:"CRC-HARRIS-LATE-INC",sourceUrl:"https://statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=county&cancer=020&race=00&ruralurban=0&sex=0&stage=211&statefips=48&type=incd",sourceVersion:"SEER November 2025 submission; retrieved table labels 2019-2023",retrievedAt:"2026-11-07",period:"2019-2023",construct:"AGE_ADJUSTED_LATE_STAGE_INCIDENCE",geography:"Harris County TX",population:"All races, both sexes, all ages",value:23.9,unit:"per_100k"}
} satisfies {previous:SourceCell;candidate:SourceCell};
