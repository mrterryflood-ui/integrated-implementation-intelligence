import copy, json, math, os, tempfile, unittest
from pathlib import Path
from decimal import Decimal as D
from expanded_county_test import load_counties, summarize, pairs_for, rate
from intelligence_contract import validate_connection, validate_evidence_event, compare_measurement_constructs

ARCHIVE=Path(os.environ.get('CHAINWEB_ARCHIVE', str(Path(__file__).parent / 'github-actions-artifact-13589404488.zip')))

def connection():
    return dict(edge_type='validated_causal_effect',source_id='published-source',evidence_grade='verified',
                disconfirmation_test='registered rival',identification_design='randomized comparison',
                population='defined trial population',time_window='published follow-up',effect_estimate=0.0,
                effect_measure='risk_difference',uncertainty={'lower':-0.1,'upper':0.1},
                independent_review={'status':'approved','reviewer_id':'synthetic-test-reviewer',
                                    'artifact_ref':'synthetic://test-only'},result='null')

def event():
    return dict(event_id='software-test',source_id='source',source_version='v1',source_extract_sha256='a'*64,
                construct_id='rate',denominator_definition='population person-years',
                event_time='2023-12-31T00:00:00Z',available_to_decision_time='2024-12-12T00:00:00Z',
                decision_time='2025-01-01T00:00:00Z',evidence_grade='supported')

class ClaimGateTests(unittest.TestCase):
    def test_zero_effect_is_not_missing(self): self.assertTrue(validate_connection(connection()))
    def test_negative_effect_allowed(self):
        e=connection();e['effect_estimate']=-0.05; self.assertTrue(validate_connection(e))
    def test_nonfinite_effect(self):
        for v in [float('nan'),float('inf'),True,'0']:
            with self.subTest(value=v):
                e=connection();e['effect_estimate']=v
                with self.assertRaises(ValueError): validate_connection(e)
    def test_grade_cannot_be_invented(self):
        e=connection();e['evidence_grade']='proven-forever'
        with self.assertRaises(ValueError): validate_connection(e)
    def test_hypothesis_cannot_be_promoted(self):
        e=connection();e['evidence_grade']='hypothesis'
        with self.assertRaises(ValueError): validate_connection(e)
    def test_string_review_is_insufficient(self):
        e=connection();e['independent_review']='not reviewed'
        with self.assertRaises(ValueError): validate_connection(e)
    def test_nonapproved_review(self):
        e=connection();e['independent_review']['status']='pending'
        with self.assertRaises(ValueError): validate_connection(e)
    def test_interval_reversed(self):
        e=connection();e['uncertainty']={'lower':.1,'upper':-.1}
        with self.assertRaises(ValueError): validate_connection(e)
    def test_result_cannot_be_suppressed(self):
        e=connection();del e['result']
        with self.assertRaises(ValueError): validate_connection(e)
    def test_negative_evidence_retained(self):
        e=connection();e['result']='contradicted';self.assertTrue(validate_connection(e))
    def test_temporal_valid(self): self.assertTrue(validate_evidence_event(event()))
    def test_future_publication_excluded(self):
        e=event();e['decision_time']='2023-12-31T00:00:00Z'
        with self.assertRaisesRegex(ValueError,'future-information'): validate_evidence_event(e)
    def test_nontyped_and_naive_rejected(self):
        for v in [[],None,0]:
            with self.assertRaises(ValueError): validate_evidence_event(v)
        e=event();e['event_time']='2023-12-31'
        with self.assertRaisesRegex(ValueError,'timezone'): validate_evidence_event(e)
    def test_blank_provenance_rejected(self):
        e=event();e['source_id']=' '
        with self.assertRaises(ValueError): validate_evidence_event(e)

