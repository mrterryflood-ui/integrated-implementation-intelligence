#!/usr/bin/env python3
"""Classify source acquisition, analysis execution and scientific readiness separately."""
from __future__ import annotations
import json,sys
from pathlib import Path
MANDATORY={'nsfg_female','nsfg_codebook','nsfg_published','colorectal_states','lung_states','breast_states','hinds_all','hinds_late','harris_all','harris_late'}
def assess(receipt,nsfg):
    sources=receipt.get('sources',[]);ids=[x.get('id') for x in sources]
    if len(ids)!=len(set(ids)):raise ValueError('Duplicate source IDs')
    by={x['id']:x for x in sources};missing=sorted(MANDATORY-set(by));failed=sorted(x for x in MANDATORY if x in by and by[x].get('status')!='ORIGINAL_BYTES_RETAINED');incomplete=bool(missing or failed)
    analysis=nsfg.get('publication_gate','NOT_REPRODUCED')
    return {'schema':'dis-research-evidence-readiness-v1','workflow_execution':'SEPARATE_FROM_EVIDENCE_READINESS','source_coverage':'INCOMPLETE' if incomplete else 'ALL_REQUESTED_ORIGINALS_RETAINED','required_sources':len(MANDATORY),'retained_required_sources':len(MANDATORY)-len(missing)-len(failed),'missing_source_ids':missing,'failed_source_ids':failed,'nsfg_reproduction':'REVIEW_REQUIRED' if analysis!='SOURCE_REPRODUCED_POINT_ESTIMATES_ONLY' else 'POINT_ESTIMATES_MATCH_PUBLICATION_ROUNDING_NOT_INDEPENDENTLY_ADJUDICATED','nci_original_source_reconciliation':'OPEN','national_three_cancer_correlation_reproduction':'OPEN','mechanism_identification':'NOT_ESTABLISHED','implementation_benefit':'NOT_MEASURED','decision':'CONTINUE_SOURCE_RECONCILIATION_NO_PUBLIC_CAUSAL_CLAIMS'}
def main():
    p=Path(sys.argv[1] if len(sys.argv)>1 else 'research-results');receipt=json.loads((p/'acquisition_receipt.json').read_text());f=p/'nsfg_reproduction.json';nsfg=json.loads(f.read_text()) if f.exists() else {};out=assess(receipt,nsfg)
    f=p/'analysis/results.json';r=json.loads(f.read_text()) if f.exists() else {}
    executed=r.get('status')=='DESCRIPTIVE_ANALYSES_COMPLETED_EXTERNAL_REVIEW_REQUIRED'
    out['three_study_analysis']='EXECUTED_DESCRIPTIVE_ONLY' if executed else 'NOT_COMPLETED'
    if executed:
        out['nci_original_source_reconciliation']='CURRENT_ORIGINAL_SCOPE_AND_VERSION_VALIDATED_EXTERNAL_ADJUDICATION_PENDING'
        out['national_three_cancer_correlation_reproduction']='CALCULATED_FROM_50_STATE_ORIGINAL_TABLES_NOT_CAUSAL'
        out['nsfg_point_and_se_rounding_checks']={k:{'point':v['point_matches_published_rounding'],'standard_error':v['se_matches_published_rounding']} for k,v in r['nsfg']['estimates'].items()}
        out['nsfg_age_domain_count']={'literal_age_20_49':r['nsfg']['literal_20_49_n'],'published':r['nsfg']['published_n'],'including_screener_eligible_age50':r['nsfg']['eligible_age50_sensitivity_n'],'interpretation':'Boundary sensitivity documented; original publication author code not independently obtained.'}
        a=p/'analysis/results.json';b=p/'replay/results.json';out['exact_snapshot_replay']='BYTE_IDENTICAL' if b.exists() and a.read_bytes()==b.read_bytes() else 'NOT_VERIFIED'
    out['public_release_authorized']=False;out['production_operation_verified']=False
    (p/'readiness.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out))
if __name__=='__main__':main()
