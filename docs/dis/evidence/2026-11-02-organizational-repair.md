# Organizational workflow repair — current execution record

Authority: remediation, verification, push/merge; no email, invitations, document distribution, paid add-ons or security bypass. Base: e1f0c208c312670c0eb05ca143b9b835a610e283. IRON-ENG-001 v1.0.0 applies. Triage L4.

Reuse: current 16-section planning contract and editable templates; Clerk authentication; restricted Neon role; private Blob; existing research and Council engine. Extend: organizational ACLs, normalized versioned records, originals archive, shared terminal and member workflow. New tables are necessary because existing workspaces are individually owned. Do not claim recovery of missing 82923eff source. Its archive remains unlocated after bounded searches; this is a new implementation against current main.

Architecture: records are paginated/versioned individually rather than a 2MB whole-project JSON. Private drafts remain private even to an administrator. Submission creates a distinct shared snapshot. Administration never grants chapter decision authority. Authority records require externally verified organizational delegation and are not writable by the application role. Council does not read chats automatically. Original files use private direct uploads with reserved quota and server-side size validation; extraction has independent disclosed resource bounds.

Acceptance: exact-source application tests, actual SQL/RLS with restricted roles, original-file/format round-trip tests, two-user/revocation/stale-edit tests, browser journey, independent review, deployed revision/readback. Synthetic fixtures are not live user acceptance. Production Clerk domain setup remains an external integration configuration prerequisite; no development-key bypass.
