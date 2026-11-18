import test from "node:test";
import assert from "node:assert/strict";
import { startPractice, practiceMode, requestHint, submitPractice, changeProblem } from "./practice-state.mjs";

const day = "2026-11-18";

test("a worked example is guided even when a learner enters the correct answer", () => {
  const practice = startPractice(23, 14);
  const event = submitPractice(practice, 322, day);
  assert.equal(event.result.correct, true);
  assert.equal(event.state.submissions[0].independent, false);
  assert.equal(event.state.independentEvidence.length, 0);
});

test("independent mode hides help and records actual unaided attempts", () => {
  const practice = practiceMode(startPractice(23, 14), "independent");
  assert.equal(practice.shownHelp, false);
  const event = submitPractice(practice, "322", day);
  assert.equal(event.state.submissions[0].independent, true);
  assert.equal(event.state.independentEvidence.length, 1);
  assert.equal(event.review.status, "learning-in-progress");
});

test("hint request invalidates independence for the current question", () => {
  const practice = requestHint(practiceMode(startPractice(), "independent"));
  const scored = submitPractice(practice, 322, day);
  assert.equal(scored.state.submissions[0].independent, false);
});

test("a wrong answer followed by feedback must not count next attempt as independent", () => {
  const practice = practiceMode(startPractice(23, 14), "independent");
  const wrong = submitPractice(practice, 92, day);
  assert.equal(wrong.result.correct, false);
  assert.equal(wrong.state.submissions[0].independent, true);
  assert.equal(wrong.state.shownHelp, true);
  const correct = submitPractice(wrong.state, 322, day);
  assert.equal(correct.result.correct, true);
  assert.equal(correct.state.submissions[1].independent, false);
  assert.equal(correct.state.independentEvidence.length, 1);
});

test("blank and malformed input never create a performance record", () => {
  const practice = startPractice(23,14);
  for (const invalid of ["", "abc", "  ", "322.8", null]) {
    const scored = submitPractice(practice, invalid, day);
    assert.equal(scored.counted, false);
    assert.equal(scored.state.submissions.length, 0);
  }
});

test("changing the problem resets guided mode without erasing prior evidence", () => {
  const practice = practiceMode(startPractice(23,14), "independent");
  const done = submitPractice(practice, 322, day).state;
  const next = changeProblem(done, 16,12);
  assert.deepEqual(next.problem,[16,12]);
  assert.equal(next.mode, "guided");
  assert.equal(next.shownHelp,true);
  assert.equal(next.submissions.length,1);
});

test("only legitimate practice modes and mathematical factors are accepted", () => {
  assert.throws(() => practiceMode(startPractice(),"timed"),RangeError);
  assert.throws(() => startPractice(-1,14),RangeError);
  assert.throws(() => changeProblem(startPractice(),100,14),RangeError);
});

test("review still requires multiple different questions and two separate days", () => {
  let state = practiceMode(startPractice(23,14),"independent");
  state = submitPractice(state,322,day).state;
  state = changeProblem(state,16,12);
  state = practiceMode(state,"independent");
  state = submitPractice(state,192,day).state;
  state = changeProblem(state,34,21);
  state = practiceMode(state,"independent");
  const after = submitPractice(state,714,day);
  assert.equal(after.review.status,"learning-in-progress");
});
