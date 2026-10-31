import {ContractError,type EngagementInput} from './contracts';
/** Exact receiver contract inspected at Businessorchestr PR6 / 64572e2; the receiver audience is corrected in coordination with its independent review. */
export const BUSINESS_SERVICE={platformId:'business',capabilityId:'business-official-evidence',endpoint:'https://govbizorchestrator.com/api/internal/dis/v1/read',audience:'https://govbizorchestrator.com/api/internal/dis/v1/read',contractRevision:'64572e2d7ac4ff81c0ab92855abf36e5f3e5ce17'} as const;
const STATES:Record<string,string>={'01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT','10':'DE','11':'DC','12':'FL','13':'GA','15':'HI','16':'ID','17':'IL','18':'IN','19':'IA','20':'KS','21':'KY','22':'LA','23':'ME','24':'MD','25':'MA','26':'MI','27':'MN','28':'MS','29':'MO','30':'MT','31':'NE','32':'NV','33':'NH','34':'NJ','35':'NM','36':'NY','37':'NC','38':'ND','39':'OH','40':'OK','41':'OR','42':'PA','44':'RI','45':'SC','46':'SD','47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA','54':'WV','55':'WI','56':'WY'};
export function businessGeography(input:EngagementInput):{country:'US';stateCode?:string}{
 const code=input.geography.stateFips||input.geography.countyFips?.slice(0,2);
 if(code&&!STATES[code])throw new ContractError('BUSINESS_GEOGRAPHY_UNSUPPORTED','This business service does not support the supplied state or territory code.');
 return{country:'US',...(code?{stateCode:STATES[code]}:{})};
}
export function describeBusinessGeography(value:unknown):string{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new ContractError('INVALID_SERVICE_RESPONSE','Business evidence is missing its geographic scope.');
 const v=value as Record<string,unknown>;
 if(v.country!=='US'||Object.keys(v).some(k=>!['country','stateCode'].includes(k))||v.stateCode!==undefined&&!Object.values(STATES).includes(String(v.stateCode)))throw new ContractError('INVALID_SERVICE_RESPONSE','Business evidence geography does not match the reviewed contract.');
 return v.stateCode?'United States / '+v.stateCode+' (state-level source; not a city estimate)':'United States (national source coverage; not a local estimate)';
}
