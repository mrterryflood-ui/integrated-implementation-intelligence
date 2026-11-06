# LUNAR SENTINEL Bounded Simulation Results

**Claim boundary:** Toy-model simulation estimate within declared fault domain; not flight software, certification evidence, or 30-year safety proof.

Core hash: `5a5fa5d649089aaa`

| Scenario | Controller | Runs | Status counts | Mean service retained | Violations | Unassured min | Median warning margin |
|---|---|---:|---|---:|---:|---:|---:|
| S0_nominal | B0_threshold_fdir | 12 | {'safe': 0, 'controlled_degraded': 12, 'unassured': 0, 'violation': 0} | 52.81 | 0 | 0 | None |
| S0_nominal | B1_trend_model | 12 | {'safe': 0, 'controlled_degraded': 12, 'unassured': 0, 'violation': 0} | 50.27 | 0 | 0 | None |
| S0_nominal | B2_safety_gate_no_evolution | 12 | {'safe': 0, 'controlled_degraded': 12, 'unassured': 0, 'violation': 0} | 50.29 | 0 | 0 | None |
| S0_nominal | P_mission_homeostasis | 12 | {'safe': 0, 'controlled_degraded': 12, 'unassured': 0, 'violation': 0} | 55.18 | 0 | 0 | None |
| S1_14h | B0_threshold_fdir | 12 | {'safe': 0, 'controlled_degraded': 12, 'unassured': 0, 'violation': 0} | 52.81 | 0 | 0 | None |
| S1_14h | B1_trend_model | 12 | {'safe': 0, 'controlled_degraded': 12, 'unassured': 0, 'violation': 0} | 50.27 | 0 | 0 | None |
| S1_14h | B2_safety_gate_no_evolution | 12 | {'safe': 0, 'controlled_degraded': 12, 'unassured': 0, 'violation': 0} | 50.29 | 0 | 0 | None |
| S1_14h | P_mission_homeostasis | 12 | {'safe': 0, 'controlled_degraded': 12, 'unassured': 0, 'violation': 0} | 55.18 | 0 | 0 | None |
| S1_72h | B0_threshold_fdir | 12 | {'safe': 0, 'controlled_degraded': 12, 'unassured': 0, 'violation': 0} | 52.81 | 0 | 0 | None |
| S1_72h | B1_trend_model | 12 | {'safe': 0, 'controlled_degraded': 12, 'unassured': 0, 'violation': 0} | 50.27 | 0 | 0 | None |
| S1_72h | B2_safety_gate_no_evolution | 12 | {'safe': 0, 'controlled_degraded': 12, 'unassured': 0, 'violation': 0} | 50.29 | 0 | 0 | None |
| S1_72h | P_mission_homeostasis | 12 | {'safe': 0, 'controlled_degraded': 12, 'unassured': 0, 'violation': 0} | 55.18 | 0 | 0 | None |
| S2_node_loss | B0_threshold_fdir | 12 | {'safe': 0, 'controlled_degraded': 12, 'unassured': 0, 'violation': 0} | 52.81 | 0 | 0 | None |
| S2_node_loss | B1_trend_model | 12 | {'safe': 0, 'controlled_degraded': 12, 'unassured': 0, 'violation': 0} | 50.27 | 0 | 0 | None |
| S2_node_loss | B2_safety_gate_no_evolution | 12 | {'safe': 0, 'controlled_degraded': 12, 'unassured': 0, 'violation': 0} | 50.29 | 0 | 0 | None |
| S2_node_loss | P_mission_homeostasis | 12 | {'safe': 0, 'controlled_degraded': 12, 'unassured': 0, 'violation': 0} | 55.18 | 0 | 0 | None |
| S4_cascade | B0_threshold_fdir | 12 | {'safe': 0, 'controlled_degraded': 12, 'unassured': 0, 'violation': 0} | 45.75 | 0 | 0 | None |
| S4_cascade | B1_trend_model | 12 | {'safe': 0, 'controlled_degraded': 11, 'unassured': 0, 'violation': 1} | 40.34 | 74 | 0 | 2230 |
| S4_cascade | B2_safety_gate_no_evolution | 12 | {'safe': 0, 'controlled_degraded': 12, 'unassured': 0, 'violation': 0} | 42.77 | 0 | 0 | None |
| S4_cascade | P_mission_homeostasis | 12 | {'safe': 0, 'controlled_degraded': 12, 'unassured': 0, 'violation': 0} | 49.73 | 0 | 0 | None |
| S5_stress | B0_threshold_fdir | 12 | {'safe': 0, 'controlled_degraded': 12, 'unassured': 0, 'violation': 0} | 37.75 | 0 | 0 | None |
| S5_stress | B1_trend_model | 12 | {'safe': 0, 'controlled_degraded': 11, 'unassured': 0, 'violation': 1} | 32.34 | 74 | 0 | 2230 |
| S5_stress | B2_safety_gate_no_evolution | 12 | {'safe': 0, 'controlled_degraded': 12, 'unassured': 0, 'violation': 0} | 34.77 | 0 | 0 | None |
| S5_stress | P_mission_homeostasis | 12 | {'safe': 0, 'controlled_degraded': 12, 'unassured': 0, 'violation': 0} | 41.73 | 0 | 0 | None |
| S6_swap | B0_threshold_fdir | 12 | {'safe': 0, 'controlled_degraded': 12, 'unassured': 0, 'violation': 0} | 52.81 | 0 | 0 | None |
| S6_swap | B1_trend_model | 12 | {'safe': 0, 'controlled_degraded': 12, 'unassured': 0, 'violation': 0} | 50.27 | 0 | 0 | None |
| S6_swap | B2_safety_gate_no_evolution | 12 | {'safe': 0, 'controlled_degraded': 12, 'unassured': 0, 'violation': 0} | 50.29 | 0 | 0 | None |
| S6_swap | P_mission_homeostasis | 12 | {'safe': 0, 'controlled_degraded': 12, 'unassured': 0, 'violation': 0} | 60.22 | 0 | 0 | None |
| S8_authority | B0_threshold_fdir | 12 | {'safe': 0, 'controlled_degraded': 0, 'unassured': 0, 'violation': 12} | 30 | 2892 | 0 | 140.0 |
| S8_authority | B1_trend_model | 12 | {'safe': 0, 'controlled_degraded': 0, 'unassured': 0, 'violation': 12} | 30 | 2892 | 0 | 260.0 |
| S8_authority | B2_safety_gate_no_evolution | 12 | {'safe': 0, 'controlled_degraded': 0, 'unassured': 0, 'violation': 12} | 30 | 2892 | 0 | 260.0 |
| S8_authority | P_mission_homeostasis | 12 | {'safe': 0, 'controlled_degraded': 0, 'unassured': 0, 'violation': 12} | 30 | 2892 | 30180 | 630.0 |
| S9_infeasible | B0_threshold_fdir | 12 | {'safe': 0, 'controlled_degraded': 0, 'unassured': 0, 'violation': 12} | 12 | 6264 | 0 | 60.0 |
| S9_infeasible | B1_trend_model | 12 | {'safe': 0, 'controlled_degraded': 0, 'unassured': 0, 'violation': 12} | 12 | 5328 | 0 | 840.0 |
| S9_infeasible | B2_safety_gate_no_evolution | 12 | {'safe': 0, 'controlled_degraded': 0, 'unassured': 0, 'violation': 12} | 12 | 5328 | 0 | 840.0 |
| S9_infeasible | P_mission_homeostasis | 12 | {'safe': 0, 'controlled_degraded': 0, 'unassured': 0, 'violation': 12} | 12 | 5028 | 720 | 1090.0 |
