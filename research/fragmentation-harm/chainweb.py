"""ChainWeb: hypothesis graph for downstream effects, not causal inference.

The graph documents testable links; no propagation is interpreted as observed
clinical benefit. Only evidence-supported, acyclic links may be prioritized.
"""
from __future__ import annotations
from collections import defaultdict, deque

STRENGTH = {"untested", "mechanistic", "observational", "experimental"}
REQUIRED = {"edge_id", "source", "target", "hypothesis", "evidence_strength",
            "evidence_refs", "measure", "owner", "harm_monitor"}

def validate_edges(edges):
    errors = []
    if not isinstance(edges, list):
        return ["edges must be list"]
    seen = set()
    adjacency = defaultdict(list)
    for i, e in enumerate(edges):
        p = f"edge[{i}]"
        if not isinstance(e, dict):
            errors.append(f"{p} invalid object")
            continue
        if REQUIRED - e.keys():
            errors.append(f"{p} missing {sorted(REQUIRED - e.keys())}")
            continue
        if e["edge_id"] in seen:
            errors.append(f"{p} duplicate edge_id")
        seen.add(e["edge_id"])
        if e["source"] == e["target"]:
            errors.append(f"{p} self loop")
        if e["evidence_strength"] not in STRENGTH:
            errors.append(f"{p} invalid evidence strength")
        if not all(isinstance(e[k], str) and e[k].strip()
                   for k in ("edge_id", "source", "target", "hypothesis",
                             "measure", "owner", "harm_monitor")):
            errors.append(f"{p} blank required field")
        if not isinstance(e["evidence_refs"], list) or not all(
            isinstance(v, str) and v.strip() for v in e["evidence_refs"]
        ):
            errors.append(f"{p} invalid evidence references")
        if e["evidence_strength"] != "untested" and not e["evidence_refs"]:
            errors.append(f"{p} supported edge missing references")
        adjacency[e["source"]].append(e["target"])
    nodes = set(adjacency)
    for children in adjacency.values():
        nodes.update(children)
    indegree = {n: 0 for n in nodes}
    for children in adjacency.values():
        for child in children:
            indegree[child] += 1
    q = deque(n for n in nodes if indegree[n] == 0)
    visited = 0
    while q:
        n = q.popleft()
        visited += 1
        for child in adjacency[n]:
            indegree[child] -= 1
            if indegree[child] == 0:
                q.append(child)
    if visited != len(nodes):
        errors.append("graph has a directed cycle; represent feedback in separate time slices")
    return errors

def downstream_hypotheses(edges, start):
    errors = validate_edges(edges)
    if errors:
        raise ValueError("; ".join(errors))
    adjacency = defaultdict(list)
    for e in edges:
        adjacency[e["source"]].append(e)
    q = deque([(start, 0)])
    best = {start: 0}
    results = []
    while q:
        node, depth = q.popleft()
        for e in adjacency[node]:
            nxt = e["target"]
            if nxt not in best or depth + 1 < best[nxt]:
                best[nxt] = depth + 1
                q.append((nxt, depth + 1))
            results.append({"edge_id": e["edge_id"], "from": node, "to": nxt,
                            "depth": depth + 1, "status": "hypothesis_only",
                            "evidence_strength": e["evidence_strength"],
                            "clinical_effect_estimated": False})
    return results
