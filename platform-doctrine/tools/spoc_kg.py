#!/usr/bin/env python3
"""
spoc_kg.py — Evidence-bound knowledge-graph population (SPOC quads) for all projects.

Adapted from "Automating Knowledge Graph Population: Extracting Entities and Triples from
Unstructured Text with an LLM" (Iván Palomares Carrascosa, MachineLearningMastery.com,
2026-09-29). That article extracts (Subject, Predicate, Object, Context) quads with a local LLM
(Ollama, llama3.2, JSON mode, few-shot prompt) and loads them into a QuadStore for Graph-RAG.

What this version adds (Integrated Implementation Intelligence evidence discipline):
  1. Evidence binding: every fact must carry a verbatim quote from the source. A fact whose
     quote is not found in the source text is REJECTED, not stored. This stops the LLM from
     inventing facts.
  2. Structured context: C = source_id. A provenance table records the URL, title, published
     date, retrieval date, tier (REGISTER, OFFICIAL-DAILY, OFFICIAL-ANNUAL,
     HEALTH-SURVEILLANCE, NEWS-REPORTED, RESEARCH, MODEL) and the extractor model.
  3. Controlled predicates per domain profile. Predicates outside the vocabulary are kept, but
     flagged `predicate_status=unmapped` for human review.
  4. Entity canonicalization through an alias map, so "CPD" and "Chicago Police Department"
     become one node.
  5. Qualifiers: time, place and measure units are kept alongside each fact.
  6. Conflict detection: the same (subject, predicate, qualifier) with different objects
     across contexts is surfaced, never silently resolved.
  7. Persistent SQLite store (or in-memory), with query and export to JSONL/CSV.
  8. Pluggable LLM backend: `ollama` (free and local, as in the article), `openai` (any
     OpenAI-compatible endpoint), or `pplx` (Perplexity Computer sandbox).

Usage:
  python spoc_kg.py ingest --db kg.sqlite --url https://... --tier NEWS-REPORTED --profile violence
  python spoc_kg.py ingest --db kg.sqlite --file notes.txt --source-id memo-2026-09-29 --tier RESEARCH
  python spoc_kg.py query  --db kg.sqlite --subject "Wilmington, NC"
  python spoc_kg.py conflicts --db kg.sqlite
  python spoc_kg.py export --db kg.sqlite --out quads.jsonl
"""
from __future__ import annotations
import argparse, csv, datetime as dt, hashlib, json, os, re, sqlite3, sys, unicodedata

TIERS = ["REGISTER", "OFFICIAL-DAILY", "OFFICIAL-ANNUAL", "HEALTH-SURVEILLANCE",
         "NEWS-REPORTED", "RESEARCH", "MODEL", "INTERNAL"]

# Domain profiles: controlled predicate vocabularies. Extend per project; keep them small.
PROFILES = {
    "generic": ["is_a", "part_of", "located_in", "founded_on", "leads", "member_of", "funds",
                "partners_with", "produces", "requires", "causes", "reports", "measures",
                "has_value", "effective_on", "applies_to", "eligible_for", "deadline_on"],
    "violence": ["reported_homicides", "reported_gun_homicides", "reported_nonfatal_shootings",
                 "enacted_law", "law_effective_on", "law_type", "petitioners_allowed",
                 "covers_period", "covers_geography", "published_by", "finds_effect",
                 "effect_size", "located_in", "demolished_on", "program_operates_in",
                 "funded_by", "cross_checks_with"],
    "dataset": ["covers_period", "covers_geography", "has_column", "column_values", "excludes",
                "refresh_frequency", "access_method", "published_by", "requires_key", "row_grain",
                "update_lag", "file_format", "record_count", "known_limitation"],
    "grants": ["offered_by", "deadline_on", "award_ceiling", "award_floor", "eligible_applicant",
               "ineligible_applicant", "match_required", "funds_activity", "cfda_aln",
               "requires_partner", "applies_to_geography", "program_officer"],
    "hazard": ["affects", "occurred_on", "located_in", "magnitude", "issued_by", "alert_level",
               "observed_by", "modeled_by", "evacuation_ordered", "casualties_reported"],
    "workforce": ["teaches_skill", "certifies", "offered_by", "aligned_to_standard",
                  "employs", "requires_skill", "located_in", "partners_with", "funded_by"],
    "early_childhood": ["serves_ages", "enrollment", "funded_by", "located_in", "licensed_by",
                        "meets_standard", "operates_program", "capacity"],
}

