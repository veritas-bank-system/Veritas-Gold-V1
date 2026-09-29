# Redacted Credential-Exposure Incident Checklist

**Assessment date:** 2026-09-28
**Status:** Preliminary local-worktree triage; values omitted from this document. A review-tool transcript exposure occurred; treat candidates as disclosed.
**Scope:** Checked-out repository files and Git revisions reachable through local refs; automated pattern scan excluded common generated/dependency/build folders and did not contact providers.

> **Priority: credential owner/security team should revoke or rotate any valid or uncertain candidate immediately.** Cleaning a file does not revoke a credential. Do not paste values into issues, chat, terminal output, screenshots, planning documents, or commit messages.

## Findings (redacted)

- Pattern scanning found credential-shaped strings or assignments in **12 working-tree files** across local configuration, gateway setup/runtime/test material, and agent handoff/skill artifacts. The values may include placeholders; validity has not been established.
- **During this review, credential-bearing lines were exposed in file-inspection/search tool output visible in the conversation transcript. Treat every candidate shown in that output as disclosed to the transcript and rotate/revoke it if valid or uncertain.** This is a reportable exposure even if a candidate later proves to be a test placeholder.
- All 12 candidate-bearing paths were untracked at scan time, in local configuration, `ai-gateway/`, and relevant `.agents/` artifacts. The checked-out main repository's 71 locally reachable revisions had no match for the narrow token/environment-assignment patterns used. This does not assess remotes, backups, unreachable objects, logs, bundles, other repositories, or other secret formats.
- The root `.env` exists, is local, and had permissions **0666** (read/write for all local users). Only the variable name was inventoried for the scan report; its value is not included here. Restrict its permissions immediately using the workstation's approved procedure.
- Added a root `.gitignore` for `.env`/`.env.*` (except `.env.example`) and local root/gateway MCP configuration files, plus a value-free `ai-gateway/.env.example`. Ignore rules prevent new matching local files from appearing as untracked candidates; they do not make committed/tracked material safe or remove literals from code, scripts, tests, or agent artifacts.
- Existing credential-bearing artifacts and `.env` were not edited, removed, validated against a provider, or rotated. Preserve evidence and have the credential owner/security team handle revocation and remediation.

## Response checklist

### 1. Immediate containment and owner notification

- [ ] Notify the credential owner and security incident contact that credential candidates appeared in repository artifacts and inspection output visible in this conversation transcript. Share this checklist/path metadata only; do not repeat values.
- [ ] Treat all candidates visible in the transcript as exposed. Revoke/rotate every valid or uncertain credential through the provider's authorized controls before cleaning files.
- [ ] Restrict access to the affected checkout and credential/config artifacts; do not stage, commit, publish, upload, or forward them.
- [ ] Preserve necessary path/timestamp/permission metadata in restricted incident records; do not copy candidate values into general-purpose tickets or evidence notes.
- [ ] Review provider access logs, usage, billing and alerts from the plausible exposure window; assess dependent credentials and revoke related sessions/tokens if warranted.
- [ ] Have the accountable security/legal owner determine escalation, notification, contractual/regulatory reporting, and evidence-retention requirements.

### 2. Local secret hygiene and recurrence prevention

- [ ] Change local `.env` to owner-only permissions using the approved OS/file-management method. Verify permissions without displaying the file contents.
- [x] Add root ignore rules for `.env`/`.env.*` and machine-local root/gateway MCP config files, retaining the value-free `.env.example` exception; add `ai-gateway/.env.example` with empty variables only.
- [ ] Replace runtime hard-coded fallback credentials with required environment/secret-manager configuration and fail closed when absent.
- [ ] Update installers and generated MCP config to read credentials from an approved secret store at runtime; never embed them in scripts, MCP JSON, tests, skills, or shell command arguments.
- [ ] Replace live-looking test values with unmistakably synthetic placeholders only after incident evidence is preserved and security/credential owners approve. Tests should use fake local mock credentials.
- [ ] Remove candidate literals from active artifacts after revocation and evidence review. If any are discovered in published history, coordinate history cleanup only after revocation and retention decisions; rewriting history alone is not remediation.
- [ ] Add automated secret scanning to pre-commit/CI with output that suppresses matched values and surrounding line contents; test the redaction behavior.

### 3. Verify closure

- [ ] A second authorized reviewer confirms provider-side invalidation and reviews account activity without recording the secret value.
- [ ] Scan the worktree, tracked and reachable/unreachable history as authorized, agent artifacts, configs, scripts, generated bundles, backups, and release artifacts using a scanner configured for redacted output.
- [ ] Review Git status and proposed diffs; verify no credential-bearing local file is staged or newly tracked. Confirm `.env` permissions are corrected and ignore rules operate as intended.
- [ ] Record owners, dates, candidate categories, revocation and usage-review outcome, notification decision, residual risk, and sign-off in restricted incident management.

## Scan limits

Initial triage used local text-pattern matching that suppressed candidate values and matching lines in its dedicated scan summary. It skipped common generated/build/dependency directories and checked a limited set of patterns across locally reachable Git revisions. This was not a comprehensive secret scan, provider validity check, or proof of no external exposure. No API call was made to validate a candidate. A separate source-inspection tool output did expose credential lines in the conversation transcript; therefore treat candidates as disclosed regardless of the narrow Git-history result.

## Related evidence

- Current architecture and production blockers: [`../01-architecture-and-domain/p0-current-architecture-status.md`](../01-architecture-and-domain/p0-current-architecture-status.md) and [`../05-testing-verification-and-operations/p0-current-production-readiness-status.md`](../05-testing-verification-and-operations/p0-current-production-readiness-status.md).
- Workspace policy against copying secrets into planning files: [`.agents/rules/architectural_planning_directory_rule.md`](../../.agents/rules/architectural_planning_directory_rule.md).
- Main program security/rotation gate: [`../00-overview-and-governance/veritas_bank_program_overview_and_step_by_step_roadmap.md`](../00-overview-and-governance/veritas_bank_program_overview_and_step_by_step_roadmap.md), Phase 6.
