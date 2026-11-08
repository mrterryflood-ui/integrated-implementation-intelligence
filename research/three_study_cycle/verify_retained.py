#!/usr/bin/env python3
"""Bounded retained-file admission. Not source authentication or scientific review.
This consumes an acquired research-results directory and emits a separate receipt;
it never modifies originals, estimates, or the existing analysis readiness record.
"""
from __future__ import annotations
import argparse, hashlib, json, os, re
from pathlib import Path, PurePosixPath
from typing import Any
KINDS={'nsfg_female':'zip','nsfg_codebook':'pdf','nsfg_published':'html','colorectal_states':'html','lung_states':'html','breast_states':'html','hinds_all':'html','hinds_late':'html','harris_all':'html','harris_late':'html'}
MANDATORY=frozenset(KINDS)
MAX_ORIGINAL_BYTES=32*1024*1024
SHA256=re.compile(r'^[a-f0-9]{64}$')
GIT_SHA=re.compile(r'^[a-f0-9]{40}$')

def _rows(receipt:Any)->list[dict[str,Any]]:
    if not isinstance(receipt,dict) or not isinstance(receipt.get('sources'),list):
        raise ValueError('Acquisition receipt must contain a sources array')
    rows=receipt['sources']
    if len(rows)>50 or any(not isinstance(r,dict) for r in rows):raise ValueError('Invalid or unbounded source records')
    ids=[r.get('id') for r in rows]
    if any(not isinstance(i,str) or not i.strip() for i in ids):raise ValueError('Source identity missing')
    if len(ids)!=len(set(ids)):raise ValueError('Duplicate source IDs')
    return rows

def _local_original(root:Path,raw_path:Any)->Path:
    if not isinstance(raw_path,str) or '\\' in raw_path:raise ValueError('Original path must be a relative POSIX path')
    relative=PurePosixPath(raw_path)
    if relative.is_absolute() or '..' in relative.parts or len(relative.parts)<2 or relative.parts[0]!='originals':raise ValueError('Original path is outside the declared originals directory')
    current=root
    for part in relative.parts:
        current=current/part
        if current.is_symlink():raise ValueError('Symlinked evidence is not admitted')
    if not current.is_file() or not current.resolve().is_relative_to(root.resolve()):raise ValueError('Original file is missing or outside the evidence bundle')
    return current

def verify_originals(receipt:dict[str,Any],root:Path)->dict[str,Any]:
    rows=_rows(receipt);results={};paths={}
    for row in rows:
        if row['id'] in MANDATORY and row.get('status')=='ORIGINAL_BYTES_RETAINED':paths.setdefault(str(row.get('path')),[]).append(row['id'])
    for row in rows:
        source=row['id']
        if source not in MANDATORY or row.get('status')!='ORIGINAL_BYTES_RETAINED':continue
        failures=[]
        try:
            if len(paths.get(str(row.get('path')),[]))>1:raise ValueError('Multiple source identities claim the same stored file')
            p=_local_original(root,row.get('path'));size=p.stat().st_size
            if type(row.get('bytes')) is not int or size!=row['bytes'] or not 0<size<=MAX_ORIGINAL_BYTES:raise ValueError('Declared byte count is invalid, different or over capacity')
            h=row.get('sha256')
            if not isinstance(h,str) or not SHA256.fullmatch(h):raise ValueError('Declared SHA-256 missing or invalid')
            data=p.read_bytes()
            if hashlib.sha256(data).hexdigest()!=h:raise ValueError('Original file does not match its declared SHA-256')
            kind=KINDS[source]
            signature_ok=((kind=='zip' and data.startswith(b'PK')) or (kind=='pdf' and data.startswith(b'%PDF')) or (kind=='html' and b'<html' in data[:65536].lower()))
            if not signature_ok:raise ValueError('Stored content does not have the expected source-file format')
        except (ValueError,OSError) as exc:failures.append(str(exc))
        results[source]={'state':'BYTE_INTEGRITY_CHECKED' if not failures else 'NOT_ADMITTED','failures':failures,'source_authenticity_established':False,'measurement_validity_established':False}
    return results

