import PptxGenJS from 'pptxgenjs';
import {normalizeReport} from '../planning-contract';
import {implementationReviewQuestions,type ImplementationFieldId} from '../implementation-science';
import {wordPresentationText} from '../research-planning-handoff';

type SavedRecord={id:string;title:string;kind:string;version:number;digest:string;body:Record<string,any>};
type BriefBlock={title:string;text:string;references?:string[]};
const palette={ink:'14324A',accent:'006C78',muted:'526779',paper:'F7FAFC',white:'FFFFFF',line:'DAE4EC'};
const clean=(text:string)=>wordPresentationText(text);
const excerpt=(text:string,max=460)=>{
  const normalized=text.replace(/\s+/g,' ').trim()||'Not supplied';
  if(normalized.length<=max)return normalized;
  return normalized.slice(0,max-1).replace(/[\uD800-\uDBFF]$/,'')+'…';
};

/** Extractive presentation of a saved version. It creates no analysis, ballot, or approval. */
export async function buildOrganizationPresentation(record:SavedRecord,sources:SavedRecord[],completeSourceText:string):Promise<Uint8Array<ArrayBuffer>>{
  if(!record.body.report)throw Error('A saved planning report is required for PowerPoint');
  const report=normalizeReport(record.body.report),science=report.implementationScience;
  const deck=new PptxGenJS();deck.layout='LAYOUT_WIDE';deck.author='DIS';deck.subject='Saved organizational decision brief';deck.title=clean(record.title);deck.company='DIS';
  deck.theme={headFontFace:'Aptos Display',bodyFontFace:'Aptos'};
  const sourceNames=new Map(sources.map((source,index)=>[source.id,`S${index+1} · ${source.title} · version ${source.version}`]));
  const status=`Saved ${record.kind} · version ${record.version}`;
  const footer=`${status}  |  Extracts; complete text and source versions in speaker notes`;
  let slideNumber=0;
  function add(title:string,blocks:BriefBlock[],extraNotes=''){
    const slide=deck.addSlide();slide.background={color:palette.paper};slideNumber++;
    slide.addShape(deck.ShapeType.rect,{x:0,y:0,w:13.333,h:0.12,fill:{color:palette.accent},line:{color:palette.accent}});
    slide.addText(clean(title),{x:0.55,y:0.38,w:12.2,h:0.65,fontSize:28,bold:true,color:palette.ink,breakLine:false,margin:0,fit:'shrink'});
    const gap=0.3,width=(12.23-gap*(blocks.length-1))/blocks.length;
    blocks.forEach((block,index)=>{
      const x=0.55+index*(width+gap);
      slide.addShape(deck.ShapeType.rect,{x,y:1.35,w:width,h:4.95,fill:{color:palette.white},line:{color:palette.line,width:1}});
      slide.addText(clean(block.title),{x:x+0.22,y:1.6,w:width-0.44,h:0.55,fontSize:19,bold:true,color:palette.accent,margin:0,fit:'shrink'});
      slide.addText(clean(excerpt(block.text,blocks.length===1?900:460)),{x:x+0.22,y:2.28,w:width-0.44,h:3.1,fontSize:18,color:palette.ink,margin:0,valign:'top',fit:'shrink',breakLine:false});
      if(block.references?.length)slide.addText(clean('References supplied: '+block.references.join('; ')),{x:x+0.22,y:5.55,w:width-0.44,h:0.48,fontSize:10,color:palette.muted,margin:0,fit:'shrink'});
    });
    slide.addText(clean(footer),{x:0.55,y:6.77,w:11.7,h:0.3,fontSize:10,color:palette.muted,margin:0});
    slide.addText(String(slideNumber),{x:12.4,y:6.77,w:0.35,h:0.3,fontSize:10,color:palette.muted,align:'right',margin:0});
    slide.addNotes(clean(`${record.title}\n${status}\nRecord ${record.id}; fingerprint ${record.digest}\n\n${blocks.map(block=>block.title+'\n'+block.text+(block.references?.length?'\nSource references for review: '+block.references.join('; '):'')).join('\n\n')}\n\n${extraNotes}`));
    return slide;
  }
  const implementation=(title:string,fields:ImplementationFieldId[]):BriefBlock=>({
    title,
    text:fields.map(id=>science?.fields[id]||'Not supplied').join('\n\n'),
    references:[...new Set(fields.flatMap(id=>(science?.evidenceRefs?.[id]||[]).map(ref=>sourceNames.get(ref.recordId)||`Record ${ref.recordId}, version ${ref.version}`)))],
  });
  add('Decision briefing',[{title:record.title,text:report.sections.question},{title:'What this briefing represents',text:`${status}. This is an extractive presentation of a saved organizational record. The committee must review the evidence, remaining questions, and its established decision rules. Exporting this deck does not cast a ballot or grant approval.`}]);
  add('Purpose and setting',[{title:'Who and where',text:report.sections.scope},{title:'Intended outcomes',text:report.sections.outcomes}]);
  add('Options for discussion',[{title:'Options and alternatives',text:report.sections.options},{title:'Recorded recommendation',text:report.sections.recommendation}]);
  if(science){
    add('Does the approach fit here?',[implementation('Approach and rationale',['approach','approachRationale']),implementation('Setting, barriers and support',['setting','determinants'])]);
    add('How adoption and delivery would work',[implementation('Supporting adoption',['strategies']),implementation('Delivery and feasibility',['delivery','feasibility'])]);
    add('Two different questions to measure',[implementation('Are people using and delivering it?',['implementationOutcomes']),implementation('Is it benefiting people?',['serviceOutcomes'])],'Do not substitute task completion, attendance, or implementation measures for service or beneficiary effects. Unknown baselines and proposed targets remain distinct.');
    add('Adaptation and sustainment',[implementation('What stays and what can change',['fidelityAdaptation']),implementation('Keeping it working',['sustainment','reviewTriggers'])]);
  }else{
    add('Implementation information',[{title:'Recorded delivery plan',text:report.sections.implementation},{title:'Further implementation questions',text:'No implementation-science section was supplied. Review the approach, local context, adoption, delivery, adaptation, separate implementation and service outcomes, and sustainment.'}]);
  }
  const missing=science?implementationReviewQuestions(science).map(item=>item.question).join('\n'):'';
  add('Questions before a decision',[{title:'Unresolved questions',text:[report.sections.questions,missing].filter(Boolean).join('\n\n')},{title:'Reservations and risks',text:[report.sections.dissent,report.sections.risks].filter(Boolean).join('\n\n')}]);
  add('Record the committee’s decision',[{title:'Decision to record',text:report.sections.question},{title:'Follow-through',text:'Use the organization’s confirmed decision process. Record the outcome and rationale in DIS, including unresolved conditions and differing views. Assign accepted next actions, resources, completion criteria, and a review point. This deck does not record or approve a vote.'}]);
  add('Source record and supporting material',[{title:'Saved source references',text:sources.length?sources.map((source,index)=>`S${index+1}: ${source.title} (version ${source.version}; ${source.kind})`).join('\n'):'No linked organizational source records were attached.'},{title:'Inspect the evidence',text:'Full saved content, source versions, source snapshots, and any supplied external citations are retained in these speaker notes. Citations identify material to inspect; they do not independently verify a claim. The original Word, Markdown, and JSON exports retain the detailed record.'}],completeSourceText);
  const output=await deck.write({outputType:'nodebuffer'});
  return new Uint8Array(output as Buffer);
}
