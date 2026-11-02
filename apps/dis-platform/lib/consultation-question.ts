import type {Intake} from './consultation';
/** Keep the mission prefix for the ecosystem context guard; preserve local scope for public-source routing. */
export function consultationCouncilQuestion(intake:Intake):string{
 const question=[intake.mission,intake.geography?'Geography: '+intake.geography:'',intake.audience,intake.organization,intake.stage,intake.alternatives,intake.traction,intake.desiredOutcome].filter(Boolean).join('\n');
 if(question.length>3000)throw Error('The council question exceeds 3,000 characters. Shorten the consultation context; no geography or evidence was silently discarded.');
 return question;
}