class ConstructTests(unittest.TestCase):
    def setUp(self):
        self.a=dict(cancer_sites=['colon','rectum'],stage_components=['regional','distant'],measure='incidence_rate',
                    denominator_unit='per_100000_person_years',age_standard='US2000_19groups',
                    sex_scope='all',age_scope='all',observation_period='2019-2023',reporting_delay_adjustment='none')
    def test_same_label_different_stage_is_not_poolable(self):
        b=copy.deepcopy(self.a);b['stage_components']=['distant']
        r=compare_measurement_constructs(self.a,b)
        self.assertEqual(r['status'],'COMPLEMENTARY_NOT_POOLABLE');self.assertIn('stage_components',r['fields'])
        self.assertTrue(r['contextual_use_allowed'])
    def test_alignment_is_not_causality(self):
        r=compare_measurement_constructs(self.a,self.a);self.assertEqual(r['status'],'RECORDED_FIELDS_ALIGNED_ONLY')
        self.assertFalse(r['causality_or_transportability_established'])
    def test_period_delay_and_age_standard(self):
        for key in ['observation_period','reporting_delay_adjustment','age_standard']:
            b=copy.deepcopy(self.a);b[key]='different';self.assertIn(key,compare_measurement_constructs(self.a,b)['fields'])
    def test_unknown_not_same(self):
        b=copy.deepcopy(self.a);del b['stage_components']
        self.assertEqual(compare_measurement_constructs(self.a,b)['status'],'INSUFFICIENT_METADATA')

class CountyLogicTests(unittest.TestCase):
    def test_suppression_is_not_zero(self): self.assertIsNone(rate('*'))
    def test_interval_invalid(self):
        with self.assertRaises(ValueError): rate('20 (30, 40)')
    def test_changed_archive_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'changed.zip';p.write_bytes(b'not the source')
            with self.assertRaisesRegex(ValueError,'hash'): load_counties(p)

@unittest.skipUnless(ARCHIVE.exists(),'Original archive must be supplied for the scientific integration tests')
class RealArchiveTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls): cls.rows,cls.provenance=load_counties(ARCHIVE)
    def test_all_counties_and_rows(self):
        self.assertEqual(len(self.rows),336);self.assertEqual(self.provenance['original_county_rows_compared_with_csv'],672)
    def test_all_source_cells_agree(self): self.assertEqual(self.provenance['original_cells_compared_with_csv'],4368)
    def test_coverage(self):
        self.assertEqual(sum(r['late_rate'] is not None for r in self.rows),254)
    def test_suppression_geography(self):
        rr=summarize(self.rows)['by_geography']
        self.assertEqual(rr['Rural'],{'total':230,'complete':160,'incomplete':70})
    def test_within_state_not_pooled(self):
        ms=summarize([r for r in self.rows if r['state']=='MS']);tx=summarize([r for r in self.rows if r['state']=='TX'])
        self.assertEqual(ms['share_window_tests']['0.5']['late_rate_gap_at_least_5_pairs'],65)
        self.assertEqual(tx['share_window_tests']['0.5']['late_rate_gap_at_least_5_pairs'],377)
    def test_larger_count_pressure_test(self):
        tx=summarize([r for r in self.rows if r['state']=='TX'])
        self.assertEqual(tx['share_window_tests']['0.5']['also_both_counts_ge16_and_disjoint_intervals'],33)
    def test_sensitivity_monotonicity(self):
        for state in ['MS','TX']:
            s=summarize([r for r in self.rows if r['state']==state])['share_window_tests']
            self.assertLessEqual(s['0.3']['near_share_pairs'],s['0.5']['near_share_pairs'])
            self.assertLessEqual(s['0.5']['near_share_pairs'],s['1.0']['near_share_pairs'])
    def test_original_two_county_calibration(self):
        h=next(r for r in self.rows if r['state']=='MS' and r['county']=='Hinds County')
        t=next(r for r in self.rows if r['state']=='TX' and r['county']=='Harris County')
        self.assertEqual(h['late_rate']-t['late_rate'],D('6.0'))
        self.assertEqual(h['share']-t['share'],D('0.3'))

if __name__=='__main__': unittest.main()
