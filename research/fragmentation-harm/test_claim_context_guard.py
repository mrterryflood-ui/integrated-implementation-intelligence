"""Portable software-only checks. No reserved case, patient or reviewer content."""
import copy
import unittest
from claim_context_guard import require_bound_context

FIXTURE = {
    'id': 'SOFTWARE_ONLY', 'source': 'synthetic://unit-test',
    'population': 'test population', 'endpoint': 'test completion',
    'comparator': 'test usual process', 'intervention': 'test process',
    'design': 'synthetic design', 'analysis': 'synthetic analysis',
    'measurement_stage': 'test action', 'observed_effect_kind': 'test estimate',
    'effect': 0.0, 'interval': [-1.0, 1.0], 'clinical_benefit_observed': False,
}

class ContextBindingTests(unittest.TestCase):
    def test_exact_context_allowed(self):
        self.assertIsNone(require_bound_context(copy.deepcopy(FIXTURE), FIXTURE))
    def test_dictionary_order_is_not_semantic(self):
        self.assertIsNone(require_bound_context(dict(reversed(list(FIXTURE.items()))), FIXTURE))
    def test_extra_claim_rejected(self):
        changed=copy.deepcopy(FIXTURE);changed['prevented_deaths']=10
        with self.assertRaisesRegex(ValueError,'UNBOUND_SOURCE_CONTEXT'):
            require_bound_context(changed,FIXTURE)
    def test_missing_field_rejected(self):
        changed=copy.deepcopy(FIXTURE);del changed['population']
        with self.assertRaises(ValueError):require_bound_context(changed,FIXTURE)
    def test_bool_not_numeric_zero(self):
        changed=copy.deepcopy(FIXTURE);changed['effect']=False
        with self.assertRaises(ValueError):require_bound_context(changed,FIXTURE)
    def test_nonfinite_rejected(self):
        changed=copy.deepcopy(FIXTURE);changed['effect']=float('nan')
        with self.assertRaisesRegex(ValueError,'finite JSON'):require_bound_context(changed,FIXTURE)
    def test_non_mapping_rejected(self):
        with self.assertRaises(ValueError):require_bound_context([],FIXTURE)
    def test_missing_trusted_id_rejected(self):
        with self.assertRaises(ValueError):require_bound_context({}, {})

for field in ('source','population','endpoint','comparator','intervention','design','analysis',
              'measurement_stage','observed_effect_kind','interval','clinical_benefit_observed'):
    def check(self, field=field):
        changed=copy.deepcopy(FIXTURE);changed[field]='WRONG_TEST_CONTEXT'
        with self.assertRaisesRegex(ValueError,'UNBOUND_SOURCE_CONTEXT'):
            require_bound_context(changed,FIXTURE)
    setattr(ContextBindingTests,'test_reject_altered_'+field,check)

if __name__=='__main__':unittest.main()
