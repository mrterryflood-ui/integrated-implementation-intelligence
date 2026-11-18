/**
 * Learner-centered grade 4 instructional core, portable across ISS products.
 * No network, identity, diagnosis, device permissions, AI calls, or persistence.
 * Teaching suggestions are based on observable learning responses, not labels.
 * This is an instructional component, NOT a finished child-data PWA release.
 */
export const CORE_VERSION = "0.1.0";
export const SUPPORT_CHOICES = Object.freeze([
  "show-steps", "read-aloud", "written-instructions", "captions",
  "larger-text", "extra-spacing", "quiet-mode", "replay-instructions",
  "untimed", "visual-model"
]);

const allowedSupports = new Set(SUPPORT_CHOICES);
const supportedNeeds = new Map([
  ["dyslexia", ["show-steps", "read-aloud", "extra-spacing", "written-instructions", "untimed"]],
  ["reading difficulty", ["show-steps", "read-aloud", "extra-spacing", "written-instructions"]],
  ["auditory processing", ["written-instructions", "captions", "replay-instructions", "quiet-mode"]],
  ["processing speed", ["untimed", "show-steps", "replay-instructions"]],
  ["attention", ["quiet-mode", "show-steps", "replay-instructions"]],
  ["working memory", ["show-steps", "visual-model", "replay-instructions"]]
]);

function assertInteger(value, min, max, field) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new RangeError(field + " must be an integer between " + min + " and " + max);
  }
}

function uniqueSupports(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter(x => typeof x === "string" && allowedSupports.has(x)))];
}

/**
 * Consent-sensitive context can be evaluated transiently to suggest optional
 * accommodations; returned data contains NO condition/diagnosis disclosure.
 */
export function suggestSupports(learnerContext = []) {
  if (!Array.isArray(learnerContext)) return [];
  const suggestions = learnerContext.flatMap(value =>
    supportedNeeds.get(typeof value === "string" ? value.trim().toLowerCase() : "") || []
  );
  return uniqueSupports(suggestions);
}

export function beginGradeFour({ grade, supports = [] } = {}) {
  if (grade !== 4) {
    throw new RangeError("Only grade 4 multiplication is implemented in this instructional core");
  }
  return Object.freeze({
    grade: 4,
    skill: "two-digit-multiplication",
    supportChoices: uniqueSupports(supports),
    contentVersion: CORE_VERSION,
    stage: "learn",
    timeLimit: null,
    diagnosisRequired: false,
    photoRequired: false
  });
}

export function multiplicationModel(a, b) {
  assertInteger(a, 10, 99, "a");
  assertInteger(b, 10, 99, "b");
  const aTens = Math.floor(a / 10) * 10;
  const aOnes = a % 10;
  const bTens = Math.floor(b / 10) * 10;
  const bOnes = b % 10;
  const cells = Object.freeze([
    { expression: String(aTens) + " × " + String(bTens), value: aTens * bTens, kind: "tens-tens" },
    { expression: String(aTens) + " × " + String(bOnes), value: aTens * bOnes, kind: "tens-ones" },
    { expression: String(aOnes) + " × " + String(bTens), value: aOnes * bTens, kind: "ones-tens" },
    { expression: String(aOnes) + " × " + String(bOnes), value: aOnes * bOnes, kind: "ones-ones" }
  ]);
  const sum = cells.reduce((value, cell) => value + cell.value, 0);
  if (sum !== a * b) throw new Error("Area-model invariant failed");
  return Object.freeze({ a, b, decomposition: [[aTens, aOnes], [bTens, bOnes]], cells, total: sum });
}

export function instructionalSequence({ a = 23, b = 14, supports = [], useTurtlehead = false } = {}) {
  const model = multiplicationModel(a, b);
  const choices = uniqueSupports(supports);
  const stages = [
    { id: "concrete", title: "Build the groups", prompt: "Use blocks or counters to make " + b + " groups of " + a + "." },
    { id: "represent", title: "Draw an area model", prompt: "Break the two factors into tens and ones. See each piece.", model },
    { id: "explain", title: "Explain place value", prompt: "Why do the tens parts make groups of ten or one hundred?" },
    { id: "guided", title: "Try with hints", prompt: "Find four partial products, then add them." },
    { id: "independent", title: "Now you try", prompt: "Solve a new problem without a hint; ask for help whenever needed." },
    { id: "revisit", title: "Remember it later", prompt: "Return to a different problem tomorrow, then after a few days." }
  ];
  if (useTurtlehead) {
    stages.splice(4, 0, {
      id: "turtlehead-optional",
      title: "Optional Turtlehead reminder",
      prompt: "Use visual cues to remember the written algorithm, including a zero placeholder on the tens row. This is a memory aid, not a replacement for understanding place value."
    });
  }
  return Object.freeze({ subject: "math", grade: 4, skill: "two-digit-multiplication", supports: choices, stages });
}

export function assessAnswer(a, b, rawAnswer) {
  const model = multiplicationModel(a, b);
  const answer = typeof rawAnswer === "number"
    ? rawAnswer
    : typeof rawAnswer === "string" && /^\d{1,6}$/.test(rawAnswer.trim())
      ? Number(rawAnswer.trim()) : null;
  if (answer === null || !Number.isSafeInteger(answer)) {
    return { state: "try-again", correct: false, hint: "Enter a whole-number answer. You can use the area model." };
  }
  if (answer === model.total) {
    return { state: "correct", correct: true, hint: "Explain how the four partial products make your answer." };
  }
  const [tt, to, ot, oo] = model.cells.map(cell => cell.value);
  const partials = tt + to + ot + oo;
  if (answer === (tt + to + oo) || answer === (tt + ot + oo)) {
    return { state: "needs-a-step", correct: false, hint: "Check whether you included both tens-by-ones pieces." };
  }
  if (answer === a * (b % 10) || answer === b * (a % 10)) {
    return { state: "place-value", correct: false, hint: "You found one part. What changes when you multiply by a group of ten?" };
  }
  if (answer === Math.abs(a - b) || answer === a + b) {
    return { state: "operation", correct: false, hint: "Multiplication asks about equal groups. Try building an array." };
  }
  return { state: "revisit-model", correct: false, hint: "Break both numbers into tens and ones. Check the four rectangles before adding." };
}

