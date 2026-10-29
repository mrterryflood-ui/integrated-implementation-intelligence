import unittest
from decision_integrity import check_decision_artifact
class TestIntegrity(unittest.TestCase):
    def test_discovery_not_build(self):
        self.assertIn("unapproved_scope",check_decision_artifact({"approvedScope":["discover"],"approvalStatus":"APPROVED"},{"actions":["build"]}))
    def test_unapproved_execution(self):
        self.assertIn("execution_without_approval",check_decision_artifact({"approvedScope":["deploy"],"approvalStatus":"PENDING"},{"actions":["deploy"]}))
    def test_causal_leap(self):
        self.assertIn("causal_mechanism_unverified",check_decision_artifact({"approvedScope":[]},{"claims":[{"claimType":"CAUSAL","mechanismTested":False}]}))
    def test_regulatory_leap(self):
        self.assertIn("unscoped_regulatory_exemption",check_decision_artifact({"approvedScope":[]},{"claims":[{"claimType":"REGULATORY_EXEMPTION"}]}))
    def test_lost_dissent(self):
        self.assertIn("lost_dissent",check_decision_artifact({"approvedScope":[],"materialDissentIds":["reviewer4"]},{"preservedDissentIds":[]}))
    def test_supported_plan(self):
        self.assertEqual([],check_decision_artifact({"approvedScope":["discover"],"approvalStatus":"APPROVED","materialDissentIds":["r1"]},{"actions":["discover"],"preservedDissentIds":["r1"],"claims":[{"epistemicState":"OBSERVED","sourceIds":["source1"]}]}))
if __name__=="__main__": unittest.main()
