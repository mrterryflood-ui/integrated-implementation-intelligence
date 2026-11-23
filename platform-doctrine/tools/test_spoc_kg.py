"""Synthetic, offline regressions for the sibling SPOC helper; no provider credentials used."""
import builtins
import contextlib
import csv
import importlib.util
import io
import json
import os
from pathlib import Path
import sqlite3
import sys
import tempfile
import types
import unittest
from unittest import mock


SPEC = importlib.util.spec_from_file_location("spoc_kg_under_test", Path(__file__).with_name("spoc_kg.py"))
kg = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(kg)


class Response:
    def __init__(self, payload=None, text="", status=200):
        self.payload, self.text, self.status_code = payload, text, status

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError("synthetic HTTP error")

    def json(self):
        return self.payload


TEXT = "The city recorded 21 homicides in 2020. An audit team checked the report."
QUOTE = "The city recorded 21 homicides in 2020"


def fact(**overrides):
    value = {"subject": "CPD", "predicate": "reported_homicides", "object": "21",
             "qualifiers": {"time": "2020", "place": "Example City", "unit": "victims"},
             "evidence": QUOTE, "confidence": 0.95}
    value.update(overrides)
    return value


def source(sid="synthetic-source"):
    return {"source_id": sid, "url": "https://source.example/" + sid,
            "title": "Synthetic source", "published": "2020-12-31", "tier": "NEWS-REPORTED"}


