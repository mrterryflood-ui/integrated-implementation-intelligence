#!/usr/bin/env python3
"""Classify source acquisition independently from workflow execution.
No unsupported success, statistical reproduction or scientific validation claims.
"""
from __future__ import annotations
import json,sys
from pathlib import Path
MANDATORY={'nsfg_female','nsfg_codebook','nsfg_published','colorectal_states','lung_states','breast_states','hinds_all','hinds_late','harris_all','harris_late'}
def assess(receipt,nsfg):
    sources=receipt.get('sources',[])
    ids=[x.get('id') for x in sources]
    if len(ids)!=len(set(ids)):raise ValueError('Duplicate source IDs')
    by={x['id']:x for x in sources}
    missing=sorted(MANDATORY-set(by))
    failed=sorted(x for x in MANDATORY if x in by and by[x].get('status')!='ORIGINAL_BYTES_RETAINED')
    incomplete=bool(missing or failed)
    analysis=nsfg.get('publication_gate','NOT_REPRODUCED')
    return {'schema':'dis-research-evidence-readiness-v1','workflow_execution':'SEPARATE_FROM_EVIDENCE_READINESS','source_coverage':'INCOMPLETE' if incomplete else 'ALL_REQUESTED_ORIGINALS_RETAINED','required_sources':len(MANDATORY),'retained_required_sources':len(MANDATORY)-len(missing)-len(failed),'missing_source_ids':missing,'failed_source_ids':failed,'nsfg_reproduction':'REVIEW_REQUIRED' if analysis!='SOURCE_REPRODUCED_POINT_ESTIMATES_ONLY' else 'POINT_ESTIMATES_MATCH_PUBLICATION_ROUNDING_NOT_INDEPENDENTLY_ADJUDICATED','nci_original_source_reconciliation':'OPEN','national_three_cancer_correlation_reproduction':'OPEN','mechanism_identification':'NOT_ESTABLISHED','implementation_benefit':'NOT_MEASURED','decision':'CONTINUE_SOURCE_RECONCILIATION_NO_PUBLIC_CAUSAL_CLAIMS'}
def main():
    p=Path(sys.argv[1] if len(sys.argv)>1 else 'research-results')
    receipt=json.loads((p/'acquisition_receipt.json').read_text())
    f=p/'nsfg_reproduction.json';nsfg=json.loads(f.read_text()) if f.exists() else {}
    out=assess(receipt,nsfg);(p/'readiness.json').write_text(json.dumps(out,indent=2)+'\n')
    print(json.dumps(out))
if __name__=='__main__':main()