# Predicate constraints: object type + allowed units. "functional" = one true value per
# (subject, predicate, time, place); disagreement across sources becomes a conflict.
CONSTRAINTS = {
    "law_effective_on": {"type": "date", "functional": True},
    "effective_on": {"type": "date", "functional": True},
    "deadline_on": {"type": "date", "functional": True},
    "founded_on": {"type": "date", "functional": True},
    "occurred_on": {"type": "date", "functional": True},
    "demolished_on": {"type": "date", "functional": True},
    "reported_homicides": {"type": "count", "units": ["victims", "homicides", "murders", "deaths", ""], "functional": True},
    "reported_gun_homicides": {"type": "count", "units": ["victims", "homicides", "murders", "deaths", ""], "functional": True},
    "reported_nonfatal_shootings": {"type": "count", "units": ["victims", "shootings", "injuries", ""], "functional": True},
    "award_ceiling": {"type": "money", "functional": True},
    "award_floor": {"type": "money", "functional": True},
    "enrollment": {"type": "count", "functional": True},
    "capacity": {"type": "count", "functional": True},
}


def check_constraint(pred: str, obj: str, quals: dict) -> str | None:
    c = CONSTRAINTS.get(pred)
    if not c:
        return None
    o = (obj or "").strip()
    if c["type"] == "date" and not re.fullmatch(r"\d{4}(-\d{2}(-\d{2})?)?", o):
        return f"{pred} needs a YYYY[-MM[-DD]] date, got {o!r}"
    if c["type"] == "count":
        if not re.fullmatch(r"[\d,]+", o):
            return f"{pred} needs a bare count, got {o!r}"
        unit = norm(quals.get("unit", ""))
        if "units" in c and unit not in c["units"]:
            return f"{pred} unit {unit!r} not in {c['units']}"
    if c["type"] == "money" and not re.search(r"\d", o):
        return f"{pred} needs an amount, got {o!r}"
    return None


FEW_SHOT = {
    "facts": [
        {"subject": "Wilmington Police Department", "predicate": "reported_homicides",
         "object": "21", "qualifiers": {"time": "2020", "place": "Wilmington, NC", "unit": "victims"},
         "evidence": "the city recorded 21 homicides in 2020", "confidence": 0.9},
        {"subject": "Colorado", "predicate": "law_effective_on", "object": "2020-01-01",
         "qualifiers": {"law": "Extreme Risk Protection Order"},
         "evidence": "Colorado's extreme risk law took effect January 1, 2020", "confidence": 0.95},
    ]
}

PROMPT = """You are an exacting data-extraction algorithm. Extract ATOMIC facts from the text.
Rules:
- Output ONE JSON object with a single key "facts" (an array).
- Each fact: subject, predicate, object, qualifiers (object; time/place/unit/other when stated),
  evidence (a VERBATIM substring copied exactly from the text that states the fact),
  confidence (0-1).
- Prefer these predicates: {predicates}. If none fits, use a short snake_case predicate.
- Use full proper names for entities. Numbers stay as written digits. Dates as YYYY-MM-DD when exact.
- Extract only what the text states. No outside knowledge, no inference, no opinions.
- If the text states nothing factual, return {{"facts": []}}.
Example output:
{example}
Text:
<<<
{text}
>>>"""

SCHEMA = {
    "type": "object",
    "properties": {"facts": {"type": "array", "items": {"type": "object", "properties": {
        "subject": {"type": "string"}, "predicate": {"type": "string"}, "object": {"type": "string"},
        "qualifiers": {"type": "object", "properties": {
            "time": {"type": "string"}, "place": {"type": "string"},
            "unit": {"type": "string"}, "other": {"type": "string"}}},
        "evidence": {"type": "string"}, "confidence": {"type": "number"}},
        "required": ["subject", "predicate", "object", "evidence"]}}},
    "required": ["facts"],
}


