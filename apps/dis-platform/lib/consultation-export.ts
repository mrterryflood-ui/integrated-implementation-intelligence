import pptxgen from "pptxgenjs";
import {Document,Packer,Paragraph,TextRun,HeadingLevel,AlignmentType} from "docx";
import type {ConsultationPackage} from "./consultation-package";
import {normalizeExportIntelligence,normalizeExportSlides} from './consultation-export-sources';
const NAVY="11283C",DEEP="071E2D",GOLD="CBAE77",CREAM="F6F3EA",INK="17324B",PALE="EFF4F6";
const shrink=(value:string,max=200)=>value.trim().slice(0,max);
export async function exportPptx(pkg:ConsultationPackage,theme:"midnight"|"forest"|"slate"="midnight"):Promise<Buffer>{
 normalizeExportSlides(pkg.slides,normalizeExportIntelligence(pkg.intelligence));
 const palette=theme==="forest"?{deep:"0C2E2A",navy:"143B34",gold:"D6B980"}:theme==="slate"?{deep:"1F293B",navy:"263248",gold:"97BBDF"}:{deep:DEEP,navy:NAVY,gold:GOLD};
 const pptx=new pptxgen();
 pptx.layout="LAYOUT_WIDE";
 pptx.author="Dynamic Intelligence";
 pptx.subject="DIS consultation — draft pending verification";
 pptx.title=shrink(pkg.intake.organization||"DIS Consultation",100);
 pptx.company="Dynamic Intelligence";
 for(let i=0;i<pkg.slides.length;i++){
  const spec=pkg.slides[i],slide=pptx.addSlide();
  slide.background={color:i===0||i===pkg.slides.length-1?palette.deep:palette.navy};
  slide.addShape(pptx.ShapeType.rect,{x:0,y:0,w:0.12,h:7.5,line:{color:palette.gold},fill:{color:palette.gold}});
  slide.addText("DYNAMIC INTELLIGENCE  /  DIS",{x:0.58,y:0.34,w:7.4,h:0.28,fontSize:10,bold:true,charSpacing:1.7,color:palette.gold,breakLine:false,margin:0});
  slide.addText("WORKING DRAFT — EVIDENCE GATES OPEN",{x:9.17,y:0.34,w:3.55,h:0.25,fontSize:8,color:"AABAC6",align:"right",margin:0});
  slide.addShape(pptx.ShapeType.line,{x:0.58,y:0.81,w:12.13,h:0,line:{color:"38566D",transparency:25,width:0.6}});
  slide.addText(shrink(spec.kicker,120).toUpperCase(),{x:0.77,y:1.03,w:11.8,h:0.35,color:GOLD,fontSize:12,charSpacing:2,margin:0});
  slide.addText(shrink(spec.title,160),{x:0.75,y:1.6,w:11.73,h:1.22,color:CREAM,fontSize:33,bold:true,breakLine:false,margin:0.02,fit:"shrink"});
  let y=3.16;
  for(const bullet of spec.bullets.slice(0,5)){
   slide.addShape(pptx.ShapeType.ellipse,{x:0.79,y:y+0.15,w:0.11,h:0.11,line:{color:GOLD},fill:{color:GOLD}});
   const b=shrink(bullet,290);
   slide.addText(b,{x:1.1,y,w:11.25,h:0.63,fontSize:17,color:"DCE7EF",margin:0.01,breakLine:false,fit:"shrink"});
   y+=0.8;
  }
  const refs=spec.sourceIds.length?"Evidence leads: "+spec.sourceIds.join(", "):"No source-backed claim asserted by this slide";
  slide.addShape(pptx.ShapeType.line,{x:0.7,y:6.95,w:11.9,h:0,line:{color:"38566D",transparency:25,width:0.6}});
  slide.addText(shrink(refs,220),{x:0.72,y:7.04,w:11.15,h:0.22,color:"B8C8D5",fontSize:9,margin:0});
  slide.addText(String(i+1).padStart(2,"0")+" / "+String(pkg.slides.length).padStart(2,"0"),{x:11.75,y:7.04,w:0.75,h:0.22,color:GOLD,fontSize:9,margin:0,align:"right"});
  const speakerNotes="DIS draft — not independently verified.\n"+spec.notes+"\n"+refs+"\nResearch record references and their full URLs are in the accompanying Word report.\nNo investor interest, grant eligibility, or winning probability is guaranteed.";
  slide.addNotes(speakerNotes);
 }
 const output=await pptx.write({outputType:"nodebuffer"});
 return Buffer.from(output as Uint8Array);
}
const rich=(txt:string)=>new Paragraph({children:[new TextRun({text:txt,color:INK,size:21})],spacing:{after:130,line:280}});
export async function exportDocx(pkg:ConsultationPackage):Promise<Buffer>{
 normalizeExportSlides(pkg.slides,normalizeExportIntelligence(pkg.intelligence));
 const children:Paragraph[]=[
  new Paragraph({text:"DYNAMIC INTELLIGENCE",heading:HeadingLevel.TITLE,spacing:{after:150}}),
  new Paragraph({text:"CONSULTATION & IMPLEMENTATION PACKAGE",heading:HeadingLevel.HEADING_1,spacing:{after:180}}),
  rich("Prepared for: "+(pkg.intake.organization||"Unnamed project")),
  rich("Created: "+pkg.createdAt),
  new Paragraph({children:[new TextRun({text:"DRAFT — EVIDENCE GATES OPEN",bold:true,color:"9E5E27",size:23})],spacing:{after:180}}),
  rich("This working package includes unverified hypotheses and research leads. Source records are not equivalent to claim-level verification. Do not distribute externally without review and approval."),
 ];
 for(const d of pkg.documents){
  children.push(new Paragraph({text:d.title,heading:HeadingLevel.HEADING_1,spacing:{before:270,after:140}}));
  for(const line of d.body.split("\n"))children.push(rich(line||" "));
  children.push(new Paragraph({children:[new TextRun({text:"VALIDATION: "+d.validation+" — "+d.note,color:"956C34",italics:true,size:19})],spacing:{after:180}}));
 }
 children.push(new Paragraph({text:"Slide storyboard and speaker notes",heading:HeadingLevel.HEADING_1,spacing:{before:220}}));
 for(const slide of pkg.slides){
  children.push(new Paragraph({text:slide.id+" — "+slide.title,heading:HeadingLevel.HEADING_2,spacing:{before:190}}));
  for(const b of slide.bullets)children.push(new Paragraph({text:b,bullet:{level:0},spacing:{after:100}}));
  children.push(rich("Presenter notes: "+slide.notes));
  children.push(rich("Sources: "+(slide.sourceIds.join(", ")||"None")));
 }
 children.push(new Paragraph({text:"Acceptance and outstanding verification gates",heading:HeadingLevel.HEADING_1,spacing:{before:230}}));
 for(const g of pkg.quality.knownGaps)children.push(new Paragraph({text:g,bullet:{level:0},spacing:{after:95}}));
 const document=new Document({creator:"Dynamic Intelligence",title:"DIS Consultation Package — Draft",description:"Research, implementation and evidence-labeled draft artifacts",sections:[{properties:{},children}]});
 return Packer.toBuffer(document);
}
