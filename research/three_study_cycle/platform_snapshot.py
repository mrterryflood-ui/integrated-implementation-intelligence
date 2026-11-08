#!/usr/bin/env python3
"""Bounded aggregate projection for the existing research workbench/case record.
Retained originals and full analyses stay separate. No clinical or live-data claim.
"""
from __future__ import annotations
import argparse, hashlib, json
from pathlib import Path
from verify_retained import verify_originals, load_json, MANDATORY
import analyze
import review_followup
import reference_audit

def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def build(root:Path):
    root=Path(root)
    receipt=load_json(root/'acquisition_receipt.json')
    integrity=verify_originals(receipt,root)
    if set(integrity)!=MANDATORY or any(v['state']!='BYTE_INTEGRITY_CHECKED' for v in integrity.values()):
        raise ValueError('All ten retained originals require byte admission; no numerical substitute')
    _,sources,semantics=analyze.verify_inputs(root)
    result=load_json(root/'analysis/results.json')
    follow=load_json(root/'review-followup/review_followup.json')
    if result.get('source_revision')!=receipt.get('revision') or follow.get('source_revision')!=receipt.get('revision') or follow.get('source_receipt_sha256')!=sha(root/'acquisition_receipt.json'):
        raise ValueError('Analysis producer/source receipt mismatch')
    if result.get('status')!='DESCRIPTIVE_ANALYSES_COMPLETED_EXTERNAL_REVIEW_REQUIRED' or result.get('source_semantics')!=semantics:
        raise ValueError('Analysis status or source scope changed')
    # Recompute displayed fields from the retained bytes, rather than trust a
    # result with a plausible title or copy its unresolved narrative claims.
    county=analyze.county(root)
    state_frame=analyze.nci_frame(root)
    # A replay of an extracted CSV alone can faithfully repeat an extraction
    # error. Bind every displayed county cell and the 50-state input cells to
    # the independently parsed original HTML too.
    for key,state,label in [('hinds','28','Hinds County'),('harris','48','Harris County')]:
        for suffix,stage in [('all','999'),('late','211')]:
            period,raw=reference_audit.parse_nci(root,receipt,key+'_'+suffix,reference_audit.base_query(stage=stage,state=state,area='county'))
            x=raw.loc[label];e=county['counties'][label][suffix]
            if period!='2019-2023' or [x['rate'],x['ci_low'],x['ci_high'],x['count']]!=[e['rate_per_100k'],*e['ci95'],e['annual_count']] or (suffix=='late' and x['share']!=e['late_share_percent']):
                raise ValueError('County extraction differs from original HTML')
    for condition,cancer,sex in [('colorectal','020','0'),('lung','047','0'),('breast','055','2')]:
        period,raw=reference_audit.parse_nci(root,receipt,condition+'_states',reference_audit.base_query(cancer,sex))
        selected=state_frame.loc[state_frame.geography.isin(reference_audit.STATES)].set_index('geography')
        if period!='2019-2023' or len(selected)!=50 or set(selected.index)!=reference_audit.STATES:raise ValueError('Named state frame differs from original scope')
        for name in reference_audit.STATES:
            for field in ('rate','share','count'):
                if raw.loc[name,field]!=selected.loc[name,condition+'_'+field]:raise ValueError('State extraction differs from original HTML')
    national=analyze.national(state_frame)
    survey=analyze.survey(root)
    groups=review_followup.survey(root,receipt)
    # JSON artifacts represent Python age-band tuples as arrays; compare the
    # serialized representation without changing any numerical tolerance.
    groups=json.loads(json.dumps(groups,allow_nan=False))
    if county!=result['county_colorectal'] or national!=result['national_cancer'] or survey!=result['nsfg'] or groups!=follow['studies']['survey']:
        raise ValueError('Stored analysis differs from retained-source recomputation')
    corr=json.loads(json.dumps(review_followup.national(root,receipt),allow_nan=False))
    if corr!=follow['studies']['national']:
        raise ValueError('Stored uncertainty/sensitivity output differs from its retained-source replay')
    if corr.get('period')!='2019-2023' or len(corr.get('rows',[]))!=6:
        raise ValueError('Six same-period descriptive construct correlations required')
    for row in corr['rows']:
        pair='__'.join(row['pair'])
        # The two Pearson implementations can differ at the last binary digit;
        # each is checked against its own exact replay, not a widened tolerance.
        if row['measure'] not in ('rate','share') or pair not in national['cross_cancer'][row['measure']]:
            raise ValueError('Correlation estimand/point mismatch')
    rsha=sha(root/'acquisition_receipt.json')
    source_rows=[]
    for key in sorted(MANDATORY):
        s=next(x for x in receipt['sources'] if x['id']==key)
        source_rows.append({'id':key,'url':s['url'],'sha256':s['sha256'],'bytes':s['bytes'],'capturedAt':s['finished_at'],
                            'scope':semantics.get(key,{}).get('heading','NSFG 2022–2023 public survey/data documentation')})
    conditions=[]
    for code,label in [('ENDO','Endometriosis'),('PCOS','PCOS'),('UF','Uterine fibroids')]:
        e=survey['estimates'][code];g=groups['conditions'][code]
        conditions.append({'code':code,'label':label,'publishedPercent':e['published_percent'],'publishedSePp':e['published_se_pp'],
          'literalDomain':e['literal_age_domain'],'eligibilitySensitivity':e['eligible_age50_sensitivity'],
          'publicGroups':[{'code':x['code'],'label':x['label'],'crudePercent':x['crude_percent'],'validN':x['valid_n'],'itemMissingN':x['item_missing_n'],
             'standardizedGroupMinusOverall':{'estimatePp':x['group_minus_overall_pp'],'sePp':x['taylor_se_pp'],'unadjusted95CiPp':x['unadjusted_95_ci_pp'],
               'estimand':'EQUAL_BAND_STANDARDIZED_GROUP_MINUS_OVERALL','scale':'PERCENTAGE_POINTS','notUncertaintyForCrudePercent':True}}
             for x in g['rows']]})
    return {'schema':'dis-calibration-supplement-v1','id':'retained-public-cycle-'+rsha[:12],
      'state':'DESCRIPTIVE_RESEARCH_CALIBRATION','sourceCaptureCompletedAt':receipt['finished_at'],'analysisProducerRevision':receipt['revision'],
      'artifacts':{'acquisitionReceiptSha256':rsha,'analysisSha256':sha(root/'analysis/results.json'),'reviewFollowupSha256':sha(root/'review-followup/review_followup.json'),'projectionScriptSha256':sha(__file__)},
      'sources':source_rows,
      'county':{'period':'2019-2023','condition':'colorectal','scope':'County residence; both sexes; all races including Hispanic; all ages',
        'rows':[{'name':name,'fips':fips,'allSourceId':key+'_all','lateSourceId':key+'_late',**county['counties'][name]}
                for name,fips,key in [('Hinds County','28049','hinds'),('Harris County','48201','harris')]],
        'contrasts':county['contrasts'],'stageShareDefinition':'Provider-defined diagnosed-case percentage; unknown-stage denominator handling unresolved',
        'meaning':'Geographic burden contrasts, not an intervention effect, preventable-case count, individual risk or funding rule',
        'nextTest':'Age/risk/stage and time-aligned prevention, recognition, referral, capacity and experienced-barrier evidence to distinguish interacting mechanisms'},
      'national':{'period':'2019-2023','states':50,'excludedAggregates':['United States','District of Columbia','Puerto Rico'],
        'scope':'CRC and lung: both sexes; breast: female; all ages; all races including Hispanic',
        'correlations':[{'construct':x['measure'],'pair':x['pair'],'pearson':x['pearson'],'conditionalIidFisher95':x['conditional_iid_fisher_95'],
          'conditionalExchangeablePermutationP':x['conditional_exchangeable_permutation_p']} for x in corr['rows']],
        'uncertaintyLimit':corr['rows'][0]['interpretation'],
        'permutationProtocol':{'iterations':corr['rows'][0]['permutations'],'seed':corr['rows'][0]['seed']},
        'nextTest':'Specify the decision/estimand and spatial dependence before interpreting or transferring geographic associations'},
      'survey':{'period':'2022-2023','population':'National female public-use survey; reported ever diagnosis, not biological prevalence or diagnostic delay',
        'literalInterview20to49N':survey['literal_20_49_n'],'eligibilityAge50SensitivityN':survey['eligible_age50_sensitivity_n'],
        'domainNote':'Literal interview ages and the sensitivity including one age-50 record remain separate; item-specific valid denominators differ',
        'publicCsvSha256':survey['source_csv_sha256'],'archiveSourceId':'nsfg_female',
        'conditions':conditions,'standardization':{'bands':[[20,29],[30,39],[40,50]],'weights':[1/3,1/3,1/3],
          'interpretation':'Fixed equal age-band sensitivity in the eligibility domain including the age-50 boundary record, not standard-US population prevalence; full-sample PSU Taylor covariance'},
        'nextTest':'Qualify condition-specific symptom/care-history instruments and clinical ascertainment to separate occurrence, recognition, access, recall and selection'},
      'authority':{'causalEffectEstablished':False,'clinicalActionAuthorized':False,'fieldBenefitMeasured':False,'actualAssignmentsAccepted':False},
      'missing':{'localDiagnosticResolution':None,'interventionEffect':None,'incrementalPlatformBenefit':None},
      'lineageRule':'Repeated displays and files from one source are not independent corroboration; source integrity is separate from scientific validity'}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--input',type=Path,required=True);ap.add_argument('--output',type=Path,required=True);ap.add_argument('--check',action='store_true');a=ap.parse_args()
    if a.output.resolve().is_relative_to(a.input.resolve()) and a.output.resolve()!=a.input.resolve()/'platform-calibration-supplement.json':
        raise ValueError('Preserve inputs; only the named derived projection can be added inside the retained cycle')
    data=build(a.input);text=json.dumps(data,indent=2,allow_nan=False,ensure_ascii=False)+'\n'
    packet_bytes=len(json.dumps(data,separators=(',',':'),ensure_ascii=False,allow_nan=False).encode())
    if packet_bytes>20000:raise ValueError('Aggregate supplement exceeds the bounded case-record budget')
    if a.check:
        if a.output.read_text()!=text:raise ValueError('Committed supplement differs from original-source projection')
    else:a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(text)
    print(json.dumps({'state':'PROJECTION_MATCH' if a.check else 'PROJECTED','id':data['id'],'sourceFileBytes':len(text.encode()),'casePacketBytes':packet_bytes,'sha256':sha(a.output)}))
if __name__=='__main__':main()