def assess(receipt:dict[str,Any],nsfg:dict[str,Any],root:Path|None=None,expected_revision:str|None=None)->dict[str,Any]:
    rows=_rows(receipt)
    if not isinstance(nsfg,dict):raise ValueError('NSFG result must be an object')
    by={r['id']:r for r in rows};missing=sorted(MANDATORY-set(by));failed=sorted(i for i in MANDATORY if i in by and by[i].get('status')!='ORIGINAL_BYTES_RETAINED')
    declared=len(MANDATORY)-len(missing)-len(failed)
    integrity=verify_originals(receipt,root) if root is not None else {}
    admitted={i for i,r in integrity.items() if r['state']=='BYTE_INTEGRITY_CHECKED'}
    rejected=sorted(i for i,r in integrity.items() if r['state']!='BYTE_INTEGRITY_CHECKED')
    coverage=('INCOMPLETE' if missing or failed else 'RETENTION_LABELS_UNVERIFIED' if root is None else 'INTEGRITY_FAILURE' if rejected else 'REQUESTED_ORIGINAL_BYTES_INTEGRITY_CHECKED')
    numeric_match=(nsfg.get('publication_gate')=='SOURCE_REPRODUCED_POINT_ESTIMATES_ONLY' and isinstance(nsfg.get('published_rounding_checks'),dict) and set(nsfg['published_rounding_checks'])=={'ENDO','PCOS','UF'} and all(v is True for v in nsfg['published_rounding_checks'].values()) and type(nsfg.get('age_domain_n')) is int and nsfg['age_domain_n']==4856)
    nsfg_sources={'nsfg_female','nsfg_codebook','nsfg_published'};nsfg_status='REVIEW_REQUIRED'
    if numeric_match:nsfg_status='POINT_ESTIMATE_CONSISTENCY_ONLY_NOT_INDEPENDENTLY_ADJUDICATED' if nsfg_sources<=admitted else 'NUMERIC_MATCH_SOURCE_ADMISSION_REQUIRED'
    elif type(nsfg.get('age_domain_n')) is int and nsfg['age_domain_n']!=4856:nsfg_status='ANALYTIC_DOMAIN_DISCREPANCY_REVIEW_REQUIRED'
    recorded_revision=receipt.get('revision');revision_status='EXPECTED_REVISION_NOT_SUPPLIED'
    if expected_revision is not None:
        if not isinstance(expected_revision,str) or not GIT_SHA.fullmatch(expected_revision):raise ValueError('Expected code revision must be a full Git SHA')
        revision_status='MATCHES_DECLARED_EXPECTATION' if recorded_revision==expected_revision else 'REVISION_MISMATCH_REVIEW_REQUIRED'
    def source_gate(ids:set[str])->str:return 'SOURCE_BYTES_AVAILABLE_METHOD_REVIEW_OPEN' if ids<=admitted else 'SOURCE_ADMISSION_INCOMPLETE'
    return {'schema':'dis-research-evidence-readiness-v2','workflow_execution':'SEPARATE_FROM_EVIDENCE_READINESS','source_coverage':coverage,'required_sources':len(MANDATORY),'retained_required_sources':declared,'retained_count_meaning':'Receipt declarations; see byte_checked_required_sources','byte_checked_required_sources':len(admitted),'missing_source_ids':missing,'failed_source_ids':failed,'integrity_rejected_source_ids':rejected,'original_integrity':integrity,'original_integrity_checked':root is not None,'revision_binding':{'state':revision_status,'recorded':recorded_revision,'expected':expected_revision,'independently_executed_code_identity_established':False},'study_source_gates':{'county_colorectal':source_gate({'hinds_all','hinds_late','harris_all','harris_late'}),'national_three_cancer':source_gate({'colorectal_states','lung_states','breast_states'}),'gynecologic_diagnosis':source_gate(nsfg_sources)},'nsfg_reproduction':nsfg_status,'nci_original_source_reconciliation':'OPEN','national_three_cancer_correlation_reproduction':'OPEN','mechanism_identification':'NOT_ESTABLISHED','implementation_benefit':'NOT_MEASURED','scientific_release_authorized':False,'decision':'CONTINUE_SOURCE_RECONCILIATION_NO_PUBLIC_CAUSAL_CLAIMS'}

def load_json(path:Path)->dict[str,Any]:
    if path.stat().st_size>2*1024*1024:raise ValueError('Unbounded metadata file')
    def unique_keys(pairs):
        result={}
        for key,value in pairs:
            if key in result:raise ValueError('Duplicate JSON key')
            result[key]=value
        return result
    value=json.loads(path.read_text(),object_pairs_hook=unique_keys)
    if not isinstance(value,dict):raise ValueError('Metadata must be a JSON object')
    return value

def main()->int:
    ap=argparse.ArgumentParser();ap.add_argument('directory',nargs='?',default='research-results');ap.add_argument('--expected-revision',default=os.getenv('DIS_EVIDENCE_EXPECTED_SHA'));args=ap.parse_args();root=Path(args.directory);root.mkdir(parents=True,exist_ok=True)
    try:
        receipt=load_json(root/'acquisition_receipt.json');result_path=root/'nsfg_reproduction.json';result=load_json(result_path) if result_path.exists() else {};out=assess(receipt,result,root=root,expected_revision=args.expected_revision);exit_code=0
    except (OSError,ValueError) as exc:
        out={'schema':'dis-research-evidence-readiness-v2','source_coverage':'NOT_ASSESSABLE','error':str(exc),'scientific_release_authorized':False,'decision':'REPAIR_EVIDENCE_RECEIPT_BEFORE_ANALYSIS'};exit_code=2
    # Separate output: preserve prior readiness and all original evidence unchanged.
    (root/'verified_readiness.json').write_text(json.dumps(out,indent=2,allow_nan=False)+'\n');print(json.dumps(out,allow_nan=False));return exit_code
if __name__=='__main__':raise SystemExit(main())