class RetirementTests(unittest.TestCase):
    def setUp(self):
        self.stack = contextlib.ExitStack()
        self.addCleanup(self.stack.close)
        self.stack.enter_context(mock.patch.dict(os.environ, {}, clear=True))
        self.requests = types.ModuleType("requests")
        self.requests.post = mock.Mock(side_effect=AssertionError("unexpected model transport"))
        self.requests.get = mock.Mock(side_effect=AssertionError("unexpected source transport"))
        self.stack.enter_context(mock.patch.dict(sys.modules, {"requests": self.requests}))
        self.imports = []
        real_import = builtins.__import__

        def guarded_import(name, *args, **kwargs):
            self.imports.append(name)
            if name == "pplx_sdk" or name.startswith("pplx_sdk."):
                raise AssertionError("retired SDK must never be imported")
            return real_import(name, *args, **kwargs)

        self.stack.enter_context(mock.patch("builtins.__import__", side_effect=guarded_import))
        self.stack.enter_context(mock.patch("socket.create_connection", side_effect=AssertionError("network forbidden")))
        self.stack.enter_context(mock.patch("socket.socket.connect", side_effect=AssertionError("network forbidden")))
        self.temp = Path(self.stack.enter_context(tempfile.TemporaryDirectory()))

    def respond(self, facts, backend="ollama"):
        content = json.dumps({"facts": facts})
        payload = ({"response": content} if backend == "ollama" else
                   {"choices": [{"message": {"content": content}}]})
        self.requests.post.side_effect = None
        self.requests.post.return_value = Response(payload=payload)

    def store(self, path=":memory:"):
        store = kg.QuadStore(str(path))
        self.addCleanup(store.db.close)
        return store

    def run_cli(self, *arguments):
        output = io.StringIO()
        with mock.patch.object(sys, "argv", ["spoc_kg.py", *map(str, arguments)]), contextlib.redirect_stdout(output):
            kg.main()
        return output.getvalue()

    def test_retired_and_unknown_backends_fail_before_import(self):
        for backend in ("pplx", "Perplexity", "SONAR", "unknown"):
            with self.subTest(backend=backend):
                self.imports.clear()
                with self.assertRaises(ValueError):
                    kg.llm_json("synthetic prompt", backend, None)
                self.assertNotIn("requests", self.imports)
        self.requests.post.assert_not_called()

    def test_retired_models_and_endpoints_include_encoded_forms(self):
        selections = ("sonar-pro", "perplexity/sonar", "PPLX-70B", "SONAR",
                      "%53ONAR-pro", "%2553ONAR-pro", "%252553ONAR-pro",
                      "ｐｅｒｐｌｅｘｉｔｙ/model", "%EF%BC%B3%EF%BC%AF%EF%BC%AE%EF%BC%A1%EF%BC%B2")
        for backend, variable in (("openai", "OPENAI_BASE_URL"), ("ollama", "OLLAMA_URL")):
            for value in selections:
                with self.subTest(backend=backend, selection=value):
                    with self.assertRaises(ValueError):
                        kg.llm_json("synthetic prompt", backend, value)
                    with mock.patch.dict(os.environ, {variable: "https://gateway.example/" + value}):
                        with self.assertRaises(ValueError):
                            kg.llm_json("synthetic prompt", backend, "example-model")
        self.requests.post.assert_not_called()
        self.assertNotIn("requests", self.imports)

    def test_errors_do_not_echo_endpoint_or_credential_values(self):
        endpoint = "https://user:synthetic-secret@api.perplexity.ai/v1?token=synthetic-secret"
        with mock.patch.dict(os.environ, {"OPENAI_BASE_URL": endpoint}):
            with self.assertRaises(ValueError) as caught:
                kg.llm_json("synthetic prompt", "openai", "example-model")
        self.assertNotIn("synthetic-secret", str(caught.exception))
        self.assertNotIn(endpoint, str(caught.exception))

    def test_supported_names_and_opaque_proxy_are_not_misidentified(self):
        with mock.patch.dict(os.environ, {"OPENAI_BASE_URL": "https://gateway.example/v1"}):
            self.assertEqual(kg.llm_route("openai", "organization/custom-model"),
                             ("https://gateway.example/v1", "organization/custom-model"))
            self.assertEqual(kg.llm_route("openai", "sonarsource-model")[1], "sonarsource-model")
        self.requests.post.assert_not_called()

    def test_retired_extraction_does_not_write_even_for_empty_text(self):
        store = self.store()
        cases = [("pplx", None, {}), ("openai", "sonar-pro", {}),
                 ("openai", None, {"OPENAI_BASE_URL": "https://api.perplexity.ai"}),
                 ("ollama", None, {"OLLAMA_URL": "https://pplx.ai"}),
                 ("openai", "openai/example:online", {"OPENAI_BASE_URL": "https://openrouter.ai/api/v1"})]
        for backend, model, environment in cases:
            with self.subTest(backend=backend, model=model), mock.patch.dict(os.environ, environment, clear=True):
                for text in ("", TEXT):
                    with self.assertRaises(ValueError):
                        kg.extract(store, text, source(), backend=backend, model=model)
                    for table in ("sources", "quads", "rejections"):
                        self.assertEqual(store.db.execute("SELECT count(*) FROM " + table).fetchone()[0], 0)
        self.requests.post.assert_not_called()

    def test_cli_preflight_precedes_database_and_source_acquisition(self):
        cases = [(["--backend", "pplx"], {}), ([], {"SPOC_BACKEND": "pplx"}),
                 ([], {"SPOC_BACKEND": "unknown"}), (["--model", "sonar-pro"], {}),
                 (["--backend", "openai"], {"OPENAI_BASE_URL": "https://api.perplexity.ai"}),
                 (["--url", "https://pplx.ai/source"], {}),
                 (["--backend", "openai", "--model", "openai/example:online"],
                  {"OPENAI_BASE_URL": "https://openrouter.ai/api/v1"})]
        for index, (arguments, environment) in enumerate(cases):
            database = self.temp / (str(index) + ".sqlite")
            with self.subTest(index=index), mock.patch.dict(os.environ, environment, clear=True):
                with mock.patch.object(kg, "fetch_url") as fetch, contextlib.redirect_stderr(io.StringIO()):
                    with self.assertRaises(SystemExit) as caught:
                        self.run_cli("ingest", "--db", database, "--file", "absent-file.txt",
                                     "--tier", "RESEARCH", *arguments)
                    self.assertEqual(caught.exception.code, 2)
                    fetch.assert_not_called()
                    self.assertFalse(database.exists())
        self.requests.get.assert_not_called()
        self.requests.post.assert_not_called()

    def test_default_extraction_uses_local_ollama_despite_available_paid_key(self):
        os.environ["OPENAI_API_KEY"] = "synthetic-test-key"
        self.respond([fact()])
        store = self.store()
        self.assertEqual(kg.extract(store, TEXT, source(), profile="violence"),
                         {"kept": 1, "rejected": 0, "unmapped_predicates": 0})
        args, options = self.requests.post.call_args
        self.assertEqual(args[0], "http://localhost:11434/api/generate")
        self.assertEqual(options["json"]["model"], "llama3.2")
        self.assertEqual(options["json"]["format"], "json")
        self.assertFalse(options["json"]["stream"])
        self.assertFalse(options["allow_redirects"])
        self.assertEqual(options["timeout"], 600)
        self.assertNotIn("headers", options)
        self.assertNotIn("plugins", options["json"])
        self.assertEqual(store.db.execute("SELECT extractor FROM sources").fetchone()[0], "ollama:default")

    def test_cli_default_and_explicit_environment_selection_ingest_file(self):
        file = self.temp / "synthetic.txt"
        file.write_text(TEXT, encoding="utf-8")
        for backend in ("ollama", "openai"):
            environment = {"OPENAI_API_KEY": "synthetic-test-key"}
            if backend == "openai":
                environment["SPOC_BACKEND"] = "openai"
            with self.subTest(backend=backend), mock.patch.dict(os.environ, environment, clear=True):
                self.respond([fact()], backend)
                database = self.temp / (backend + ".sqlite")
                output = self.run_cli("ingest", "--db", database, "--file", file, "--source-id", "fixture",
                                      "--tier", "RESEARCH", "--profile", "violence", "--title", "Synthetic title")
                self.assertEqual(json.loads(output), {"source_id": "fixture", "kept": 1,
                                                       "rejected": 0, "unmapped_predicates": 0})
                with sqlite3.connect(database) as check:
                    self.assertEqual(check.execute("SELECT title,published,extractor FROM sources").fetchone(),
                                     ("Synthetic title", None, backend + ":default"))
                target = self.requests.post.call_args.args[0]
                self.assertEqual(target, "http://localhost:11434/api/generate" if backend == "ollama" else
                                 "https://api.openai.com/v1/chat/completions")

    def test_explicit_openai_preserves_compatible_payload_and_response(self):
        os.environ.update(OPENAI_API_KEY="synthetic-test-key", OPENAI_BASE_URL="https://model.example/v1")
        self.respond([fact()], "openai")
        self.assertEqual(kg.llm_json("synthetic prompt", "openai", "chosen-model"), {"facts": [fact()]})
        args, options = self.requests.post.call_args
        self.assertEqual(args[0], "https://model.example/v1/chat/completions")
        self.assertEqual(options["json"], {"model": "chosen-model", "temperature": 0,
                                         "response_format": {"type": "json_object"},
                                         "messages": [{"role": "user", "content": "synthetic prompt"}]})
        self.assertEqual(options["headers"], {"Authorization": "Bearer synthetic-test-key"})
        self.assertFalse(options["allow_redirects"])

    def test_openrouter_web_plugin_opt_out_is_host_specific(self):
        os.environ["OPENAI_API_KEY"] = "synthetic-test-key"
        cases = [("https://openrouter.ai/api/v1", True), ("https://OPENROUTER.AI./api/v1", True),
                 ("https://api.openrouter.ai/api/v1", True), ("https://openrouter%2Eai/api/v1", True),
                 ("https://api.openai.com/v1", False), ("https://openrouter.ai.example/v1", False),
                 ("https://model.example/openrouter.ai", False), ("https://openrouter.ai@model.example/v1", False)]
        for endpoint, should_disable in cases:
            with self.subTest(endpoint=endpoint), mock.patch.dict(os.environ, {"OPENAI_BASE_URL": endpoint}):
                self.respond([], "openai")
                kg.llm_json("synthetic prompt", "openai", "openai/example-model")
                payload = self.requests.post.call_args.kwargs["json"]
                if should_disable:
                    self.assertEqual(payload["plugins"], [{"id": "web", "enabled": False}])
                else:
                    self.assertNotIn("plugins", payload)
                self.assertNotIn("tools", payload)

    def test_openrouter_online_shortcut_fails_before_transport(self):
        os.environ["OPENAI_BASE_URL"] = "https://openrouter.ai/api/v1"
        for model in ("openai/example:online", "openai/example:ONLINE", "openai/example%3Aonline"):
            with self.subTest(model=model), self.assertRaises(ValueError):
                kg.llm_json("synthetic prompt", "openai", model)
        self.requests.post.assert_not_called()
        self.assertNotIn("requests", self.imports)

    def test_missing_openai_key_does_not_try_another_provider(self):
        with self.assertRaises(KeyError):
            kg.llm_json("synthetic prompt", "openai", None)
        self.requests.post.assert_not_called()

    def test_transport_and_model_errors_never_switch_provider(self):
        os.environ["OPENAI_API_KEY"] = "synthetic-test-key"
        for backend in ("ollama", "openai"):
            for failure in ("timeout", "http", "invalid-json"):
                with self.subTest(backend=backend, failure=failure):
                    self.requests.post.reset_mock()
                    self.respond([], backend)
                    if failure == "timeout":
                        self.requests.post.side_effect = TimeoutError("synthetic timeout")
                    elif failure == "http":
                        self.requests.post.return_value.status_code = 503
                    else:
                        payload = ({"response": "not-json"} if backend == "ollama" else
                                   {"choices": [{"message": {"content": "not-json"}}]})
                        self.requests.post.return_value.payload = payload
                    with self.assertRaises((TimeoutError, RuntimeError, json.JSONDecodeError)):
                        kg.llm_json("synthetic prompt", backend, None)
                    self.assertEqual(self.requests.post.call_count, 1)
                    self.assertIn("localhost" if backend == "ollama" else "api.openai.com",
                                  self.requests.post.call_args.args[0])

    def test_model_redirects_are_disabled_and_rejected(self):
        os.environ["OPENAI_API_KEY"] = "synthetic-test-key"
        for backend in ("ollama", "openai"):
            for status in (301, 302, 303, 307, 308):
                with self.subTest(backend=backend, status=status):
                    self.requests.post.reset_mock()
                    self.respond([], backend)
                    self.requests.post.return_value.status_code = status
                    with self.assertRaisesRegex(ValueError, "redirects are disabled"):
                        kg.llm_json("synthetic prompt", backend, None)
                    self.assertFalse(self.requests.post.call_args.kwargs["allow_redirects"])
                    self.assertEqual(self.requests.post.call_count, 1)

    def test_direct_source_fetch_never_uses_sdk_or_invents_metadata(self):
        self.requests.get.side_effect = None
        self.requests.get.return_value = Response(text="<html><title>Synthetic page</title><p>Fixture text.</p></html>")
        text, metadata = kg.fetch_url("https://source.example/fixture")
        self.assertIn("Fixture text.", text)
        self.assertNotIn("<p>", text)
        self.assertEqual(metadata, {})
        self.requests.get.assert_called_once_with("https://source.example/fixture", timeout=60,
                                                 headers={"User-Agent": "Mozilla/5.0"}, allow_redirects=False)
        self.requests.post.assert_not_called()

    def test_retired_source_url_fails_before_import(self):
        for url in ("https://api.perplexity.ai", "https://pplx.ai/source", "https://source.example/%53ONAR"):
            with self.subTest(url=url), self.assertRaises(ValueError):
                kg.fetch_url(url)
        self.requests.get.assert_not_called()
        self.assertNotIn("requests", self.imports)

    def test_source_failures_and_redirects_cannot_become_extracted_facts(self):
        for status in (302, 404, 503):
            with self.subTest(status=status):
                self.requests.get.side_effect = None
                self.requests.get.return_value = Response(text="Synthetic error page", status=status)
                database = self.temp / (str(status) + ".sqlite")
                with self.assertRaises((ValueError, RuntimeError)):
                    self.run_cli("ingest", "--db", database, "--url", "https://source.example/fixture",
                                 "--tier", "RESEARCH")
                self.assertFalse(self.requests.get.call_args.kwargs["allow_redirects"])
                with sqlite3.connect(database) as check:
                    self.assertEqual(check.execute("SELECT count(*) FROM sources").fetchone()[0], 0)
                    self.assertEqual(check.execute("SELECT count(*) FROM quads").fetchone()[0], 0)
        self.requests.post.assert_not_called()

    def test_real_store_extraction_provenance_rejections_conflicts_and_local_exports(self):
        database = self.temp / "graph.sqlite"
        store = self.store(database)
        store.add_alias("CPD", "Example City Police Department")
        facts = [fact(), fact(predicate="checked_by", object="Audit team", qualifiers={},
                              evidence="An audit team checked the report"),
                 fact(evidence="This quote is absent from the source"), fact(object="21 percent"),
                 fact(qualifiers={"unit": "percent"}), fact(predicate="effective_on", object="January first"),
                 fact(confidence=0.1), fact(object=""), fact(evidence="city")]
        os.environ["OPENAI_API_KEY"] = "synthetic-test-key"
        self.respond(facts, "openai")
        self.assertEqual(kg.extract(store, TEXT, source("first"), profile="violence", backend="openai"),
                         {"kept": 2, "rejected": 7, "unmapped_predicates": 1})
        self.respond([fact(object="22", evidence="The city recorded 22 homicides in 2020")])
        second_text = TEXT.replace("21", "22")
        self.assertEqual(kg.extract(store, second_text, source("second"), profile="violence")["kept"], 1)
        rows = store.query(subject="CPD", predicate="reported_homicides")
        self.assertEqual({row[2] for row in rows}, {"21", "22"})
        self.assertTrue(all(row[0] == "Example City Police Department" for row in rows))
        self.assertTrue(all(row[6] == "NEWS-REPORTED" and row[7].startswith("https://source.example/") for row in rows))
        self.assertEqual(store.db.execute("SELECT count(*) FROM rejections").fetchone()[0], 7)
        self.assertEqual(store.db.execute("SELECT predicate_status FROM quads WHERE predicate='checked_by'").fetchone()[0],
                         "unmapped")
        self.assertEqual(len(store.conflicts()), 1)
        self.assertEqual({tuple(pair) for pair in store.conflicts()[0][4]}, {("21", "first"), ("22", "second")})
        store.db.close()

        # Reopening and every local command work even with retired provider configuration.
        self.requests.post.reset_mock()
        self.requests.get.reset_mock()
        self.imports.clear()
        os.environ.update(SPOC_BACKEND="pplx", OPENAI_BASE_URL="https://api.perplexity.ai")
        queried = [json.loads(line) for line in self.run_cli("query", "--db", database, "--subject", "CPD",
                                                            "--predicate", "reported_homicides").splitlines()]
        self.assertEqual({row["o"] for row in queried}, {"21", "22"})
        self.assertTrue(all(row["published"] == "2020-12-31" for row in queried))
        self.assertEqual(len(self.run_cli("conflicts", "--db", database).splitlines()), 1)
        jsonl, csv_path = self.temp / "quads.jsonl", self.temp / "quads.csv"
        self.run_cli("export", "--db", database, "--out", jsonl)
        self.run_cli("export", "--db", database, "--out", csv_path)
        exported = [json.loads(line) for line in jsonl.read_text().splitlines()]
        with csv_path.open(newline="") as handle:
            csv_rows = list(csv.DictReader(handle))
        self.assertEqual(len(exported), 3)
        self.assertEqual(len(csv_rows), 3)
        self.assertEqual({row["id"] for row in exported}, {row["id"] for row in csv_rows})
        self.assertTrue(all(row["evidence"] and row["url"] and row["tier"] == "NEWS-REPORTED" for row in exported))
        self.assertNotIn("requests", self.imports)
        self.requests.post.assert_not_called()
        self.requests.get.assert_not_called()


if __name__ == "__main__":
    unittest.main(verbosity=2)