# ---------------------------------------------------------------- LLM backends
def llm_json(prompt: str, backend: str, model: str | None) -> dict:
    if backend == "ollama":  # the article's free local path
        import requests
        r = requests.post(os.environ.get("OLLAMA_URL", "http://localhost:11434") + "/api/generate",
                          json={"model": model or "llama3.2", "prompt": prompt, "format": "json",
                                "stream": False, "options": {"temperature": 0}}, timeout=600)
        r.raise_for_status()
        return json.loads(r.json()["response"])
    if backend == "openai":  # any OpenAI-compatible endpoint
        import requests
        base = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")
        r = requests.post(base + "/chat/completions", timeout=600,
                          headers={"Authorization": "Bearer " + os.environ["OPENAI_API_KEY"]},
                          json={"model": model or "gpt-4o-mini", "temperature": 0,
                                "response_format": {"type": "json_object"},
                                "messages": [{"role": "user", "content": prompt}]})
        r.raise_for_status()
        return json.loads(r.json()["choices"][0]["message"]["content"])
    if backend == "pplx":  # Perplexity Computer sandbox
        import pplx_sdk
        res = pplx_sdk.llm.extract(items=[prompt], instruction="Follow the instructions in the item exactly.",
                                   output_schema=SCHEMA, max_tokens=32768)[0]
        if res.error:
            raise RuntimeError(f"llm error: {res.error}")
        return res.result
    raise ValueError(f"unknown backend {backend}")


# ---------------------------------------------------------------- text utilities
def norm(s: str) -> str:
    s = unicodedata.normalize("NFKC", s or "")
    s = s.replace("\u2019", "'").replace("\u2018", "'").replace("\u201c", '"').replace("\u201d", '"')
    s = s.replace("\u2013", "-").replace("\u2014", "-")
    return re.sub(r"\s+", " ", s).strip().lower()


def chunks(text: str, size: int = 6000, overlap: int = 400):
    paras, buf = re.split(r"\n\s*\n", text), ""
    for p in paras:
        if len(buf) + len(p) > size and buf:
            yield buf
            buf = buf[-overlap:]
        buf += ("\n\n" if buf else "") + p
    if buf.strip():
        yield buf


def slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", norm(s)).strip("_")[:80]


# ---------------------------------------------------------------- store
DDL = """
CREATE TABLE IF NOT EXISTS sources(source_id TEXT PRIMARY KEY, url TEXT, title TEXT, published TEXT,
  retrieved TEXT, tier TEXT, profile TEXT, extractor TEXT, text_sha256 TEXT, notes TEXT);
CREATE TABLE IF NOT EXISTS aliases(alias TEXT PRIMARY KEY, canonical TEXT);
CREATE TABLE IF NOT EXISTS quads(id TEXT PRIMARY KEY, subject TEXT, predicate TEXT, object TEXT,
  context TEXT, qualifiers TEXT, evidence TEXT, confidence REAL, predicate_status TEXT,
  status TEXT DEFAULT 'asserted', created TEXT,
  FOREIGN KEY(context) REFERENCES sources(source_id));
CREATE TABLE IF NOT EXISTS rejections(source_id TEXT, fact TEXT, reason TEXT, created TEXT);
CREATE INDEX IF NOT EXISTS q_s ON quads(subject); CREATE INDEX IF NOT EXISTS q_p ON quads(predicate);
CREATE INDEX IF NOT EXISTS q_o ON quads(object); CREATE INDEX IF NOT EXISTS q_c ON quads(context);
"""


