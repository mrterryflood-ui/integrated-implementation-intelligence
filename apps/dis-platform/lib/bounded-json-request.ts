/** Enforce actual UTF-8 bytes before parsing; Content-Length is only an early hint. */
export class BoundedJsonRequestError extends Error{
 constructor(message:string,readonly status:400|413){super(message);this.name="BoundedJsonRequestError";}
}
export const jsonRequestStatus=(error:unknown):400|413=>error instanceof BoundedJsonRequestError?error.status:400;
export async function readBoundedJsonRequest(request:Request,maxBytes:number):Promise<unknown>{
 if(!Number.isSafeInteger(maxBytes)||maxBytes<1)throw new BoundedJsonRequestError("Invalid request capacity",400);
 const declared=Number(request.headers.get("content-length")||0);
 if(Number.isFinite(declared)&&declared>maxBytes)throw new BoundedJsonRequestError("Request too large",413);
 if(!request.body)throw new BoundedJsonRequestError("JSON body required",400);
 const reader=request.body.getReader(),parts:Uint8Array[]=[];let size=0;
 try{
  for(;;){const item=await reader.read();if(item.done)break;size+=item.value.byteLength;
   if(size>maxBytes){try{await reader.cancel();}catch{/* Over-capacity rejection still applies if producer cancellation fails. */}throw new BoundedJsonRequestError("Request too large",413);}
   parts.push(item.value);
  }
 }catch(error){if(error instanceof BoundedJsonRequestError)throw error;throw new BoundedJsonRequestError("Invalid JSON stream",400);}
 finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.byteLength;}
 try{return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));}
 catch{throw new BoundedJsonRequestError("Invalid JSON",400);}
}
