import test from "node:test";
import assert from "node:assert/strict";
import {
  CORE_VERSION, beginGradeFour, suggestSupports, multiplicationModel,
  instructionalSequence, assessAnswer, adaptNextStep,
  checkLocalHomeworkFile, verifyHomeworkFileHeader, understandHomeworkText, reviewPlan
} from "./core.mjs";

test("grade four is implemented; other grades are not falsely advertised", () => {
  const session = beginGradeFour({ grade: 4 });
  assert.equal(session.grade, 4);
  assert.equal(session.timeLimit, null);
  assert.equal(session.diagnosisRequired, false);
  assert.equal(session.stage, "learn");
  assert.equal(session.contentVersion, CORE_VERSION);
  assert.throws(() => beginGradeFour({ grade: 3 }), RangeError);
  assert.throws(() => beginGradeFour({ grade: 5 }), RangeError);
});

test("dyslexia and auditory-processing disclosure are optional support suggestions, not labels", () => {
  const dyslexia = suggestSupports(["dyslexia"]);
  assert.ok(dyslexia.includes("read-aloud"));
  assert.ok(dyslexia.includes("extra-spacing"));
  assert.ok(dyslexia.includes("untimed"));
  const auditory = suggestSupports(["auditory processing"]);
  assert.ok(auditory.includes("captions"));
  assert.ok(auditory.includes("written-instructions"));
  assert.deepEqual(suggestSupports([]), []);
  const session = beginGradeFour({ grade: 4, supports: [...dyslexia, ...auditory] });
  assert.equal(Object.hasOwn(session, "diagnosis"), false);
  assert.equal(Object.hasOwn(session, "condition"), false);
  assert.equal(Object.hasOwn(session, "learnerName"), false);
  assert.equal(Object.hasOwn(session, "birthdate"), false);
});

test("user-selected supports are deduplicated and reject arbitrary labels", () => {
  const session = beginGradeFour({ grade: 4, supports: ["show-steps", "show-steps", "unsafe", "untimed"] });
  assert.deepEqual(session.supportChoices, ["show-steps", "untimed"]);
});

test("place value area model gives 322 for 23 times 14", () => {
  const model = multiplicationModel(23, 14);
  assert.deepEqual(model.cells.map(x => x.value), [200, 80, 30, 12]);
  assert.equal(model.total, 322);
  assert.deepEqual(model.decomposition, [[20, 3], [10, 4]]);
});

test("area model arithmetic invariant holds throughout two-digit domain", () => {
  for (let a = 10; a <= 99; a++) {
    for (let b = 10; b <= 99; b++) {
      const m = multiplicationModel(a, b);
      assert.equal(m.cells.reduce((s, cell) => s + cell.value, 0), a * b);
      assert.equal(m.total, a * b);
    }
  }
});

test("invalid factors fail closed", () => {
  for (const a of [0, 1, 9, 100, -20, Number.NaN, 23.5, "23"]) {
    assert.throws(() => multiplicationModel(a, 14), RangeError);
  }
});

test("instruction goes concrete, pictorial, place-value, guided, independent and revisit", () => {
  const lesson = instructionalSequence({ a: 23, b: 14 });
  assert.deepEqual(lesson.stages.map(s => s.id), [
    "concrete", "represent", "explain", "guided", "independent", "revisit"
  ]);
  assert.equal(lesson.stages[1].model.total, 322);
  const turtle = instructionalSequence({ a: 23, b: 14, useTurtlehead: true });
  assert.ok(turtle.stages.some(s => s.id === "turtlehead-optional"));
  assert.ok(turtle.stages.find(s => s.id === "turtlehead-optional").prompt.includes("memory aid"));
});

test("assessment helps correct place-value omissions without rushing or diagnosis", () => {
  assert.equal(assessAnswer(23, 14, "322").correct, true);
  assert.equal(assessAnswer(23, 14, 92).state, "place-value");
  assert.equal(assessAnswer(23, 14, 292).state, "needs-a-step");
  assert.equal(assessAnswer(23, 14, "three hundred").state, "try-again");
  assert.equal(assessAnswer(23, 14, 37).state, "operation");
  assert.equal(assessAnswer(23, 14, 400).state, "revisit-model");
});