class QuadStore:
    """SQLite SPOC store. Same add/query surface as the article's QuadStore, plus provenance."""

    def __init__(self, path: str = ":memory:"):
        self.db = sqlite3.connect(path)
        self.db.executescript(DDL)

    def canonical(self, name: str) -> str:
        r = self.db.execute("SELECT canonical FROM aliases WHERE alias=?", (norm(name),)).fetchone()
        return r[0] if r else re.sub(r"\s+", " ", name).strip()

    def add_alias(self, alias: str, canonical: str):
        self.db.execute("INSERT OR REPLACE INTO aliases VALUES(?,?)", (norm(alias), canonical))
        self.db.commit()

    def add_source(self, **m):
        cols = ["source_id", "url", "title", "published", "retrieved", "tier", "profile",
                "extractor", "text_sha256", "notes"]
        self.db.execute(f"INSERT OR REPLACE INTO sources VALUES({','.join('?'*len(cols))})",
                        [m.get(c) for c in cols])
        self.db.commit()

    def add(self, subject, predicate, obj, context, qualifiers=None, evidence="", confidence=None,
            predicate_status="mapped"):
        s, o = self.canonical(subject), self.canonical(obj)
        q = json.dumps(qualifiers or {}, sort_keys=True)
        qid = hashlib.sha256("|".join([norm(s), predicate, norm(o), context, q]).encode()).hexdigest()[:24]
        self.db.execute("INSERT OR IGNORE INTO quads(id,subject,predicate,object,context,qualifiers,evidence,"
                        "confidence,predicate_status,created) VALUES(?,?,?,?,?,?,?,?,?,?)",
                        (qid, s, predicate, o, context, q, evidence, confidence, predicate_status,
                         dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")))
        return qid

    def query(self, subject=None, predicate=None, obj=None, context=None, tier=None):
        sql = ("SELECT q.subject,q.predicate,q.object,q.context,q.qualifiers,q.evidence,s.tier,s.url,"
               "s.published FROM quads q JOIN sources s ON s.source_id=q.context WHERE q.status='asserted'")
        args = []
        for col, val in [("q.subject", subject), ("q.predicate", predicate), ("q.object", obj),
                         ("q.context", context), ("s.tier", tier)]:
            if val is not None:
                sql += f" AND {col}=?"
                args.append(self.canonical(val) if col in ("q.subject", "q.object") else val)
        return self.db.execute(sql, args).fetchall()

    def conflicts(self):
        """Functional predicates: same subject+predicate (+time/place if stated) with different
        objects from different sources. Surfaced for human resolution, never auto-resolved."""
        rows = self.db.execute("SELECT subject,predicate,object,context,qualifiers FROM quads "
                               "WHERE status='asserted'").fetchall()
        groups = {}
        for s, p, o, c, q in rows:
            if not CONSTRAINTS.get(p, {}).get("functional"):
                continue
            qd = json.loads(q or "{}")
            is_date = CONSTRAINTS[p]["type"] == "date"
            place = norm(qd.get("place", ""))
            key = (norm(s), p, "" if is_date else norm(qd.get("time", "")),
                   "" if place == norm(s) else place)
            groups.setdefault(key, []).append((o, c))
        out = []
        for (s, p, t, pl), vals in groups.items():
            if len({norm(v[0]) for v in vals}) > 1 and len({v[1] for v in vals}) > 1:
                out.append((s, p, t, pl, vals))
        return out

    def revalidate(self):
        """Re-apply current constraints to stored quads; failures move to status='rejected'."""
        n = 0
        for qid, p, o, q in self.db.execute("SELECT id,predicate,object,qualifiers FROM quads "
                                            "WHERE status='asserted'").fetchall():
            if check_constraint(p, o, json.loads(q or "{}")):
                self.db.execute("UPDATE quads SET status='rejected' WHERE id=?", (qid,)); n += 1
        self.db.commit()
        return n


# ---------------------------------------------------------------- extraction
def extract(store: QuadStore, text: str, source: dict, profile="generic", backend="pplx", model=None,
            min_conf=0.5) -> dict:
    preds = PROFILES.get(profile, PROFILES["generic"]) + (PROFILES["dataset"] if profile != "dataset" else [])
    source = dict(source)
    source.update(profile=profile, extractor=f"{backend}:{model or 'default'}",
                  text_sha256=hashlib.sha256(text.encode()).hexdigest(),
                  retrieved=source.get("retrieved") or dt.date.today().isoformat())
    if source.get("tier") not in TIERS:
        raise ValueError(f"tier must be one of {TIERS}")
    store.add_source(**source)
    ntext = norm(text)
    stats = {"kept": 0, "rejected": 0, "unmapped_predicates": 0}
    for ch in chunks(text):
        out = llm_json(PROMPT.format(predicates=", ".join(preds), example=json.dumps(FEW_SHOT),
                                     text=ch), backend, model)
        for f in (out or {}).get("facts", []):
            reason = None
            ev = norm(f.get("evidence", ""))
            if not all(f.get(k) for k in ("subject", "predicate", "object")):
                reason = "missing field"
            elif len(ev) < 8 or ev not in ntext:
                reason = "evidence not found verbatim in source"
            elif (f.get("confidence") or 1) < min_conf:
                reason = "low confidence"
            else:
                reason = check_constraint(slug(f["predicate"]), str(f["object"]),
                                          f.get("qualifiers") or {})
            if reason:
                stats["rejected"] += 1
                store.db.execute("INSERT INTO rejections VALUES(?,?,?,?)",
                                 (source["source_id"], json.dumps(f), reason, dt.datetime.now().isoformat()))
                continue
            pred = slug(f["predicate"])
            pstat = "mapped" if pred in preds else "unmapped"
            stats["unmapped_predicates"] += pstat == "unmapped"
            store.add(f["subject"], pred, f["object"], source["source_id"],
                      {k: v for k, v in (f.get("qualifiers") or {}).items() if v},
                      f.get("evidence"), f.get("confidence"), pstat)
            stats["kept"] += 1
    store.db.commit()
    return stats


def fetch_url(url: str) -> tuple[str, dict]:
    try:
        import pplx_sdk
        r = pplx_sdk.content.fetch([url])[0]
        if r.error:
            raise RuntimeError(r.error)
        return r.content or "", {"title": r.title, "published": r.published_date}
    except ImportError:
        import requests
        html = requests.get(url, timeout=60, headers={"User-Agent": "Mozilla/5.0"}).text
        return re.sub(r"<[^>]+>", " ", html), {}


# ---------------------------------------------------------------- CLI
def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    i = sub.add_parser("ingest")
    i.add_argument("--db", required=True); i.add_argument("--url"); i.add_argument("--file")
    i.add_argument("--source-id"); i.add_argument("--tier", required=True, choices=TIERS)
    i.add_argument("--profile", default="generic", choices=list(PROFILES))
    i.add_argument("--backend", default=os.environ.get("SPOC_BACKEND", "pplx"),
                   choices=["pplx", "ollama", "openai"])
    i.add_argument("--model"); i.add_argument("--published"); i.add_argument("--title")
    q = sub.add_parser("query"); q.add_argument("--db", required=True)
    for k in ("subject", "predicate", "object", "context", "tier"):
        q.add_argument("--" + k)
    c = sub.add_parser("conflicts"); c.add_argument("--db", required=True)
    e = sub.add_parser("export"); e.add_argument("--db", required=True); e.add_argument("--out", required=True)
    a = ap.parse_args()
    st = QuadStore(a.db)
    if a.cmd == "ingest":
        if a.url:
            text, meta = fetch_url(a.url)
        else:
            text, meta = open(a.file, encoding="utf-8").read(), {}
        sid = a.source_id or slug((a.url or a.file))[:60]
        stats = extract(st, text, {"source_id": sid, "url": a.url, "title": a.title or meta.get("title"),
                                   "published": a.published or meta.get("published"), "tier": a.tier},
                        a.profile, a.backend, a.model)
        print(json.dumps({"source_id": sid, **stats}))
    elif a.cmd == "query":
        for r in st.query(a.subject, a.predicate, a.object, a.context, a.tier):
            print(json.dumps(dict(zip(["s", "p", "o", "c", "qualifiers", "evidence", "tier", "url", "published"], r))))
    elif a.cmd == "conflicts":
        for r in st.conflicts():
            print(json.dumps(dict(zip(["subject", "predicate", "time", "place", "values"], r))))
    elif a.cmd == "export":
        rows = st.db.execute("SELECT q.*, s.url, s.tier, s.published FROM quads q JOIN sources s "
                             "ON s.source_id=q.context").fetchall()
        cols = [d[0] for d in st.db.execute("SELECT q.*, s.url, s.tier, s.published FROM quads q JOIN "
                                            "sources s ON s.source_id=q.context LIMIT 0").description]
        with open(a.out, "w", newline="") as f:
            if a.out.endswith(".csv"):
                w = csv.writer(f); w.writerow(cols); w.writerows(rows)
            else:
                for r in rows:
                    f.write(json.dumps(dict(zip(cols, r))) + "\n")
        print(f"exported {len(rows)} quads -> {a.out}")


if __name__ == "__main__":
    main()
