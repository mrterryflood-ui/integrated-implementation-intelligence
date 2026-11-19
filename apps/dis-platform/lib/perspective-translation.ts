export const DEPTHS=["Simple","Moderate","Deep","Research"] as const;
export const DIRECTIONS=["One-way","Bidirectional","Multiple stakeholders"] as const;
type Depth=typeof DEPTHS[number];type Direction=typeof DIRECTIONS[number];
export type PerspectiveRequest={from:string;to:string;source:string;objective:string;language:string;depth:Depth;direction:Direction;consent:boolean;experience:string;priorities:string;audienceStatements:string;unknowns:string};
const normalize=(v:unknown,max:number)=>typeof v==="string"?v.trim().slice(0,max):"";
export function validatePerspectiveRequest(value:unknown):{ok:true;value:PerspectiveRequest}|{ok:false;error:string}{
 if(!value||typeof value!=="object"||Array.isArray(value))return{ok:false,error:"Invalid request"};
 const x=value as Record<string,unknown>;
 const from=normalize(x.from,160),to=normalize(x.to,250),source=normalize(x.source,9000),objective=normalize(x.objective,350),language=normalize(x.language,70)||"English";
 const experience=normalize(x.experience,900),priorities=normalize(x.priorities,600),audienceStatements=normalize(x.audienceStatements,900),unknowns=normalize(x.unknowns,600);
 for(const [key,max] of [["experience",900],["priorities",600],["audienceStatements",900],["unknowns",600]] as const){
   if(x[key]!==undefined&&(typeof x[key]!=="string"||x[key].length>max))return{ok:false,error:"Invalid or oversized stakeholder context"};
 }
 if(!from||!to)return{ok:false,error:"Describe both your role and the receiving audience"};
 if(source.length<15)return{ok:false,error:"Enter at least 15 characters of non-identifying source text"};
 if(typeof x.source!=="string"||x.source.length>9000)return{ok:false,error:"Source text exceeds the 9,000-character limit"};
 if(!DEPTHS.includes(x.depth as Depth))return{ok:false,error:"Select Simple, Moderate, Deep or Research"};
 if(!DIRECTIONS.includes(x.direction as Direction))return{ok:false,error:"Invalid direction"};
 if(language.length>70||!/^[\p{L}\p{M}\s()-]+$/u.test(language))return{ok:false,error:"Invalid language"};
 if(x.consent!==true)return{ok:false,error:"Explicit AI transfer consent required"};
 return{ok:true,value:{from,to,source,objective,language,depth:x.depth as Depth,direction:x.direction as Direction,consent:true,experience,priorities,audienceStatements,unknowns}};
}
