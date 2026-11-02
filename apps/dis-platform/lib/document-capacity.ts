export const MiB=1024*1024;
export const GiB=1024*MiB;
export const DEFAULT_FILE_BYTES=250*MiB;
export const DEFAULT_WORKSPACE_BYTES=25*GiB;
/** Limits are application policy, not purchased storage or a claim about provider billing. */
export function documentCapacity(env:Record<string,string|undefined>={}){
 const read=(key:string,fallback:number,min:number,max:number)=>{const raw=env[key];if(raw===undefined||raw==='')return fallback;const n=Number(raw);if(!Number.isSafeInteger(n)||n<min||n>max)throw Error('Invalid storage policy: '+key);return n;};
 const fileBytes=read('DIS_MAX_FILE_BYTES',DEFAULT_FILE_BYTES,MiB,1024*MiB);
 const workspaceBytes=read('DIS_WORKSPACE_STORAGE_BYTES',DEFAULT_WORKSPACE_BYTES,fileBytes,1024*GiB);
 return {fileBytes,workspaceBytes,transport:'DIRECT_PRIVATE_MULTIPART',originalBytesRetained:true};
}
export function checkReservation(size:number,used:number,reserved:number,limits=documentCapacity()){
 if(!Number.isSafeInteger(size)||size<=0||size>limits.fileBytes)throw Error('File exceeds the configured per-file limit');
 if(!Number.isSafeInteger(used)||used<0||!Number.isSafeInteger(reserved)||reserved<0)throw Error('Storage usage unavailable');
 if(used+reserved+size>limits.workspaceBytes)throw Error('Workspace capacity would be exceeded');
 return {remainingBytes:limits.workspaceBytes-used-reserved-size};
}
export const DOCUMENT_TYPES:Record<string,string>={pdf:'application/pdf',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',csv:'text/csv',json:'application/json',txt:'text/plain',md:'text/plain'};
export function documentType(name:string){const ext=name.split('.').at(-1)?.toLowerCase()||'';if(!DOCUMENT_TYPES[ext])throw Error('Use PDF, DOCX, XLSX, CSV, JSON, TXT or MD. Executables and macro-enabled files are blocked.');return DOCUMENT_TYPES[ext];}
export function safeFilename(name:string){return name.normalize('NFKC').replace(/[\x00-\x1f\x7f/\\]/g,'_').replace(/[^a-zA-Z0-9._ -]/g,'_').slice(0,160)||'document';}
