const TEXT_EXT=new Set(["txt","md","csv","json","xml","html","htm","log","eml","yaml","yml","rtf"]);
export const ALLOWED_EXT=new Set([...TEXT_EXT,"pdf","docx"]);
export function extension(name:string){return (name.split(".").pop()||"").toLowerCase()}
export function safeName(name:string){return name.replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,110)||"document"}
export async function extractFile(name:string,buffer:Buffer):Promise<{state:"EXTRACTED"|"UNSUPPORTED"|"FAILED"|"EMPTY",text:string|null}>{
 const ext=extension(name);
 try{
  let value:string|null=null;
  if(TEXT_EXT.has(ext))value=buffer.toString("utf8");
  else if(ext==="docx"){const mammoth=await import("mammoth");value=(await mammoth.extractRawText({buffer})).value}
  else if(ext==="pdf"){const pdfParse=(await import("pdf-parse")).default;value=(await pdfParse(buffer,{max:80})).text}
  else return {state:"UNSUPPORTED",text:null};
  const trimmed=(value||"").trim().slice(0,150000);
  return {state:trimmed?"EXTRACTED":"EMPTY",text:trimmed||null};
 }catch{return {state:"FAILED",text:null}}
}
