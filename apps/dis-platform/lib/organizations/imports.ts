import {createHash} from 'node:crypto';
import {inflateRawSync} from 'node:zlib';
import JSZip from 'jszip';
import {extractRawText} from 'mammoth';
import {normalizeReport,reportFromText,PLANNING_SCHEMA,PLANNING_SECTIONS,type PlanningReport} from '../planning-contract';
import {OrganizationError} from './service';
const MAX_TEXT=1000000,MAX_EXPANDED=64*1024*1024;
/** Inspect central-directory declarations BEFORE a document parser decompresses any entry. ZIP64 and encrypted archives require offline review. */
export function inspectOfficeZip(buffer:Buffer){
 let end=-1;for(let i=buffer.length-22;i>=Math.max(0,buffer.length-65557);i--)if(buffer.readUInt32LE(i)===0x06054b50){end=i;break;}
 if(end<0)throw new OrganizationError('Invalid Office archive');
 const count=buffer.readUInt16LE(end+10),offset=buffer.readUInt32LE(end+16),size=buffer.readUInt32LE(end+12);
 if(count===65535||count>2500||offset===0xffffffff||offset+size!==end||offset<0)throw new OrganizationError('Archive exceeds safe extraction bounds');
 let p=offset,total=0;const names:string[]=[];
 for(let n=0;n<count;n++){
  if(p+46>end||buffer.readUInt32LE(p)!==0x02014b50)throw new OrganizationError('Malformed Office archive');
  const flags=buffer.readUInt16LE(p+8),method=buffer.readUInt16LE(p+10),local=buffer.readUInt32LE(p+42),compressed=buffer.readUInt32LE(p+20),expanded=buffer.readUInt32LE(p+24),nameLen=buffer.readUInt16LE(p+28),extraLen=buffer.readUInt16LE(p+30),commentLen=buffer.readUInt16LE(p+32);
  if(flags&1||expanded===0xffffffff||compressed===0xffffffff||p+46+nameLen+extraLen+commentLen>end)throw new OrganizationError('Encrypted or unsupported Office archive');
  total+=expanded;const name=buffer.subarray(p+46,p+46+nameLen).toString('utf8');
  if(total>MAX_EXPANDED||expanded>24*1024*1024||expanded>Math.max(1048576,compressed*200)||/vbaProject|\.exe$|\.js$/i.test(name)||name.startsWith('/')||name.split('/').includes('..'))throw new OrganizationError('Archive needs separate security review');
  if(local+30>offset||buffer.readUInt32LE(local)!==0x04034b50)throw new OrganizationError('Invalid archive local entry');
  const start=local+30+buffer.readUInt16LE(local+26)+buffer.readUInt16LE(local+28);
  if(start+compressed>offset||![0,8].includes(method))throw new OrganizationError('Invalid archive data range');
  const raw=buffer.subarray(start,start+compressed),decoded=method===8?inflateRawSync(raw,{maxOutputLength:Math.max(1,expanded+1)}):raw;
  if(decoded.length!==expanded)throw new OrganizationError('Archive expanded size does not match its manifest');
  if(/\.(xml|rels)$/i.test(name)&&/<!DOCTYPE|<!ENTITY/i.test(decoded.toString('utf8')))throw new OrganizationError('XML entity declarations require separate review');
  names.push(name);p+=46+nameLen+extraLen+commentLen;
 }
 if(p!==offset+size)throw new OrganizationError('The Office directory count or size is inconsistent; refuse uninspected entries');
 if(new Set(names).size!==names.length)throw new OrganizationError('Duplicate archive entries');
 return{names,expandedBytes:total};
}
function xmlText(value:string){if(/<!DOCTYPE|<!ENTITY/i.test(value))throw new OrganizationError('XML entities are not accepted');return value.replace(/<[^>]*>/g,'').replace(/&#x([a-f0-9]+);/gi,(_,x)=>{const n=parseInt(x,16);return n<=0x10ffff?String.fromCodePoint(n):'';}).replace(/&#(\d+);/g,(_,x)=>{const n=Number(x);return n<=0x10ffff?String.fromCodePoint(n):'';}).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');}
export function csvRows(value:string){
 if(value.length>MAX_TEXT)throw new OrganizationError('Template text exceeds the extraction boundary');
 const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
 for(let i=0;i<value.length;i++){const c=value[i];if(c==='"'){if(quoted&&value[i+1]==='"'){cell+='"';i++;}else if(!quoted&&cell==='')quoted=true;else if(quoted)quoted=false;else throw new OrganizationError('Malformed CSV quoting');}else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&value[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';}else cell+=c;}
 if(quoted)throw new OrganizationError('Unclosed CSV value');row.push(cell);if(row.some(x=>x.trim()))rows.push(row);if(rows.length>300)throw new OrganizationError('Too many template rows');return rows;
}
function reportFromRows(rows:string[][]){
 const fields:Record<string,string>={};let schema=PLANNING_SCHEMA;
 for(const row of rows){const columns=row.map(x=>x.trim());if(!columns.some(Boolean))continue;
  let key:string,value:string;
  if(columns[0]===PLANNING_SCHEMA&&columns.length>=4){schema=columns[0];key=columns[1];value=row[3]||'';}
  else{key=columns[0];value=row[1]||'';}
  if(['field','field id','sectionid','section id','schemaversion'].includes(key.toLowerCase())&&/response|value|section/i.test(value))continue;
  key=key.replace(/^\[DIS_FIELD:/,'').replace(/\]$/,'');
  if(key==='schemaVersion'){schema=value.trim();continue;}
  if(key==='title'||PLANNING_SECTIONS.some(([id])=>id===key)){if(Object.hasOwn(fields,key))throw new OrganizationError('Duplicate template field: '+key);fields[key]=value;}
  else throw new OrganizationError('Unmapped spreadsheet/CSV row: '+key+'. Use the field/value input sheet.');
 }
 return normalizeReport({schemaVersion:schema,title:fields.title||'',sections:Object.fromEntries(PLANNING_SECTIONS.map(([id])=>[id,fields[id]||'']))});
}
async function spreadsheetRows(buffer:Buffer){
 const manifest=inspectOfficeZip(buffer);if(!manifest.names.includes('xl/workbook.xml'))throw new OrganizationError('Not an XLSX workbook');
 const zip=await JSZip.loadAsync(buffer,{checkCRC32:true});const shared=await zip.file('xl/sharedStrings.xml')?.async('string')||'';
 if(shared.length>MAX_TEXT*4)throw new OrganizationError('Spreadsheet strings exceed extraction bounds');
 const strings=[...shared.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map(x=>[...x[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(t=>xmlText(t[1])).join(''));
 const sheets=manifest.names.filter(n=>/^xl\/worksheets\/sheet\d+\.xml$/.test(n));if(sheets.length>12)throw new OrganizationError('Use a dedicated member-input workbook');
 const candidates:PlanningReport[]=[];
 for(const name of sheets){const source=await zip.file(name)!.async('string');if(source.length>MAX_TEXT*4)throw new OrganizationError('Worksheet exceeds extraction bounds');if(/<!DOCTYPE|<!ENTITY/i.test(source))throw new OrganizationError('Unsafe worksheet XML');
  const rows:string[][]=[];for(const match of source.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)){const row:string[]=[];for(const cell of match[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)){const ref=cell[1].match(/\br="([A-Z]+)\d+"/)?.[1];if(!ref)continue;let col=0;for(const c of ref)col=col*26+c.charCodeAt(0)-64;if(col>8)throw new OrganizationError('Template worksheet must use field/value columns');if(/<f\b/i.test(cell[2]))throw new OrganizationError('Input formulas are not evaluated; replace them with values');let v=cell[2].match(/<v[^>]*>([\s\S]*?)<\/v>/)?.[1]||'';if(/\bt="s"/.test(cell[1]))v=strings[Number(v)]??'';else if(/\bt="inlineStr"/.test(cell[1]))v=[...cell[2].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(t=>xmlText(t[1])).join('');else v=xmlText(v);row[col-1]=v;}rows.push(Array.from({length:Math.max(2,row.length)},(_,i)=>row[i]||''));if(rows.length>300)throw new OrganizationError('Too many template rows');}
  if(rows.some(r=>r[0]==='schemaVersion'||r[0]===PLANNING_SCHEMA)){candidates.push(reportFromRows(rows));}
 }
 if(candidates.length!==1)throw new OrganizationError('Exactly one field/value member-input worksheet is required');return candidates[0];
}
export async function extractPlanningFile(filename:string,bytes:Buffer){
 const ext=filename.split('.').at(-1)?.toLowerCase();const hash=createHash('sha256').update(bytes).digest('hex');
 if(bytes.length>100*1024*1024)throw new OrganizationError('File exceeds 100 MiB',413);
 let report:PlanningReport;
 if(ext==='json'){
  if(bytes.length>MAX_TEXT)throw new OrganizationError('JSON template exceeds 1 MiB');const input=JSON.parse(bytes.toString('utf8'));
  // Explicit compatibility with the previously delivered content contract; no unknown-field dropping.
  if(input.content&&!input.sections)report=normalizeReport({schemaVersion:input.schemaVersion,title:input.title,sections:input.content});else report=normalizeReport(input);
 }else if(ext==='csv')report=reportFromRows(csvRows(bytes.toString('utf8')));
 else if(ext==='xlsx')report=await spreadsheetRows(bytes);
 else{
  let source:string;
  if(ext==='docx'){const zip=inspectOfficeZip(bytes);if(!zip.names.includes('word/document.xml'))throw new OrganizationError('Not a DOCX document');source=(await extractRawText({buffer:bytes})).value;}
  else if(ext==='txt'||ext==='md'){source=bytes.toString('utf8');}
  else throw new OrganizationError('This original is archived. For editable planning input use DOCX, XLSX, CSV, JSON, TXT or Markdown. PDF is a reading copy, not the input template.');
  if(source.length>MAX_TEXT)throw new OrganizationError('Extraction exceeds the mapping limit; original remains archived');
  report=reportFromText(source);
 }
 return {report,originalSha256:hash,filename,requiresMemberReview:true as const,note:'Review every mapped section before saving. Import does not submit, share or approve the report.'};
}

/** Capability extraction is an author-reviewed draft, never qualification verification. */
export async function extractCapabilityFile(filename:string,bytes:Buffer){
 const ext=filename.split('.').at(-1)?.toLowerCase();let value='';
 if(bytes.length>20*1024*1024)throw new OrganizationError('Capability extraction is limited to 20 MiB; the original remains archived',413);
 if(ext==='docx'){inspectOfficeZip(bytes);const mammoth=await import('mammoth');value=(await mammoth.extractRawText({buffer:bytes})).value;}
 else if(['txt','md'].includes(ext||''))value=bytes.toString('utf8');
 else if(ext==='pdf'){const parser=(await import('pdf-parse')).default;const result=await parser(bytes,{max:40});if(result.numpages>40)throw new OrganizationError('This capability statement exceeds forty pages; use a focused editable statement');value=result.text;}
 else throw new OrganizationError('For a capability statement, use DOCX, text, Markdown or a text-based PDF');
 value=value.trim();if(!value)throw new OrganizationError('No readable text was found. Use an editable capability statement; no OCR or qualifications were inferred');
 if(value.length>10000)throw new OrganizationError('The statement exceeds 10,000 characters. Retain the original and prepare a shorter statement; no text was silently dropped',413);
 return{filename,capability:{title:filename.replace(/\.[^.]+$/,'').slice(0,180),description:value,expertise:[],availability:''},requiresMemberReview:true,note:'Review this extracted text, identify your expertise and availability, then choose sharing. No qualification was independently verified.'};
}
