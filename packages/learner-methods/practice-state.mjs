import { assessAnswer, multiplicationModel, reviewPlan } from "./core.mjs";

/**
 * In-memory pedagogical state. No names, diagnoses, birthdates, uploaded files,
 * school IDs, storage calls, network calls, or authenticated-session claims.
 * Scores with visual answers revealed are GUIDED, never independent.
 */
export function startPractice(a = 23, b = 14) {
  multiplicationModel(a, b);
  return {
    problem: [a, b],
    mode: "guided",
    shownHelp: true,
    submissions: [],
    independentEvidence: [],
  };
}

export function practiceMode(state, mode) {
  if (mode !== "guided" && mode !== "independent") {
    throw new RangeError("Unsupported practice mode");
  }
  return {
    ...state,
    mode,
    shownHelp: mode !== "independent",
  };
}

export function requestHint(state) {
  return { ...state, shownHelp: true };
}

export function submitPractice(state, answer, day) {
  const [a, b] = state.problem;
  const scored = assessAnswer(a, b, answer);
  const validated = reviewPlan([], day);
  if (!scored.correct && scored.state === "try-again") {
    return { state, result: scored, review: validated, counted: false };
  }
  const independent = state.mode === "independent" && !state.shownHelp;
  const submission = {
    problemId: a + "x" + b,
    day,
    correct: scored.correct,
    independent,
  };
  const next = {
    ...state,
    submissions: [...state.submissions, submission],
    independentEvidence: [
      ...state.independentEvidence,
      ...(independent ? [submission] : []),
    ],
    shownHelp: state.shownHelp || !scored.correct,
  };
  return {
    state: next,
    result: scored,
    review: reviewPlan(next.independentEvidence, day),
    counted: true,
  };
}

export function changeProblem(state, a, b) {
  multiplicationModel(a, b);
  return {
    ...state,
    problem: [a, b],
    mode: "guided",
    shownHelp: true,
  };
}
