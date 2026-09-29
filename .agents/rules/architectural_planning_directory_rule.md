---
trigger: always_on
description: File project planning and architecture Markdown in the topic-organized Architectural_Planning_Directory while preserving original documents and evidence provenance.
---

# Architectural Planning Directory Rule

1. **Canonical topic location for new project planning documents**
   - Save newly authored project architecture, product/workflow, security/privacy/compliance, standards/integration, testing/operations, UI/mobile/design, and deployment/reference planning `.md` files under the matching topic in `Architectural_Planning_Directory/`.
   - Use the directory's `README.md` as the index. If no topic fits, add a clearly named topic folder and update the index.
   - Add a short metadata header to new planning documents: purpose, date, status (`Verified`, `Proposal`, `Historical`, or `Unverified`), and links to relevant source code/tests/evidence where applicable.

2. **Uploaded or received Markdown**
   - When the user uploads or supplies a project-related `.md` document for incorporation, copy it into the appropriate topic folder and add it to the index. Preserve its original filename and content unless the user expressly asks for editing.
   - If the original location matters, keep the original there; do not move or delete it by default. Note the original source/path and copy date in the index or adjacent metadata.
   - For external/reference Markdown not authored for this repository, record source URL/author/date/license when known. Do not imply the file is project-approved or verified just because it was copied.
   - Do not copy private keys, API tokens, passwords, personal data, or other secrets into the planning directory. Redact sensitive material and follow the security incident process.

3. **Existing Markdown and legacy documents**
   - Do not bulk move, overwrite, or rewrite existing Markdown as part of filing. For existing documents, create a copy in the matching topic folder when organization is requested, retain the source in place, and mark the copy/source relationship clearly.
   - Treat organized copies as potentially stale until compared with their original. Update the index and changelog when a planning copy is added or materially changed.
   - Preserve historical proposals and changelogs; distinguish them from current verified status rather than silently erasing old claims.

4. **Evidence and claims**
   - Separate implemented-and-verified behavior from proposal, simulation, fixture, historical observation, and unverified claims.
   - Cite relative source paths, test names/commands, evidence dates, and environment. A mock, UI label, local test, copy, or successful build alone is not evidence of production deployment, regulatory compliance, custody, backing, settlement finality, or external integration.
   - Do not state that SOC 2, DORA, GDPR, or another framework applies or is met without qualified scope/evidence review.

5. **Changelog and index maintenance**
   - Keep root `MAINCHANGELOG.txt` as the project's main chronological change record unless the project owner changes that convention. Do not silently create competing changelogs.
   - Preserve a dated reference copy of the changelog under `Architectural_Planning_Directory/08-findings-and-history/` only when intentionally synchronizing it; it is an archive copy, not a substitute for the root changelog.
   - Add every new planning document to `Architectural_Planning_Directory/README.md` under its topic, with a concise description and source/provenance note where relevant.
