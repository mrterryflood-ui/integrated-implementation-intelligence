/** Synthetic research vignettes, transcribed into structured evidence packets.
 * These examples are not live events, clinical observations, or ground truth.
 */
import type {DecisionPacket,EvidenceObservation} from "./decision-assurance";
const when="2026-11-05T09:05:00Z";
const observation=(id:string,label:string,origin:string,construct:string,unit:string,scope:string,observedAt="2026-11-05T09:00:00Z",receivedAt="2026-11-05T09:01:00Z",validated=false):EvidenceObservation=>({
  id,label,origin,construct,unit,scope,observedAt,receivedAt,kind:"SOURCE_REPORTED",validated
});
const packet=(id:string,title:string,question:string,observations:EvidenceObservation[]):DecisionPacket=>({
  id,title,question,goal:"Decide what the evidence legitimately supports and which information or authority is missing.",asOf:when,observations
});
export const SYNTHETIC_CASES:readonly DecisionPacket[]=[
  {
    ...packet("F01","Two timestamps, two stations","May an old upstream message be labeled the current downstream water level?",[
      observation("up","Upstream gauge 3.8 m","upstream-gauge","water-level","m","upstream","2026-11-05T08:35:00Z","2026-11-05T09:01:00Z"),
      observation("down","Downstream gauge 2.9 m","downstream-gauge","water-level","m","downstream")
    ]),
    comparison:{ids:["up"],intent:"LATEST_CLAIM",claimedScope:"downstream"}
  },
  {
    ...packet("F02","Three dashboards, one origin","Are three dashboards copying S17 three independent confirmations?",[
      observation("a","Agency A pump alarm","sensor-S17","pump-signal","category","municipal-pump"),
      observation("b","Regional B pump alarm","sensor-S17","pump-signal","category","municipal-pump"),
      observation("c","Aggregator C pump alarm","sensor-S17","pump-signal","category","municipal-pump")
    ]),
    comparison:{ids:["a","b","c"],intent:"CORROBORATE",claimedIndependent:true}
  },
  {
    ...packet("F03","Different constructs and incompatible units","Can rainfall, road depth and an unlocated photograph be averaged into a certainty score?",[
      observation("rain","Rainfall intensity 21 mm/h","rain-sensor","rainfall-intensity","mm/h","Basin A"),
      observation("depth","Street depth 12 cm","depth-sensor","surface-water-depth","cm","Basin A"),
      observation("photo","Resident photo from earlier","resident-photo","visual-observation","image","unknown","2026-11-05T08:20:00Z","2026-11-05T08:24:00Z")
    ]),
    comparison:{ids:["rain","depth","photo"],intent:"POOL"}
  },
  {
    ...packet("F04","Different geographic footprints","Does a rainfall reading in Basin East prove conditions at closures in Basin West?",[
      observation("east","Rainfall layer, Basin East","east-rain","rainfall-total","mm","Basin East"),
      observation("west","Closures, Basin West","west-service","service-closure","count","Basin West")
    ]),
    comparison:{ids:["east","west"],intent:"TRANSFER"}
  },
  {
    ...packet("F05","An indicator arrives after the decision window","Does a 24–36 hour modeled warning support an action needing 48 hours?",[
      observation("risk","Modeled water-system service indicator","modeled-service","service-threshold","index","public-water-system")
    ]),
    decision:{implementationHours:48,warningHoursMin:24,warningHoursMax:36}
  },
  {
    ...packet("F06","The warning changed the traffic metric","Does a change in vehicle count prove the physical hazard decreased?",[
      observation("before","Vehicle entries before advice: 1000/h","traffic-counter","vehicle-entries","vehicles/hour","monitored-area","2026-11-05T08:20:00Z","2026-11-05T08:21:00Z"),
      observation("after","Vehicle entries after advice: 300/h","traffic-counter","vehicle-entries","vehicles/hour","monitored-area")
    ]),
    outcome:{processMetricAsOutcome:true,interventionChangedIndicator:true,physicalOutcomeVerified:false,beneficiaryOutcomeMeasured:false}
  },
  {
    ...packet("L01","The denominator changed","Did 60/100 then 60/80 prove outreach improvement after eligibility changed?",[
      observation("y1","Year 1: served 60 / eligible 100","service-register-y1","service-coverage","percent","eligible-year-1","2026-11-03T09:00:00Z","2026-11-03T10:00:00Z"),
      observation("y2","Year 2: served 60 / eligible 80","service-register-y2","service-coverage","percent","eligible-year-2")
    ]),
    outcome:{denominatorDefinitionChanged:true}
  },
  {
    ...packet("L02","The success milestone hides sustainment risk","Does 90% training completion establish sustainable program delivery?",[
      observation("training","90% training completion reported","training-record","training-completion","percent","workforce-program")
    ]),
    stewardship:{milestoneReached:true,accountableOwner:"",sustainedResources:false,fidelityPlan:false}
  },
  {
    ...packet("L03","Uptake rises after changing a core function","Does higher enrollment establish benefit after removal of core follow-up?",[
      observation("earlier","Enrollment 50/quarter","intake-register","enrollment","people/quarter","program","2026-11-03T09:00:00Z","2026-11-03T10:00:00Z"),
      observation("later","Enrollment 75/quarter","intake-register","enrollment","people/quarter","program")
    ]),
    outcome:{coreFunctionRemoved:true,beneficiaryOutcomeMeasured:false,processMetricAsOutcome:true}
  },
  {
    ...packet("L04","The incentive changes the report","Does a rise in rewarded referrals prove improved service outcomes?",[
      observation("referrals","Referrals increased 70 to 120","provider-dashboard","referrals","count","service-system"),
      observation("completions","Completed services decreased 65 to 60","provider-record","services-completed","count","service-system")
    ]),
    outcome:{metricTargetIncentive:true,codingRulesChanged:true,processMetricAsOutcome:true,beneficiaryOutcomeMeasured:false}
  },
  {
    ...packet("L05","The objective itself may be obsolete","Should in-person volume remain the objective after secure remote access becomes possible?",[
      observation("preference","Service-user preferences favor remote access","survey","channel-preference","reported","service-program")
    ]),
    objective:{contextChanged:true,stakeholderPreferencesChanged:true,reviewed:false}
  },
  {
    ...packet("L06","Is more research always valuable?","Does a spreadsheet justify a $150,000 information value without model inputs?",[
      observation("options","$50,000 survey and $10,000 reversible pilot proposed","committee-brief","decision-alternatives","reported","service-program")
    ]),
    informationValue:{claimedNumber:150000,alternativesSpecified:true,utilitiesSpecified:false,uncertaintySpecified:false,studyDesignSpecified:false,delayCostSpecified:false}
  }
];
