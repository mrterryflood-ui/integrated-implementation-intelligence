"""Software-only fixtures; no clinical or judge-reserved case material."""
import copy
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from source_table_guard import load_bound_source_table, require_bound_source_table

SOURCES = [
 {'id':'SYNTHETIC-A','population':'test population','comparator':'test comparator',
  'stage':'test stage','publication_available':'2026-01-01','independent_review':None,
  'findings':{'effect':0.0,'interval':[-1.0,1.0]}},
 {'id':'SYNTHETIC-B','population':'test population','lineage':'same-test-lineage'}]

class SourceTableTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
  self.path=Path(self.tmp.name)/'trusted.json'
  self.manifest={'schema':'dis-rplice-bound-source-table-v1','version':'test-only','sources':copy.deepcopy(SOURCES)}
  self.write(self.manifest)
 def write(self,value):
  raw=json.dumps(value).encode();self.path.write_bytes(raw)
  self.digest=hashlib.sha256(raw).hexdigest()
  self.expected=load_bound_source_table(self.path,self.digest)
 def reject(self,records):
  with self.assertRaises(ValueError):require_bound_source_table(records,self.expected)
 def test_exact_table(self):
  out=require_bound_source_table(copy.deepcopy(SOURCES),self.expected)
  self.assertEqual(out['sources_bound'],2);self.assertFalse(out['scientific_acceptance_established'])
 def test_table_order_independent(self):
  self.assertEqual(require_bound_source_table(list(reversed(SOURCES)),self.expected)['sources_bound'],2)
 def test_dictionary_order_independent(self):
  require_bound_source_table([dict(reversed(list(s.items()))) for s in SOURCES],self.expected)
 def test_duplicate_source_rejected(self):self.reject(SOURCES+[SOURCES[0]])
 def test_extra_source_rejected(self):self.reject(SOURCES+[{'id':'UNKNOWN'}])
 def test_missing_source_rejected(self):self.reject(SOURCES[:1])
 def test_empty_table_rejected(self):self.reject([])
 def test_missing_id_rejected(self):self.reject([{'population':'test'}])
 def test_non_mapping_record_rejected(self):self.reject(['not a record'])
 def test_non_list_table_rejected(self):self.reject(tuple(SOURCES))
 def test_numeric_id_rejected(self):
  x=copy.deepcopy(SOURCES);x[0]['id']=42;self.reject(x)
 def test_wrong_manifest_digest(self):
  with self.assertRaisesRegex(ValueError,'digest mismatch'):load_bound_source_table(self.path,'0'*64)
 def test_bad_digest_format(self):
  for d in ('',None,'a'*63,'A'*64):
   with self.subTest(d=d),self.assertRaises(ValueError):load_bound_source_table(self.path,d)
 def test_duplicate_json_key_even_if_hash_pinned(self):
  raw=b'{"schema":"dis-rplice-bound-source-table-v1","version":"old","version":"new","sources":[]}'
  self.path.write_bytes(raw)
  with self.assertRaisesRegex(ValueError,'duplicate JSON'):load_bound_source_table(self.path,hashlib.sha256(raw).hexdigest())
 def test_invalid_json_even_if_hash_pinned(self):
  raw=b'not JSON';self.path.write_bytes(raw)
  with self.assertRaisesRegex(ValueError,'invalid source'):load_bound_source_table(self.path,hashlib.sha256(raw).hexdigest())
 def test_invalid_schema(self):
  x=copy.deepcopy(self.manifest);x['schema']='wrong'
  with self.assertRaisesRegex(ValueError,'schema'):self.write(x)
 def test_blank_manifest_version(self):
  x=copy.deepcopy(self.manifest);x['version']=' '
  with self.assertRaisesRegex(ValueError,'version'):self.write(x)
 def test_canonical_sources_immutable(self):
  with self.assertRaises(TypeError):self.expected.canonical_sources['SYNTHETIC-A']='wrong'
 def test_tuple_cannot_disguise_as_json_list(self):
  x=copy.deepcopy(SOURCES);x[0]['findings']['interval']=(-1.0,1.0);self.reject(x)
 def test_numeric_key_rejected(self):
  x=copy.deepcopy(SOURCES);x[0][1]='test';self.reject(x)
 def test_cycles_rejected(self):
  x=copy.deepcopy(SOURCES);x[0]['recursive']=x;self.reject(x)
 def test_nonfinite_values_rejected(self):
  for value in (float('nan'),float('inf'),float('-inf')):
   with self.subTest(value=value):
    x=copy.deepcopy(SOURCES);x[0]['findings']['effect']=value;self.reject(x)
 def test_extra_clinical_claim_rejected(self):
  x=copy.deepcopy(SOURCES);x[0]['lives_saved']=100;self.reject(x)
 def test_boolean_effect_rejected(self):
  x=copy.deepcopy(SOURCES);x[0]['findings']['effect']=False;self.reject(x)
 def test_integer_float_substitution_rejected(self):
  x=copy.deepcopy(SOURCES);x[0]['findings']['effect']=0;self.reject(x)
 def test_missing_field_rejected(self):
  x=copy.deepcopy(SOURCES);del x[0]['population'];self.reject(x)
 def test_wrong_reference_type_rejected(self):
  with self.assertRaises(ValueError):require_bound_source_table(SOURCES,{})

for field in ('population','comparator','stage','publication_available','independent_review','findings'):
 def changed(self,field=field):
  x=copy.deepcopy(SOURCES);x[0][field]='WRONG';self.reject(x)
 setattr(SourceTableTests,'test_reject_changed_'+field,changed)

if __name__=='__main__':unittest.main()
