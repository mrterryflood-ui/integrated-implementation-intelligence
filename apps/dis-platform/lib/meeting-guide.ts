import type {PlanningReport,SectionId} from './planning-fields';
import {implementationReviewQuestions} from './implementation-science';
export const DECISION_REVIEW = [
 {field:'question',question:'What exact decision is being requested, and who has authority to make it?'},
 {field:'outcomes',question:'What should change for the people affected, and how would we recognize success?'},
 {field:'evidence',question:'Which sources support the proposal, and which claims still need verification?'},
 {field:'options',question:'What alternatives, including keeping the current approach, did we consider?'},
 {field:'recommendation',question:'What is the proposed choice, and why is it preferable under our constraints?'},
 {field:'resources',question:'Who will supply the time, people, money, and other resources required?'},
 {field:'dissent',question:'Whose perspective is missing, and what disagreements could change the decision?'},
 {field:'questions',question:'What would cause us to pause, investigate, adapt, or stop?'},
] as const;
export function supplied(value:unknown){return typeof value==='string'&&value.trim().length>0&&!/^(UNKNOWN|NOT SUPPLIED|\[.*\])$/i.test(value.trim());}
export function decisionQuestions(report:PlanningReport){
 const basic=DECISION_REVIEW.map(item=>({...item,recorded:supplied(report.sections[item.field as SectionId])}));
 return{basic,implementation:implementationReviewQuestions(report.implementationScience),qualification:'A recorded response is input for human review, not proof of readiness or authority to vote.'};
}
export const ANALYSIS_STARTERS=[
 {name:'Gap analysis',prompt:'Compare the intended, operational, and experienced situation. Which gaps are supported by the selected evidence, and what could explain them?'},
 {name:'Environment and PESTLE',prompt:'What political, economic, social, technological, legal, and environmental factors in the selected evidence could change this decision? Identify missing context and affected groups.'},
 {name:'Funding and resources',prompt:'What does the evidence establish about funding, eligibility, full costs, staffing, and sustainment? Which requirements and assumptions still need verification?'},
 {name:'Competitive alternatives',prompt:'What credible alternatives or competing approaches are documented? Compare their fit, constraints, costs, evidence, and consequences of delaying the decision.'},
 {name:'Partners and MAGNET',prompt:'Which reciprocal partner needs and capabilities are supported by the evidence? Distinguish a possible match from verified capacity, agreement, or delivery commitment.'},
 {name:'Implementation fit',prompt:'Does the proposed approach fit this setting and the people expected to use it? Examine determinants, adoption strategies, delivery, fidelity and adaptation, implementation outcomes, beneficiary outcomes, and sustainment.'},
] as const;
