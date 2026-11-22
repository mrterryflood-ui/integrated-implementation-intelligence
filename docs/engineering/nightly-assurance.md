# Nightly assurance pilot

This pilot covers this repository only. Dependabot proposes daily updates for
GitHub Actions and the npm manifests in `apps/dis-platform`, `tools/iss-ebeas`
and `tools/iss-ebeas-ui`. GitHub controls actual scheduling; updates and
security alerts also depend on repository settings and service availability.
Pull requests remain review-only: this change does not enable auto-merge,
change branch protection, approve a deployment, or bypass existing policy.

The nightly workflow runs the existing DIS platform typecheck and tests, DIS
web tests and learner-method tests. It audits the three npm dependency graphs,
failing for high or critical advisories. The two tool audits use committed
lockfiles. The platform has no committed lockfile: its audit generates a
temporary resolution, which may differ from deployed dependencies. It is not
proof that a deployed application is patched. Inline Python dependencies,
container images, application code vulnerabilities, secrets, and other
ecosystems are not covered by this npm audit. Existing workflows remain intact.

The public GitHub discovery report searches fixed implementation-science,
evidence-synthesis and research-reproducibility terms. The workflow summary
and 30-day artifact contain metadata and source links, not vetted
recommendations. A human must assess fit, security, compatibility, license and
maintenance before adopting anything; no discovered code is downloaded,
executed or integrated. Search failures fail the job rather than masquerading
as an empty report.

No active penetration test is configured: an authorized staging URL and
testing boundaries are required first. The workflow does not use a recurring
AI agent. GitHub Actions usage may incur existing account charges. A maintainer
should review failed workflow runs, Dependabot pull requests and expiring
reports; neither a successful run nor a merged update proves release or
production acceptance. To pause, disable the nightly workflow in GitHub and
disable or remove the Dependabot configuration through review.
