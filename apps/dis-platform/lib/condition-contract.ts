/**
 * Condition contract (AI review, unverified by human — not scientific acceptance, not clinical acceptance,
 * no patient benefit claimed or measured).
 *
 * WHY THIS MODULE EXISTS (ledger G13): medical measurement obligations used to follow a site literal, so a
 * clinical condition entered under the overloaded literal "general" with nothing declared lost all three
 * obligations — a fail-open false clean bill. The literal is overloaded in the shipped builders:
 * jacksonCancerCase("general") is the all-cancer-sites case (indicators, public sources, a county proxy),
 * while unsourcedResearchCase(...) is the no-condition service study (no indicators, no sources, no proxy).
 * No rule keyed on that literal can separate them, so the obligations now follow a DECLARED condition profile.
 *
 * An unrecognised condition is never silently treated as non-clinical: resolveConditionProfile refuses it by
 * name, and declaresMedicalObligations fails closed (obligations raised) when no profile matches.
 */

export type MedicalObligationId =
  | "all-stage-incidence"
  | "screening-denominator"
  | "diagnostic-resolution";

export type ConditionClass = "CLINICAL" | "SERVICE" | "AMBIGUOUS";

/**
 * ALWAYS — the three medical obligations are raised for this condition whatever else is declared.
 * NEVER — no medical obligation is raised; this is a service or method study, not a clinical condition.
 * DECLARED_MEASUREMENT — the identifier alone cannot decide it; the caller must supply the declared-
 * measurement determination, and the ambiguity is named in the profile rather than hidden.
 */
export type ObligationBasis = "ALWAYS" | "NEVER" | "DECLARED_MEASUREMENT";

export type ConditionProfile = {
  readonly id: string;
  readonly label: string;
  readonly conditionClass: ConditionClass;
  readonly obligationBasis: ObligationBasis;
  readonly obligationIds: readonly MedicalObligationId[];
  readonly note: string;
};

/** The three obligations the evidence-to-action facade raises; the order is the order the facade uses. */
export const MEDICAL_OBLIGATION_IDS: readonly MedicalObligationId[] = [
  "all-stage-incidence",
  "screening-denominator",
  "diagnostic-resolution",
];

export const CONDITION_PROFILES: readonly ConditionProfile[] = [
  {
    id: "colorectal",
    label: "Colorectal cancer",
    conditionClass: "CLINICAL",
    obligationBasis: "ALWAYS",
    obligationIds: MEDICAL_OBLIGATION_IDS,
    note: "The pilot condition. Incidence, screening completion and abnormal-result diagnostic follow-up are all required.",
  },
  {
    id: "breast",
    label: "Breast cancer",
    conditionClass: "CLINICAL",
    obligationBasis: "ALWAYS",
    obligationIds: MEDICAL_OBLIGATION_IDS,
    note: "A clinical condition other than the pilot. It must keep all three obligations without any edit to the facade.",
  },
  {
    id: "all-cancer-sites",
    label: "All cancer sites combined",
    conditionClass: "CLINICAL",
    obligationBasis: "ALWAYS",
    obligationIds: MEDICAL_OBLIGATION_IDS,
    note: "The all-sites case is clinical, but its stage construct is not one site's stage; the obligations stand and the pooled construct must still be refused as a substitute for a site-specific measure.",
  },
  {
    id: "general",
    label: "Overloaded literal: all-cancer-sites case or no-condition study",
    conditionClass: "AMBIGUOUS",
    obligationBasis: "DECLARED_MEASUREMENT",
    obligationIds: MEDICAL_OBLIGATION_IDS,
    note: "Documented overload, not an exemption. The identifier alone cannot decide the obligation set; the caller's declared-measurement test decides it, so a clinical condition cannot be exempted by naming itself general and a service study cannot inherit a disease obligation.",
  },
  {
    id: "custom-unsourced-method",
    label: "Unsourced method or service study",
    conditionClass: "SERVICE",
    obligationBasis: "NEVER",
    obligationIds: [],
    note: "No condition is declared and no population measure exists, so no medical obligation is raised. This is the only profile that may remove the obligations, and it is keyed on a case identity, not on the overloaded site literal.",
  },
];

export class UnknownConditionError extends Error {
  readonly conditionId: string;
  constructor(conditionId: string) {
    super(
      "Unknown condition identifier " +
        JSON.stringify(conditionId) +
        ". Declare a profile in CONDITION_PROFILES: an unrecognised condition is never silently treated as non-clinical.",
    );
    this.name = "UnknownConditionError";
    this.conditionId = conditionId;
  }
}

/** Non-throwing lookup. Returns null for an unknown or blank identifier; never guesses a profile. */
export function tryResolveConditionProfile(conditionId: string): ConditionProfile | null {
  if (typeof conditionId !== "string") return null;
  const key = conditionId.trim();
  if (!key) return null;
  for (const profile of CONDITION_PROFILES) {
    if (profile.id === key) return profile;
  }
  return null;
}

/** Strict lookup: refuses an unknown identifier BY NAME rather than defaulting to a class. */
export function resolveConditionProfile(conditionId: string): ConditionProfile {
  const profile = tryResolveConditionProfile(conditionId);
  if (profile === null) throw new UnknownConditionError(String(conditionId));
  return profile;
}

/** The obligation identifiers a declared condition carries; throws for an unknown condition. */
export function obligationsForCondition(conditionId: string): readonly MedicalObligationId[] {
  return resolveConditionProfile(conditionId).obligationIds;
}

/**
 * Decide whether the three medical obligations are raised.
 *
 * identifiers are consulted in order, so a case identity may be declared before an overloaded site literal.
 * The first identifier with a profile decides. If none has a profile the answer is true: an unrecognised
 * condition keeps its obligations rather than losing them.
 */
export function declaresMedicalObligations(
  identifiers: readonly string[],
  declaresClinicalMeasurement: boolean,
): boolean {
  for (const identifier of identifiers) {
    const profile = tryResolveConditionProfile(identifier);
    if (profile === null) continue;
    if (profile.obligationBasis === "ALWAYS") return true;
    if (profile.obligationBasis === "NEVER") return false;
    return declaresClinicalMeasurement;
  }
  return true;
}