export function adaptNextStep({ observations = {}, preferences = [] } = {}) {
  const choices = uniqueSupports(preferences);
  const placeValueErrors = Math.max(0, Number(observations.placeValueErrors) || 0);
  const sequenceErrors = Math.max(0, Number(observations.sequenceErrors) || 0);
  const needs = observations.needsExtraExplanation === true;
  if (placeValueErrors >= 2) {
    return { nextStage: "represent", rationale: "Observed place-value errors; revisit arrays and tens/ones.", supports: choices };
  }
  if (sequenceErrors >= 2) {
    return { nextStage: "guided", rationale: "Observed procedural omissions; use visible partial-product steps.", supports: choices };
  }
  if (needs) {
    return { nextStage: "concrete", rationale: "Learner requested another explanation.", supports: choices };
  }
  return { nextStage: "independent", rationale: "Offer independent practice; check retention separately.", supports: choices };
}

const permittedMime = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
/**
 * Identify image/PDF bytes before local preview. MIME/extension is untrusted.
 * This is not antivirus scanning, OCR, upload authorization or full file parsing.
 */
export function verifyHomeworkFileHeader(declaredType, header) {
  if (!(header instanceof Uint8Array) || header.length < 12) {
    return { ok: false, reason: "The document header could not be verified." };
  }
  const at = (offset, values) => values.every((v, i) => header[offset + i] === v);
  const isPdf = at(0, [37, 80, 68, 70, 45]); // %PDF-
  const isPng = at(0, [137, 80, 78, 71, 13, 10, 26, 10]);
  const isJpeg = at(0, [255, 216, 255]);
  const isWebp = at(0, [82, 73, 70, 70]) && at(8, [87, 69, 66, 80]);
  const actualType = isPdf ? "application/pdf"
    : isPng ? "image/png"
    : isJpeg ? "image/jpeg"
    : isWebp ? "image/webp" : null;
  if (!actualType || actualType !== declaredType) {
    return { ok: false, reason: "The file content does not match its declared photo or PDF type." };
  }
  return { ok: true, reason: "Local signature is consistent; no private upload has occurred." };
}

export function checkLocalHomeworkFile({ name, size, type } = {}) {
  if (typeof name !== "string" || !name || /[\\/\u0000-\u001F]/.test(name)) {
    return { ok: false, reason: "Select a document or photo with a valid filename." };
  }
  if (!permittedMime.has(type)) return { ok: false, reason: "Choose a JPEG, PNG, WebP, or PDF." };
  if (!Number.isSafeInteger(size) || size <= 0 || size > 8 * 1024 * 1024) {
    return { ok: false, reason: "Choose a file smaller than 8 MB." };
  }
  return { ok: true, reason: "Preview locally. Do not upload or share without separate authorization." };
}

/** No image analysis or OCR claim: text must already be available. */
export function understandHomeworkText(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return { state: "needs-text", skill: null, instruction: "A photo can be previewed, but text recognition is not connected. Type or paste one problem." };
  }
  const text = value.slice(0, 4000).replace(/\s+/g, " ").trim();
  const match = text.match(/\b(\d{1,3})\s*(?:×|x|\*)\s*(\d{1,3})\b/i);
  if (match) {
    const a = Number(match[1]), b = Number(match[2]);
    if (a >= 10 && a <= 99 && b >= 10 && b <= 99) {
      return { state: "recognized-from-text", skill: "two-digit-multiplication", factors: [a, b], instruction: "Use the array and area model before the written algorithm." };
    }
  }
  if (/multiply|multiplication|equal groups|partial products/i.test(text)) {
    return { state: "recognized-topic", skill: "multiplication", instruction: "Start with equal groups and place value; ask for the numbers on the worksheet." };
  }
  return { state: "needs-review", skill: null, instruction: "The lesson cannot safely infer this worksheet's skill. Ask a learner or teacher to identify the topic." };
}

export function reviewPlan(observations = [], currentDay = "2026-11-18") {
  const today = new Date(currentDay + "T00:00:00.000Z");
  if (!Number.isFinite(today.getTime()) || today.toISOString().slice(0, 10) !== currentDay) {
    throw new RangeError("currentDay must be a valid YYYY-MM-DD date");
  }
  const valid = Array.isArray(observations) ? observations.filter(row =>
    row && typeof row.problemId === "string" && row.problemId &&
    typeof row.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(row.day) &&
    typeof row.correct === "boolean" && typeof row.independent === "boolean"
  ) : [];
  const independentCorrect = valid.filter(row => row.correct && row.independent);
  const problems = new Set(independentCorrect.map(row => row.problemId));
  const days = new Set(independentCorrect.map(row => row.day));
  const demonstrated = problems.size >= 3 && days.size >= 2;
  const intervalDays = demonstrated ? 3 : 1;
  const next = new Date(today.getTime() + intervalDays * 86400000).toISOString().slice(0, 10);
  return {
    status: demonstrated ? "independent-practice-demonstrated" : "learning-in-progress",
    uniqueIndependentProblems: problems.size,
    separatePracticeDays: days.size,
    nextReviewDay: next,
    intervalDays,
    statement: "This is practice evidence, not a diagnosis or proof of broad cognitive change."
  };
}
