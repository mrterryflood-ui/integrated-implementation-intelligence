const fs=require('node:fs');
const {emptyResearchWorkflow,buildResearchWorkflowCase,WORKFLOW_FIELDS}=require('../dis-integration/apps/dis-platform/lib/research-workflow.ts');
const {PGlite}=require('../dis-integration/apps/dis-platform/node_modules/@electric-sql/pglite');
(async()=>{
 const workflow=emptyResearchWorkflow();workflow.publicAggregateConfirmed=true;
 for(const [key] of WORKFLOW_FIELDS)workflow.narrative[key]='x'.repeat(2400);
 workflow.studyText='x'.repeat(25000);workflow.counterfactualText='x'.repeat(3941);
 const report=buildResearchWorkflowCase(workflow).report,compact=JSON.stringify(report);
 const db=new PGlite();await db.waitReady;
 const row=(await db.query('SELECT char_length($1::jsonb::text) AS stored_chars,octet_length($1::jsonb::text) AS stored_bytes',[compact])).rows[0];
 const receipt={base:'06f21b4ef5fa3007c22acfaee453f8ee0ef0d452',reviewedHead:'039761a706534e8d21ffdbe71c616646ee9ef539',workflowChars:JSON.stringify(workflow).length,compactReportChars:compact.length,...row,originalRevisionReadWouldAccept:row.stored_chars<=128000,description:'Valid typed create report reaches the admitted compact boundary but JSONB formatting exceeds the new revision read bound.'};
 fs.writeFileSync(__dirname+'/near-limit-workflow.json',JSON.stringify(workflow));
 fs.writeFileSync(__dirname+'/near-limit-report.json',compact);
 fs.writeFileSync(__dirname+'/capacity-finding.json',JSON.stringify(receipt,null,2)+'\n');
 console.log(JSON.stringify(receipt));
 await db.close();
})().catch(e=>{console.error(e);process.exitCode=1;});

