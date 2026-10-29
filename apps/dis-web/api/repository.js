/** Read-only inspection of public GitHub repositories. No credentials, cloning or code execution. */
export function parseRepository(input) {
 const value=String(input||"").trim();
 const match=value.match(/^(?:https:\/\/github\.com\/)?([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/);
 if(!match || match[1]==="." || match[2]==="." ) return null;
 return {owner:match[1],repo:match[2]};
}
export function reviewFiles(files,baseUrl){
 const names=new Set(files.map(f=>f.path));
 const findings=[];
 const add=(id,severity,observation,action,paths)=>findings.push({id,severity,observation,action,paths,classification:"STATIC HEURISTIC — NOT CONFIRMED DEFECT"});
 if(![...names].some(x=>/(^|\/)(test|tests|__tests__|e2e)\//i.test(x)||/\.(test|spec)\.[jt]sx?$/.test(x)))
   add("QA-01","review","No conventional test paths found in the inspected tree","Verify test strategy and add regression coverage if missing",[]);
 if(![...names].some(x=>/^\.github\/workflows\/.*\.ya?ml$/.test(x)))
   add("OPS-01","review","No GitHub Actions workflow found","Confirm CI is implemented elsewhere or introduce required checks",[]);
 if(![...names].some(x=>/^(README\.md|readme\.md)$/i.test(x)))
   add("DOC-01","review","No root README found","Document setup, architecture, operating ownership and recovery",[]);
 if([...names].some(x=>/^\.env$|^\.env\.local$|\/\.env$/.test(x)))
   add("SEC-01","high","Environment file path present in public tree","Inspect contents privately for credential exposure and rotate if necessary",[...names].filter(x=>/\.env/.test(x)));
 if(![...names].some(x=>/LICENSE(\.md|\.txt)?$/i.test(x)))
   add("GOV-01","review","No conventional license file found","Confirm intended intellectual-property and reuse policy",[]);
 return {repository:baseUrl,filesInspected:files.length,findings,inspectedPaths:files.slice(0,100).map(f=>f.path),note:"Path-level heuristics only. No code execution, security scan, or behavioral validation. Missing conventional paths does not prove missing capabilities."};
}
export async function inspectRepository(input,fetcher=fetch){
 const parsed=parseRepository(input);
 if(!parsed)return {status:"INVALID_REPOSITORY",error:"Enter a public GitHub repository URL in owner/repo format."};
 const base="https://github.com/"+parsed.owner+"/"+parsed.repo;
 const url="https://api.github.com/repos/"+encodeURIComponent(parsed.owner)+"/"+encodeURIComponent(parsed.repo)+"/git/trees/HEAD?recursive=1";
 try{
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),8000);
  let response;try{response=await fetcher(url,{signal:controller.signal,headers:{"Accept":"application/vnd.github+json"}})}finally{clearTimeout(timeout)}
  if(!response.ok)return {status:"UNAVAILABLE",repository:base,error:"GitHub returned HTTP "+response.status+". Private repositories are not supported by this public read-only inspector."};
  const json=await response.json();
  if(!Array.isArray(json.tree))return {status:"UNAVAILABLE",repository:base,error:"Unexpected GitHub tree response"};
  if(json.truncated)return {status:"INCOMPLETE",repository:base,error:"GitHub tree truncated. Findings withheld to avoid false omissions."};
  const files=json.tree.filter(x=>x.type==="blob").slice(0,5000);
  return {status:"INSPECTED",...reviewFiles(files,base),treeSha:json.sha||null};
 }catch(e){return {status:"UNAVAILABLE",repository:base,error:String(e.message||e)}}
}