test("adaptation follows error patterns, not learning-style labels or raw speed", () => {
  const p = adaptNextStep({ observations: { placeValueErrors: 2 } });
  assert.equal(p.nextStage, "represent");
  const q = adaptNextStep({ observations: { sequenceErrors: 2 } });
  assert.equal(q.nextStage, "guided");
  const r = adaptNextStep({ observations: { needsExtraExplanation: true } });
  assert.equal(r.nextStage, "concrete");
  const s = adaptNextStep({ observations: { timeTakenSeconds: 900 } });
  assert.equal(s.nextStage, "independent");
});

test("homework photo validation is local and refuses oversized or unsupported files", () => {
  assert.equal(checkLocalHomeworkFile({name:"worksheet.png",type:"image/png",size:1024}).ok, true);
  assert.equal(checkLocalHomeworkFile({name:"school.pdf",type:"application/pdf",size:100000}).ok, true);
  assert.equal(checkLocalHomeworkFile({name:"school.pdf",type:"application/pdf",size:9*1024*1024}).ok, false);
  assert.equal(checkLocalHomeworkFile({name:"virus.exe",type:"application/octet-stream",size:999}).ok, false);
  assert.equal(checkLocalHomeworkFile({name:"../../secret.png",type:"image/png",size:999}).ok, false);
});

test("photo/PDF local preview checks content signature and rejects mismatches", () => {
  const png = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
  const jpg = Uint8Array.from([255, 216, 255, 224, 0, 16, 74, 70, 73, 70, 0, 0]);
  const webp = Uint8Array.from([82, 73, 70, 70, 4, 0, 0, 0, 87, 69, 66, 80]);
  const pdf = Uint8Array.from([37, 80, 68, 70, 45, 49, 46, 55, 10, 0, 0, 0]);
  assert.equal(verifyHomeworkFileHeader("image/png", png).ok, true);
  assert.equal(verifyHomeworkFileHeader("image/jpeg", jpg).ok, true);
  assert.equal(verifyHomeworkFileHeader("image/webp", webp).ok, true);
  assert.equal(verifyHomeworkFileHeader("application/pdf", pdf).ok, true);
  assert.equal(verifyHomeworkFileHeader("image/jpeg", pdf).ok, false);
  assert.equal(verifyHomeworkFileHeader("image/png", jpg).ok, false);
  assert.equal(verifyHomeworkFileHeader("application/pdf", new Uint8Array(12)).ok, false);
  assert.equal(verifyHomeworkFileHeader("application/pdf", new Uint8Array()).ok, false);
  assert.equal(verifyHomeworkFileHeader("image/png", "fake").ok, false);
});

test("understanding typed worksheet text never pretends OCR was performed", () => {
  assert.equal(understandHomeworkText("").state, "needs-text");
  assert.equal(understandHomeworkText("23 × 14").skill, "two-digit-multiplication");
  assert.deepEqual(understandHomeworkText("What is 23 x 14?").factors, [23,14]);
  assert.equal(understandHomeworkText("We use partial products").skill, "multiplication");
  assert.equal(understandHomeworkText("Poetry comprehension").state, "needs-review");
});

test("retention cannot be certified from a single correct response", () => {
  const one = reviewPlan([{problemId:"23x14",day:"2026-11-18",correct:true,independent:true}], "2026-11-18");
  assert.equal(one.status,"learning-in-progress");
  assert.equal(one.nextReviewDay,"2026-11-19");
  const retained = reviewPlan([
    {problemId:"23x14",day:"2026-11-18",correct:true,independent:true},
    {problemId:"16x12",day:"2026-11-18",correct:true,independent:true},
    {problemId:"34x21",day:"2026-11-19",correct:true,independent:true}
  ],"2026-11-19");
  assert.equal(retained.status,"independent-practice-demonstrated");
  assert.equal(retained.nextReviewDay,"2026-11-22");
  assert.throws(() => reviewPlan([], "not-a-date"), RangeError);
});
