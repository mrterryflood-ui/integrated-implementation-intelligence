import test from "node:test";
import assert from "node:assert/strict";
import {buildResearchProgram} from "../lib/research-program";
import {jacksonCancerCase} from "../lib/jackson-cancer-case";
import {reviewEvidenceToAction} from "../lib/evidence-action-bridge";
import {COLORECTAL_CROSSWALK} from "../lib/evidence-action-colorectal";

/**
 * AI review, unverified by human: not scientific acceptance, not clinical acceptance,
 * no patient benefit claimed or measured.
 *
 * Ledger G13. The three medical obligations are raised by the engine in
 * evidence-action-bridge-core.ts. This file pins that a condition identifier can never
 * remove them: an absent measurement is an unknown obligation, not an absent one.
 */
const MEDICAL_OBLIGATIONS=["all-stage-incidence","screening-denominator","diagnostic-resolution"];

test("a non-colorectal condition with no admitted measure still carries all three medical obligations",()=>{
  const breast=buildResearchProgram(jacksonCancerCase("breast"));
  const review=reviewEvidenceToAction(breast,COLORECTAL_CROSSWALK);
  assert.equal(review.measures.length,0);
  for(const id of MEDICAL_OBLIGATIONS)assert.ok(review.gaps.some(g=>g.id===id),"missing obligation "+id);
});

test("a near-miss condition name is not exempted from the medical obligations",()=>{
  const general=buildResearchProgram(jacksonCancerCase("general"));
  const review=reviewEvidenceToAction(general,COLORECTAL_CROSSWALK);
  for(const id of MEDICAL_OBLIGATIONS)assert.ok(review.gaps.some(g=>g.id===id),"missing obligation "+id);
});

test("the colorectal obligation set is unchanged and carries no duplicate",()=>{
  const colorectal=buildResearchProgram(jacksonCancerCase("colorectal"));
  const review=reviewEvidenceToAction(colorectal,COLORECTAL_CROSSWALK);
  for(const id of MEDICAL_OBLIGATIONS)assert.equal(review.gaps.filter(g=>g.id===id).length,1,id+" must appear exactly once");
});

test("no condition literal remains in the facade that could filter an obligation",()=>{
  const review=reviewEvidenceToAction(buildResearchProgram(jacksonCancerCase("breast")),COLORECTAL_CROSSWALK);
  const obligationIds=review.gaps.filter(g=>MEDICAL_OBLIGATIONS.includes(g.id)).map(g=>g.id);
  assert.deepEqual(obligationIds.slice().sort(),MEDICAL_OBLIGATIONS.slice().sort());
});
