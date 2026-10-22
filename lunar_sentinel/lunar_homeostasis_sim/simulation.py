"""LUNAR SENTINEL bounded NIAC Step A research simulation.
Not flight software, not certification evidence, not proof of 30-year safety.
"""
from __future__ import annotations
import json, hashlib, random, statistics, math
from dataclasses import dataclass, asdict
from pathlib import Path

DT=10; HOURS=96; STEPS=HOURS*60//DT
SCENARIOS=["S0_nominal","S1_14h","S1_72h","S2_node_loss","S4_cascade","S5_stress","S6_swap","S8_authority","S9_infeasible"]
CONTROLLERS=["B0_threshold_fdir","B1_trend_model","B2_safety_gate_no_evolution","P_mission_homeostasis"]

@dataclass
class State:
    t:int=0; energy:float=420; rover:float=95; temp:float=22; pressure:float=101; dose:float=0; dist:float=8
    dust:float=0; earth:bool=True; mesh:bool=True; isru:float=8; crit:float=5; thermal_eff:float=1; shelter:bool=True; actuator:bool=True

@dataclass
class Metrics:
    scenario:str; controller:str; seed:int; status:str="safe"; violations:int=0; violation_min:int=0; unassured_min:int=0
    warnings:int=0; first_warning:int|None=None; first_violation:int|None=None; warning_margin:int|None=None
    false_alarms:int=0; service_pct:float=100; stale_rejected:int=0; invalid_swap_rejected:bool=False; decisions:int=0; core_hash:str=""

def core_hash():
    return hashlib.sha256(Path(__file__).read_text().encode()).hexdigest()[:16]

