"""ChainWeb validation and propagation tests using hypotheses, never clinical estimates."""
import copy
import json
import pathlib
import unittest
from chainweb import validate_edges, downstream_hypotheses

EDGES=json.loads((pathlib.Path(__file__).parent/"chainweb-hypotheses.v0.1.json").read_text())["edges"]

class ChainWebTests(unittest.TestCase):
    def test_reference_graph(self):
        self.assertEqual(validate_edges(EDGES),[])
    def test_downstream_is_not_causal_effect(self):
        x=downstream_hypotheses(EDGES,"abnormal_screening_signal")
        self.assertEqual(len(x),4)
        self.assertTrue(all(v["status"]=="hypothesis_only" and not v["clinical_effect_estimated"] for v in x))
    def test_cycle_rejected(self):
        e=copy.deepcopy(EDGES)
        e.append(dict(e[0],edge_id="cycle",source="patient_outcome",target="abnormal_screening_signal"))
        self.assertTrue(any("cycle" in x for x in validate_edges(e)))
    def test_unreferenced_claim_rejected(self):
        e=copy.deepcopy(EDGES);e[1]["evidence_refs"]=[]
        self.assertTrue(validate_edges(e))
    def test_unknown_strength_rejected(self):
        e=copy.deepcopy(EDGES);e[1]["evidence_strength"]="proven"
        self.assertTrue(validate_edges(e))
    def test_duplicate_edge_rejected(self):
        e=copy.deepcopy(EDGES);e.append(dict(e[0]))
        self.assertTrue(validate_edges(e))

if __name__=="__main__":
    unittest.main()
