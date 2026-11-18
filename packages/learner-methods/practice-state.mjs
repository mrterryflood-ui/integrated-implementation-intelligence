import { assessAnswer, multiplicationModel, reviewPlan } from "./core.mjs";

function key(a, b) { return a + "x" + b; }
function assertMode(mode) {
  if (mode !== "guided" && mode !== "independent")
    throw new RangeError("Unsupported practice mode");
}

/**
 * Ephemeral pedagogical state. An attempt is independent only when its specific
 * problem has not had worked-out answer cues exposed in this session.
 */
export function startPractice(a = 23, b = 14, { mode = "guided" } = {}) {
  multiplicationModel(a, b);
  assertMode(mode);
  return {
    problem: [a, b],
    mode,
    shownHelp: mode === "guided",
    helpedProblems: mode === "guided" ? [key(a, b)] : [],
    submissions: [],
    independentEvidence: [],
  };
}

/**
 * Toggling from a previously-helped problem into independent mode does not
 * magically remove prior exposure. Use changeProblem(...,{mode:"independent"})
 * for a fresh question. This prevents false evidence.
 */
export function practiceMode(state, mode) {
  assertMode(mode);
  const assisted = mode === "guided" ||
    state.helpedProblems.includes(key(...state.problem));
  return {
    ...state,
    mode,
    shownHelp: assisted,
    helpedProblems: mode === "guided"
      ? [...new Set([...state.helpedProblems, key(...state.problem)])]
      : state.helpedProblems,
  };
}

export function requestHint(state) {
  return {
    ...state,
    shownHelp: true,
    helpedProblems: [...new Set([...state.helpedProblems, key(...state.problem)])],
  };
}

export function submitPractice(state, answer, day) {
  const [a, b] = state.problem;
  const scored = assessAnswer(a, b, answer);
  const validated = reviewPlan([], day);
  if (!scored.correct && scored.state === "try-again") {
    return { state, result: scored, review: validated, counted: false };
  }
  const independent = state.mode === "independent" &&
    !state.shownHelp &&
    !state.helpedProblems.includes(key(a, b));
  const submission = { problemId: key(a,b), day, correct: scored.correct, independent };
  const next = {
    ...state,
    submissions: [...state.submissions, submission],
    independentEvidence: [...state.independentEvidence, ...(independent ? [submission] : [])],
    shownHelp: state.shownHelp || !scored.correct,
    helpedProblems: scored.correct ? state.helpedProblems
      : [...new Set([...state.helpedProblems, key(a,b)])],
  };
  return {
    state: next,
    result: scored,
    review: reviewPlan(next.independentEvidence, day),
    counted: true,
  };
}

export function changeProblem(state, a, b, { mode = "guided" } = {}) {
  multiplicationModel(a, b);
  assertMode(mode);
  const helped = state.helpedProblems.includes(key(a,b));
  const helpShown = mode === "guided" || helped;
  return {
    ...state,
    problem: [a, b],
    mode,
    shownHelp: helpShown,
    helpedProblems: mode === "guided"
      ? [...new Set([...state.helpedProblems, key(a,b)])]
      : state.helpedProblems,
  };
}
