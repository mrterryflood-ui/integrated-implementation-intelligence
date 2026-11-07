import unittest
from readiness import assess
def source(i,ok=True):return {'id':i,'status':'ORIGINAL_BYTES_RETAINED' if ok else 'ACQUISITION_FAILED'}
class ReadinessTests(unittest.TestCase):
 def test_partial_sources_not_scientific_success(self):
  names=['nsfg_female','nsfg_codebook','nsfg_published','colorectal_states','lung_states','breast_states','hinds_all','hinds_late','harris_all','harris_late']
  r=assess({'sources':[source(i,i not in ('nsfg_codebook','nsfg_published')) for i in names]}, {})
  self.assertEqual(r['retained_required_sources'],8)
  self.assertEqual(r['source_coverage'],'INCOMPLETE')
  self.assertEqual(r['nsfg_reproduction'],'REVIEW_REQUIRED')
  self.assertEqual(r['mechanism_identification'],'NOT_ESTABLISHED')
 def test_full_retrieval_does_not_mean_scientific_validity(self):
  names=['nsfg_female','nsfg_codebook','nsfg_published','colorectal_states','lung_states','breast_states','hinds_all','hinds_late','harris_all','harris_late']
  r=assess({'sources':[source(i) for i in names]}, {'publication_gate':'SOURCE_REPRODUCED_POINT_ESTIMATES_ONLY'})
  self.assertEqual(r['source_coverage'],'ALL_REQUESTED_ORIGINALS_RETAINED')
  self.assertEqual(r['nsfg_reproduction'],'POINT_ESTIMATES_MATCH_PUBLICATION_ROUNDING_NOT_INDEPENDENTLY_ADJUDICATED')
  self.assertEqual(r['nci_original_source_reconciliation'],'OPEN')
 def test_duplicate_source_fails(self):
  with self.assertRaises(ValueError):assess({'sources':[source('nsfg_female'),source('nsfg_female')]},{})
if __name__=='__main__':unittest.main()
