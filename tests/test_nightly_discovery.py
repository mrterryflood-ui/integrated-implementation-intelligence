import datetime
import importlib.util
import io
import json
import unittest
from pathlib import Path
from unittest.mock import patch

PATH = Path(__file__).resolve().parents[1] / "scripts" / "nightly-discovery.py"
SPEC = importlib.util.spec_from_file_location("nightly_discovery", PATH)
discovery = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(discovery)


class DiscoveryTests(unittest.TestCase):
    def test_report_escapes_untrusted_metadata_and_labels_unknown_license(self):
        report = discovery.render_report(
            [("test", [{
                "full_name": "example/project",
                "private": False,
                "description": "one | <script>bad</script>\n[link](https://bad.example)",
                "license": None,
                "updated_at": "2026-01-01T00:00:00Z",
            }])],
            datetime.datetime(2026, 1, 1, tzinfo=datetime.timezone.utc),
        )
        self.assertIn("https://github.com/example/project", report)
        self.assertIn("one &#124; &lt;script&gt;bad&lt;/script&gt; &#91;link&#93;&#40;", report)
        self.assertIn("| Unknown |", report)
        self.assertIn("not recommendations", report)

    def test_rejects_invalid_repository_link(self):
        with self.assertRaises(ValueError):
            discovery.render_report(
                [("test", [{"full_name": "example/project) javascript:bad"}])],
                datetime.datetime.now(datetime.timezone.utc),
            )

    def test_rejects_nonpublic_or_unclassified_repository(self):
        for privacy in (True, None):
            with self.subTest(privacy=privacy), self.assertRaises(ValueError):
                discovery.render_report(
                    [("test", [{"full_name": "example/project", "private": privacy}])],
                    datetime.datetime.now(datetime.timezone.utc),
                )

    def test_search_rejects_incomplete_response(self):
        payload = io.BytesIO(json.dumps({"incomplete_results": True, "items": []}).encode())
        with patch.object(discovery.urllib.request, "urlopen", return_value=payload):
            with self.assertRaises(ValueError):
                discovery.search("test", "token")

    def test_empty_search_is_explicit(self):
        report = discovery.render_report(
            [("test", [])], datetime.datetime.now(datetime.timezone.utc)
        )
        self.assertIn("No results returned for this query.", report)


if __name__ == "__main__":
    unittest.main()
