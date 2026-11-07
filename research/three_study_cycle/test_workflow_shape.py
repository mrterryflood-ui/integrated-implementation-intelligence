"""Protect source-cycle execution and revision boundaries; no test dependency.
The previous assertion required a reserved GitHub env override. That did not
establish the checked-out revision. This regression now requires the explicit
child-process git revision and a separate pre-analysis integrity gate.
"""
from pathlib import Path
import re
import unittest

WORKFLOW = Path(__file__).resolve().parents[2] / ".github/workflows/dis-research-evidence-cycle.yml"


def named_steps(text: str) -> dict[str, str]:
    """Check exact structural lines; this is not a general YAML parser."""
    starts = list(re.finditer(r"^      - name: (.+)$", text, re.MULTILINE))
    names = [m.group(1) for m in starts]
    if any("\\n" in name for name in names):
        raise ValueError("Escaped newlines collapsed workflow steps")
    if len(names) != len(set(names)):
        raise ValueError("Duplicate named workflow step")
    return {
        m.group(1): text[m.end():starts[i + 1].start() if i + 1 < len(starts) else len(text)]
        for i, m in enumerate(starts)
    }


class ResearchWorkflowShapeTest(unittest.TestCase):
    def test_test_and_acquisition_steps_remain_separate(self):
        steps = named_steps(WORKFLOW.read_text(encoding="utf-8"))
        self.assertIn(
            "        run: python -m unittest discover -s research/three_study_cycle -p 'test_*.py'",
            steps["Test evidence-readiness classification"],
        )
        acquire = steps["Acquire original public data and reproduce survey estimates"]
        self.assertIn('run: GITHUB_SHA="$(git rev-parse HEAD)" python research/three_study_cycle/acquire.py --out research-results', acquire)
        self.assertNotRegex(acquire, r"(?m)^\s+GITHUB_SHA:")
        order = list(steps)
        self.assertLess(order.index("Test evidence-readiness classification"), order.index("Acquire original public data and reproduce survey estimates"))

    def test_byte_and_revision_gate_precedes_derived_analyses(self):
        steps = named_steps(WORKFLOW.read_text(encoding="utf-8"))
        check = steps["Verify retained source bytes and the checked-out revision"]
        self.assertIn("python research/three_study_cycle/verify_retained.py research-results", check)
        self.assertIn("DIS_EVIDENCE_EXPECTED_SHA: ${{ github.event.pull_request.head.sha || github.sha }}", check)
        self.assertIn("integrity_rejected_source_ids", check)
        self.assertIn("MATCHES_DECLARED_EXPECTATION", check)
        self.assertIn("sys.exit(1)", check)
        self.assertNotIn("continue-on-error: true", check)
        self.assertNotIn("|| true", check)
        order = list(steps)
        self.assertLess(order.index("Acquire original public data and reproduce survey estimates"), order.index("Verify retained source bytes and the checked-out revision"))
        self.assertLess(order.index("Verify retained source bytes and the checked-out revision"), order.index("Reconcile and replay all three studies"))
        self.assertNotIn("if: always()", steps["Reconcile and replay all three studies"])

    def test_readiness_and_artifact_preservation_run_after_failure(self):
        steps = named_steps(WORKFLOW.read_text(encoding="utf-8"))
        readiness = steps["Classify acquisition completeness independently from job success"]
        archive = steps["Preserve exact source bytes, failures, definitions and calculated results"]
        self.assertIn("        if: always()", readiness)
        self.assertIn("        if: always()", archive)
        self.assertIn("run: python research/three_study_cycle/readiness.py research-results", readiness)
        self.assertIn("uses: actions/upload-artifact@v4", archive)

    def test_actual_escaped_newline_regression_is_rejected(self):
        broken = "      - name: Test evidence-readiness classification\\n        run: python -m unittest\\n      - name: Acquire original public data"
        with self.assertRaisesRegex(ValueError, "Escaped newlines"):
            named_steps(broken)

    def test_repair_retains_read_only_manual_or_pr_scope(self):
        text = WORKFLOW.read_text(encoding="utf-8")
        self.assertIn("  contents: read", text)
        self.assertIn("  workflow_dispatch:", text)
        self.assertIn("  pull_request:", text)
        self.assertNotRegex(text, r"(?m)^  schedule:")
        self.assertIn("persist-credentials: false", text)


if __name__ == "__main__":
    unittest.main()
