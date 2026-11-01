/** Source-first gate for code-level assessments of a specific user-owned system.
 * A portfolio registry, prompt text, or related product is NOT a substitute
 * for the requested application's actual source revision and test evidence.
 */
export function requiresSourceInspection(prompt:string):boolean{
 const specific=/\b(my|our|i\s+(?:built|created|developed)|we\s+(?:built|created|developed))\b.{0,95}\b(platform|app|application|software|system|repository|codebase)\b|\b(platform|app|application|software|system|repository|codebase)\b.{0,95}\b(i\s+(?:built|created)|we\s+built)\b/i.test(prompt);
 const assessment=/\b(evaluat\w*|audit\w*|inspect\w*|review\w*|assess\w*|compare\w*|gap\w*|capabilit\w*|fit|ready|requirements?)\b/i.test(prompt);
 return specific&&assessment;
}
export function sourceInspectionBlock(prompt:string,serverSource?:{repository:string;revision:string;inspected:boolean}):null|{state:'SOURCE_INSPECTION_REQUIRED';reason:string;required:string[]}{
 if(!requiresSourceInspection(prompt))return null;
 if(serverSource?.inspected===true&&/^[a-f0-9]{40}$/.test(serverSource.revision)&&/^[\w.-]+\/[\w.-]+$/.test(serverSource.repository))return null;
 return {state:'SOURCE_INSPECTION_REQUIRED',
 reason:'A code-level assessment of the named owned platform requires inspection of that exact application. No portfolio substitute, inferred feature or council conclusion is authorized.',
 required:['Resolve the canonical application identity from connected app/repository inventory','Inspect exact serving source revision, implementation, tests and runtime','Map source-backed capabilities to the original stakeholder communication','Record verified, simulated, missing and untested separately','Then convene independent challenge and provide remediation with acceptance tests']};
}
