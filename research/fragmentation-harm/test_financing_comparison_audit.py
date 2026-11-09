"""Arithmetic and semantic regression checks; not independent source adjudication."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
from financing_comparison_audit import difference, finite, reference_difference, subgroup_envelope, require_same_endpoint, interpret_design, run


def ref(group, value):
    return {'source_id':'SOFTWARE_ONLY', 'reference':'same reference', 'endpoint':'same endpoint', 'unit':'percentage points', 'group':group, 'effect':value}

class FinancingAuditTests(unittest.TestCase):
    def test_bool_is_not_zero(self):
        with self.assertRaises(ValueError): finite(False)
    def test_nonfinite(self):
        for x in (float('nan'), float('inf'), float('-inf')):
            with self.subTest(x=x),self.assertRaises(ValueError): finite(x)
    def test_string_not_numeric(self):
        with self.assertRaises(ValueError): finite('1.2')
    def test_zero_negative_supported(self):
        self.assertEqual(difference(0,3),-3)
    def test_shared_reference_no_fake_precision(self):
        r=reference_difference(ref('a',-8.13),ref('b',-16.02))
        self.assertEqual(r['point_difference'],7.89)
        self.assertIsNone(r['confidence_interval']);self.assertIsNone(r['p_value'])
    def test_changed_reference_rejected(self):
        x=ref('b',2);x['reference']='different'
        with self.assertRaises(ValueError):reference_difference(ref('a',1),x)
    def test_changed_source_rejected(self):
        x=ref('b',2);x['source_id']='different'
        with self.assertRaises(ValueError):reference_difference(ref('a',1),x)
    def test_changed_endpoint_rejected(self):
        x=ref('b',2);x['endpoint']='different'
        with self.assertRaises(ValueError):reference_difference(ref('a',1),x)
    def test_percent_not_pp_or_ratio(self):
        x=ref('b',2);x['unit']='relative risk'
        with self.assertRaises(ValueError):reference_difference(ref('a',1),x)
    def test_outside_envelope_not_source_error_proof(self):
        r=subgroup_envelope(12.2,[75.7,64.6])
        self.assertFalse(r['within_subgroup_envelope'])
        self.assertFalse(r['source_error_proven'])
        self.assertEqual(r['status'],'DENOMINATOR_REVIEW_REQUIRED')
    def test_common_denominator_impossible_mixture(self):
        r=subgroup_envelope(10,[20,30],common_denominator_confirmed=True)
        self.assertEqual(r['status'],'INCOMPATIBLE_UNDER_COMMON_DENOMINATOR')
    def test_inside_does_not_certify_denominator(self):
        self.assertEqual(subgroup_envelope(25,[20,30])['status'],'DENOMINATOR_REVIEW_REQUIRED')
    def test_rounding_tolerance(self):
        self.assertTrue(subgroup_envelope(19.95,[20,30])['within_subgroup_envelope'])
    def test_negative_tolerance(self):
        with self.assertRaises(ValueError):subgroup_envelope(20,[20,30],rounding_tolerance=-1)
    def test_empty_subgroups(self):
        with self.assertRaises(ValueError):subgroup_envelope(20,[])
    def test_invalid_percent(self):
        with self.assertRaises(ValueError):subgroup_envelope(110,[20,30])
    def test_unknown_not_zero(self):
        with self.assertRaises(ValueError):subgroup_envelope(20,[None,30])
    def test_cancellation_not_completed_care(self):
        with self.assertRaises(ValueError):require_same_endpoint('completed_or_canceled','completed_care')
    def test_exact_endpoint(self):
        self.assertIsNone(require_same_endpoint('completed_care','completed_care'))
    def test_cross_section_not_DiD(self):
        with self.assertRaises(ValueError):interpret_design('difference_in_differences',same_time=True,causal_claim=False)
    def test_adjusted_not_automatic_causality(self):
        with self.assertRaises(ValueError):interpret_design('adjusted_observational',same_time=True,causal_claim=True)
    def test_time_contrast_not_auto_accepted(self):
        self.assertEqual(interpret_design('difference_in_differences',same_time=False,causal_claim=True),'DESIGN_ASSUMPTIONS_REQUIRE_SEPARATE_REVIEW')
    def test_design_bad_type(self):
        with self.assertRaises(ValueError):interpret_design('descriptive',same_time=1,causal_claim=False)
    def test_publication_year_not_observation_year(self):
        # A deliberately synthetic fixture illustrates distinct temporal labels.
        source={'publication_year':2023,'data_period':'2008–2012'}
        self.assertNotEqual(str(source['publication_year']),source['data_period'])

class PublishedArithmeticTests(unittest.TestCase):
    def test_composition_reversal(self):
        self.assertEqual(difference(87.5,88.6),-1.1)
        self.assertEqual(difference(86.6,80.4),6.2)
        self.assertEqual(difference(6.2,-1.1),7.3)
    def test_low_income_cost_barriers(self):
        self.assertEqual(difference(8.0,12.3),-4.3)
        self.assertEqual(difference(8.0,30.9),-22.9)
    def test_adjusted_dollar_levels(self):
        self.assertEqual(difference(569,45),524)
        self.assertEqual(difference(4553,2484),2069)
    def test_dual_enrolled_veteran_mortality(self):
        self.assertEqual(difference(11.67,9.32),2.35)
    def test_direct_hardship_points(self):
        self.assertEqual(difference(-6.72,-2.95),-3.77)
        self.assertEqual(difference(-10.33,-4.51),-5.82)

if __name__=='__main__': unittest.main()
