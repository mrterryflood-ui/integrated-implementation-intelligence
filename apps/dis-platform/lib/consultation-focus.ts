/**
 * Public DIS use-case choices: one shared catalog for card navigation and
 * the consultation's starting guidance. No research, council call, consent,
 * submission, or private record is triggered by choosing a focus area.
 */
export const CONSULTATION_FOCUS_AREAS = [
  {
    id: "funding-contracts",
    title: "Funding & contracts",
    description: "Find requirements, test eligibility, identify missing evidence, and shape a credible proposal.",
    guidance: "Describe the funding or contracting decision. DIS can help investigate eligibility, deadlines, competitive fit and evidence gaps before proposing a course of action.",
    examples: [
      "What funding or contracting opportunities match our verified capabilities, and what gaps must we close?",
      "How should we evaluate an RFP, compare whether to bid, and plan a compliant response?"
    ]
  },
  {
    id: "research-healthcare",
    title: "Research & healthcare",
    description: "Connect published science with people, implementation barriers, and measurable outcomes.",
    guidance: "Start with the research or implementation question, affected people, setting and outcome. Keep clinical and ethical decisions under qualified human authority.",
    examples: [
      "What evidence supports this proposed intervention, and how could we evaluate adoption and outcomes?",
      "How do we investigate barriers to implementing an evidence-informed program in a local setting?"
    ]
  },
  {
    id: "clinical-health-systems",
    title: "Healthcare & clinical systems",
    description: "Investigate healthcare delivery, prevention, mental health, quality, access, and health-system implementation.",
    guidance: "Describe the care or health-system problem, setting, population, decision authority, outcomes, and authorized evidence. DIS cannot inspect patient records, screen individuals, or make clinical decisions without independently verified purpose-specific permissions and qualified human oversight.",
    examples: [
      "How could a health system improve preventive care access, behavioral health continuity, and equitable outcomes using verified evidence?",
      "What implementation barriers, workforce needs, safeguards, and measured outcomes matter when redesigning a clinical service?"
    ]
  },
  {
    id: "social-health",
    title: "Social health & whole-person care",
    description: "Explore housing, food, transportation, connection, family support, benefits, and community safety alongside health.",
    guidance: "Start with the people, place, life circumstances, resources, social needs, stakeholders, and actual outcomes. Explore options through approved aggregate evidence and human-reviewed methods; individual service histories, screenings, referrals, and client files are not automatically shared.",
    examples: [
      "How can housing, food access, transportation, and community partnerships influence preventable health burdens?",
      "How should we coordinate trusted social-care navigation with clinical teams and measure reach, referrals, uptake, and outcomes?"
    ]
  },
  {
    id: "research-universities",
    title: "Universities, research & implementation",
    description: "Investigate difficult questions, compare methods, locate research gaps, and plan evidence-to-practice evaluation.",
    guidance: "Define the scientific or societal problem, the people and settings involved, competing hypotheses, and the evidence needed. DIS can structure a convergence research and implementation plan; no institution is represented as a partner without agreement.",
    examples: [
      "How could we design a multidisciplinary research and implementation study to reduce community health disparities?",
      "What would a defensible university-community research collaboration need to measure, validate, implement and sustain?"
    ]
  },
  {
    id: "software-technology",
    title: "Software & technology",
    description: "Investigate an existing system before deciding whether to repair, integrate, redesign, or build.",
    guidance: "Describe what people need the system to accomplish, what currently happens and where the gaps are. Evaluate existing code and tools before recommending changes.",
    examples: [
      "How should we diagnose this platform's problems before deciding to repair, integrate, or rebuild?",
      "What evidence and acceptance tests would demonstrate that a proposed software change really works?"
    ]
  },
  {
    id: "enterprise-leadership",
    title: "Enterprise & leadership",
    description: "Examine organizational capability, customers, employees, market forces, branding, and execution.",
    guidance: "Describe the organization's objective, stakeholders, constraints and operating environment. Investigate alternatives and define accountable measures before acting.",
    examples: [
      "How can our organization improve service delivery while measuring adoption, cost and sustainability?",
      "What are the strategic options and implementation risks of entering a new market?"
    ]
  },
  {
    id: "policy-community",
    title: "Policy & community",
    description: "Evaluate competing interests, second-order consequences, feasibility, equity, and public value.",
    guidance: "Describe the community question, who is affected, and who holds decision authority. Evaluate evidence and dissent without presenting simulations as real stakeholder views.",
    examples: [
      "How could we assess a community policy's benefits, costs, unintended effects and equitable outcomes?",
      "What do different affected groups need us to investigate before proposing a local intervention?"
    ]
  },
  {
    id: "everyday-learning",
    title: "Learning & everyday decisions",
    description: "Explore an unfamiliar topic with the depth and perspectives that fit the question.",
    guidance: "Start with your real question. DIS will help distinguish established facts, competing explanations, uncertainties and possible next steps.",
    examples: [
      "How can I compare three possible approaches to a difficult decision using reliable evidence?",
      "What should I investigate, measure and revisit while learning a new skill?"
    ]
  }
] as const;

export type ConsultationFocusId = (typeof CONSULTATION_FOCUS_AREAS)[number]["id"];
export type ConsultationFocusArea = (typeof CONSULTATION_FOCUS_AREAS)[number];

export function findConsultationFocus(id: string | null): ConsultationFocusArea | null {
  return CONSULTATION_FOCUS_AREAS.find(area => area.id === id) ?? null;
}

export function consultationFocusHref(id: ConsultationFocusId): string {
  return "/?focus=" + encodeURIComponent(id) + "#consult";
}