class World:
    def __init__(self, scenario, seed):
        self.s=State(); self.scenario=scenario; self.r=random.Random(seed); self.actions=[]
    def events(self):
        t=self.s.t; sc=self.scenario
        ev=[]
        if sc=="S1_14h" and t==10*60: ev.append("earth14")
        if sc=="S1_14h" and t==(10+14)*60: ev.append("restore_earth")
        if sc in ("S1_72h","S2_node_loss") and t==10*60: ev.append("earth72")
        if sc in ("S1_72h","S2_node_loss") and t==(10+72)*60: ev.append("restore_earth")
        if sc=="S2_node_loss" and t==8*60: ev.append("node_loss")
        if sc in ("S4_cascade","S5_stress") and t==12*60: ev.append("dust")
        if sc in ("S4_cascade","S8_authority") and t==14*60: ev.append("thermal_degrade")
        if sc=="S5_stress" and t==10*60: ev.append("storm")
        if sc=="S5_stress" and t==11*60: ev.append("earth14")
        if sc=="S5_stress" and t==(11+14)*60: ev.append("restore_earth")
        if sc=="S5_stress" and t==14*60: ev.append("mesh_loss")
        if sc=="S6_swap" and t==10*60: ev.append("valid_swap")
        if sc=="S6_swap" and t==18*60: ev.append("invalid_swap")
        if sc=="S8_authority" and t==10*60: ev.append("crew_absent")
        if sc=="S8_authority" and t==13*60: ev.append("actuator_refusal")
        if sc=="S9_infeasible" and t==8*60: ev.append("low_energy")
        if sc=="S9_infeasible" and t==9*60: ev.append("no_shelter")
        if sc=="S9_infeasible" and t==12*60: ev.append("storm")
        return ev
    def apply_event(self, ev):
        s=self.s
        if ev in ("earth14","earth72"): s.earth=False
        elif ev=="restore_earth": s.earth=True
        elif ev=="dust": s.dust += 0.4+self.r.uniform(-.05,.05); s.thermal_eff=max(.42,s.thermal_eff-s.dust*.45)
        elif ev=="thermal_degrade": s.thermal_eff=max(.35,s.thermal_eff-.28)
        elif ev=="mesh_loss": s.mesh=False
        elif ev=="actuator_refusal": s.actuator=False
        elif ev=="low_energy": s.energy=42; s.rover=12
        elif ev=="no_shelter": s.shelter=False; s.dist=18
    def obs(self, seed, controller):
        r=random.Random(seed+self.s.t*13+len(controller))
        bias=-12 if self.scenario=="S7_common_cause" and self.s.t>=11*60 else 0
        v={"energy":self.s.energy+r.gauss(0,2),"rover":self.s.rover+r.gauss(0,1),"temp":self.s.temp+bias+r.gauss(0,.6),"pressure":self.s.pressure+r.gauss(0,.05),"dose":self.s.dose+r.gauss(0,.4),"dist":self.s.dist,"dust":max(0,self.s.dust+r.gauss(0,.02))}
        age={k:0 for k in v}; valid={k:True for k in v}
        if not self.s.earth: age["dust"]=max(0,self.s.t-10*60)
        if not self.s.mesh:
            age["rover"]=min(180,max(0,self.s.t-14*60)); age["dist"]=age["rover"]
        if self.scenario=="S6_swap" and self.s.t>=18*60: valid["dose"]=False
        if self.scenario=="S9_infeasible": valid["dist"]=self.s.shelter
        return v,age,valid
    def step(self, action=None):
        s=self.s
        for ev in self.events(): self.apply_event(ev)
        if action and s.actuator:
            if action in ("shed_isru","thermal_safe_mode"): s.isru=0
            if action=="thermal_safe_mode": s.crit=max(4,s.crit-.8)
            if action=="rover_return":
                move=min(s.dist,1.2); s.dist-=move; s.rover-=move*2.2
            if action=="shelter_in_place": s.rover-=.1
            self.actions.append(action)
        elif action=="declare_unassured": self.actions.append(action)
        solar=.8 if (s.t//60)%24 in range(8,20) else .2
        gen=max(0,12*solar*(1-.55*s.dust))*(.25 if self.scenario=="S9_infeasible" else 1)
        load=s.crit+s.isru
        s.energy=max(-20,min(500,s.energy+(gen-load)*DT/60))
        s.temp += ((.08*load+.25*s.dust)-(.18*s.thermal_eff*max(0,s.temp-18)))*DT/10
        if s.energy<15: s.pressure-=.015*DT
        if self.scenario in ("S5_stress","S9_infeasible") and 10*60<=s.t<=16*60:
            s.dose += 25*math.exp(-((s.t-13*60)/120)**2)*DT/60
        if s.dist>0: s.rover-=.05*DT/60
        s.t+=DT

def violation(s):
    return s.energy<0 or s.temp>90 or s.pressure<92 or s.dose>250 or s.rover<-2

def decide(ctrl,v,age,valid,metrics):
    action=None; predicted=False
    if ctrl=="B0_threshold_fdir":
        if v["temp"]>78 or v["energy"]<24: action="thermal_safe_mode"
        elif v["rover"] < v["dist"]*2+5: action="rover_return"
        predicted=bool(action)
    elif ctrl in ("B1_trend_model","B2_safety_gate_no_evolution"):
        predicted_temp=v["temp"]+.25*v["dust"]*18
        if predicted_temp>74 or v["energy"]<45: action="shed_isru"
        if v["temp"]>82 or v["pressure"]<93.5: action="thermal_safe_mode"
        predicted=bool(action)
    else:
        stale=any(a>120 for a in age.values()); invalid=not all(valid.values())
        rover_need=v["dist"]*2.2+8; energy_valid=v["energy"]>20 and v["rover"]>0; reach=v["rover"]>=rover_need
        forecast=v["temp"]+.35*v["dust"]*24+(8 if v["energy"]<60 else 0)
        if invalid:
            metrics.invalid_swap_rejected=True; action="isolate_bad_instrument"
        elif not energy_valid or not reach:
            metrics.unassured_min+=DT; action="declare_unassured"
        elif v["temp"]>80 or v["pressure"]<94: action="thermal_safe_mode"
        elif forecast>68 or (v["energy"]<75 and v["dust"]>.15): action="shed_isru"
        elif v["dose"]>40 or age.get("rover",0)>60: action="rover_return" if reach else "shelter_in_place"
        if age.get("rover",0)>120 and action=="rover_return": metrics.stale_rejected+=1; action="shelter_in_place"
        predicted=bool(action)
    return action,predicted

def run_once(sc,ctrl,seed):
    w=World(sc,seed); m=Metrics(sc,ctrl,seed,core_hash=core_hash())
    warning=False
    for _ in range(STEPS):
        v,age,valid=w.obs(seed,ctrl); action,pred=decide(ctrl,v,age,valid,m)
        if pred and not warning:
            m.warnings+=1; m.first_warning=m.first_warning or w.s.t
        warning=pred
        if action: m.decisions+=1
        if sc=="S0_nominal" and action: m.false_alarms+=1
        w.step(action)
        if violation(w.s):
            m.violations+=1; m.violation_min+=DT; m.first_violation=m.first_violation or w.s.t
    if m.violations: m.status="violation"
    elif m.unassured_min: m.status="unassured"
    elif w.s.isru==0 or not w.s.earth or not w.s.mesh: m.status="controlled_degraded"
    if m.first_warning is not None and m.first_violation is not None: m.warning_margin=m.first_violation-m.first_warning
    service=100-min(40,max(0,(420-w.s.energy)/10))-(18 if w.s.isru==0 else 0)-(8 if not w.s.mesh else 0)-(30 if m.violations else 0)-(10 if m.status=="unassured" else 0)
    m.service_pct=round(max(0,service),2)
    return m

def summarize(rows):
    out={}
    for sc in SCENARIOS:
      for ctrl in CONTROLLERS:
        r=[x for x in rows if x.scenario==sc and x.controller==ctrl]
        margins=[x.warning_margin for x in r if x.warning_margin is not None]
        out[f"{sc}|{ctrl}"]={"runs":len(r),"status_counts":{s:sum(x.status==s for x in r) for s in ["safe","controlled_degraded","unassured","violation"]},"mean_service_retained_pct":round(statistics.mean(x.service_pct for x in r),2),"total_envelope_violations":sum(x.violations for x in r),"total_unassured_minutes":sum(x.unassured_min for x in r),"false_alarm_events":sum(x.false_alarms for x in r),"warning_margin_min_median":statistics.median(margins) if margins else None,"invalid_swap_rejected_runs":sum(x.invalid_swap_rejected for x in r),"stale_commands_rejected":sum(x.stale_rejected for x in r)}
    return out

def svg_arch(path):
    path.write_text('''<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="820"><style>text{font-family:Arial}.t{font-size:34px;font-weight:bold}.h{font-size:22px;font-weight:bold}.b{font-size:16px}.box{fill:white;stroke:black;stroke-width:2}.soft{fill:#eef6ff;stroke:#245;stroke-width:2}.safe{fill:#fff3e6;stroke:#963;stroke-width:2}.bad{fill:#fcebea;stroke:#933;stroke-width:2}.ok{fill:#e9f7ef;stroke:#274;stroke-width:2}</style><text x="45" y="55" class="t">LUNAR SENTINEL: Mission Homeostasis</text><text x="45" y="90" class="b">Bounded NIAC Step A research demonstrator — not flight software or safety proof</text><rect x="50" y="130" width="260" height="115" class="box"/><text x="75" y="165" class="h">Lunar Basecamp</text><text x="75" y="198" class="b">Habitat • power • ISRU • rover • relay</text><rect x="370" y="130" width="270" height="115" class="soft"/><text x="395" y="165" class="h">Swappable Evidence</text><text x="395" y="198" class="b">Data age • uncertainty • validity</text><rect x="700" y="130" width="285" height="115" class="safe"/><text x="725" y="165" class="h">Path A: Local Protection</text><text x="725" y="198" class="b">Preauthorized safing, no Earth dependency</text><rect x="1045" y="130" width="285" height="115" class="ok"/><text x="1070" y="165" class="h">Bounded Action</text><text x="1070" y="198" class="b">T0 auto / T1-T2 human authority</text><rect x="370" y="325" width="270" height="115" class="soft"/><text x="395" y="360" class="h">Cascade Forecast</text><text x="395" y="393" class="b">Advisory only; no actuator command</text><rect x="700" y="325" width="285" height="115" class="safe"/><text x="725" y="360" class="h">Mission Contract Gate</text><text x="725" y="393" class="b">Assumptions • authority • deadlines</text><rect x="1045" y="325" width="285" height="115" class="bad"/><text x="1070" y="360" class="h">Unassured State</text><text x="1070" y="393" class="b">Declare limits; do not fabricate safety</text><rect x="370" y="530" width="615" height="125" class="box"/><text x="395" y="565" class="h">Provenance-Bound Decision Ledger</text><text x="395" y="598" class="b">Records what was known, data age, assumptions, authority, action, and outcome.</text><text x="50" y="735" class="b">Novelty focus: whether the safety claim remains valid as evidence, communications, authority, and configurations change.</text></svg>''')

def svg_results(path,summary):
    ctrls=CONTROLLERS; vals=[summary.get(f"S5_stress|{c}",{}).get("mean_service_retained_pct",0) for c in ctrls]
    bars=[]; x=120
    for c,v in zip(ctrls,vals):
      h=int(360*v/100); bars.append(f'<rect x="{x}" y="{520-h}" width="160" height="{h}" fill="#dbeafe" stroke="#1e3a8a"/><text x="{x}" y="550" font-size="13" transform="rotate(22 {x},550)">{c}</text><text x="{x+45}" y="{500-h}" font-size="18">{v:.1f}%</text>'); x+=240
    path.write_text(f'''<svg xmlns="http://www.w3.org/2000/svg" width="1250" height="700"><style>text{{font-family:Arial}}</style><text x="50" y="55" font-size="30" font-weight="bold">Toy Simulation Tradeoff — S5 Compound Stress Case</text><text x="50" y="90" font-size="18">Mean service retained by controller; bounded simulation estimate, not flight evidence.</text><line x1="90" y1="520" x2="1120" y2="520" stroke="black"/><line x1="90" y1="160" x2="90" y2="520" stroke="black"/>{''.join(bars)}<text x="50" y="635" font-size="14">Use only with violation, false-alarm, unassured-state, and baseline-parity tables.</text></svg>''')

def main(outdir="results", seeds=12):
    out=Path(outdir); out.mkdir(parents=True,exist_ok=True)
    rows=[run_once(sc,ctrl,seed) for sc in SCENARIOS for ctrl in CONTROLLERS for seed in range(seeds)]
    summ=summarize(rows)
    manifest={"project":"LUNAR SENTINEL / Mission Homeostasis bounded NIAC Step A simulation","claim_boundary":"Toy-model simulation estimate within declared fault domain; not flight software, certification evidence, or 30-year safety proof.","dt_min":DT,"run_hours":HOURS,"seeds_per_cell":seeds,"core_hash":core_hash(),"controllers":CONTROLLERS,"scenarios":SCENARIOS,"summary":summ,"runs":[asdict(x) for x in rows]}
    (out/"results_manifest.json").write_text(json.dumps(manifest,indent=2))
    lines=["# LUNAR SENTINEL Bounded Simulation Results","","**Claim boundary:** Toy-model simulation estimate within declared fault domain; not flight software, certification evidence, or 30-year safety proof.","",f"Core hash: `{core_hash()}`","","| Scenario | Controller | Runs | Status counts | Mean service retained | Violations | Unassured min | Median warning margin |","|---|---|---:|---|---:|---:|---:|---:|"]
    for key,val in summ.items():
        sc,ctrl=key.split("|"); lines.append(f"| {sc} | {ctrl} | {val['runs']} | {val['status_counts']} | {val['mean_service_retained_pct']} | {val['total_envelope_violations']} | {val['total_unassured_minutes']} | {val['warning_margin_min_median']} |")
    (out/"results_summary.md").write_text("\n".join(lines))
    svg_arch(out/"niac_overview_architecture.svg"); svg_results(out/"niac_service_tradeoff.svg",summ)
    print(json.dumps({"ok":True,"runs":len(rows),"core_hash":core_hash(),"outdir":str(out)},indent=2))
if __name__=="__main__":
    import sys
    main(sys.argv[1] if len(sys.argv)>1 else "results", int(sys.argv[2]) if len(sys.argv)>2 else 12)
