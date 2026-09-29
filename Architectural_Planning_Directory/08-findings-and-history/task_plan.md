# Task Plan: Central-Bank Account Overview, VPS Readiness & Persona Playtest

## Goal
Deliver a truthful central-bank-oriented account overview, preserve current site features/design, prepare a reproducible VPS demo path, and maintain the requested seven-persona preview with a real-site playtest and ranked feature-enhancement spec.

## Next Step
All requested edits and validation are complete; leave the preview on the seven-role persona selector for user review.

## Current Phase
Phase 7 — Persona Scope Update & Preview (complete)

## Phases

### Phase 1: Requirements & Discovery
- [x] Understand user intent and review product specification
- [x] Identify current account fields, seed records, demo limitations and app owner files
- [x] Record initial findings
- **Status:** complete

### Phase 2: Planning & Structure
- [x] Decide account overview scope and data limitations
- [x] Review pre-existing launcher modification before changes
- [x] Record decisions in `MAINCHANGELOG.txt`
- **Status:** complete

### Phase 3: Implementation
- [x] Rework Account Overview using supported API facts and transparent sandbox labels
- [x] Preserve sandbox transfer path with active-account choices and guardrails
- [x] Correct clean-VPS build/start checks in the existing launcher
- **Status:** complete

### Phase 4: Initial Testing & Verification
- [x] Frontend build/lint and Rust build/check
- [x] Playtest overview search/filter/invalid-valid transfer/narrow viewport
- [x] Verify launcher syntax and existing backend health without disrupting live shared service
- **Status:** complete

### Phase 5: Initial Delivery
- [x] Document outcomes and limits; no external deployment
- **Status:** complete

### Phase 6: Persona Playtest & Spec Brainstorm
- [x] Discover all eight configured personas and exercise every workstation persona switch from the real Master Admin registry
- [x] Check Executive Mobile Approver through its separate authorization-to-mobile flow and safe read-only screens
- [x] Record role boundary, stale/fabricated data, UI-only auth and mobile approval defects without invoking mutating actions
- [x] Brainstorm and rank at least five in-scope enhancements with impact, rough cost and a top-idea cold-start brief
- [x] Update project findings, progress and root changelog
- **Status:** complete

### Phase 7: Persona Scope Update & Preview
- [x] Remove Executive Signer & Mobile Approver as a persona per user decision
- [x] Keep mobile/tablet as device presentation modes, not institutional roles
- [x] Preserve visual design and update brainstorm/changelog wording to seven retained personas
- [x] Verify frontend build/lint and preview persona selector
- **Status:** complete

## Key Decisions
| Decision | Rationale |
|----------|-----------|
| Show settled funds and credit separately and label combined headroom indicative. | API lacks holds/pending state; overdraft is not cash. |
| Preserve demo transfer but state it is immediate/in-memory, not an approval or live rail. | Preserve existing functionality while avoiding false settlement claims. |
| Interpret VPS readiness as a reproducible demo path only. | No external deployment authorization and no production security/rail evidence. |
| In the persona review, do not execute buys, approvals, settlements or production actions. | Mobile paths can show financial actions; test only non-mutating navigation and validation. |
| Remove Executive Signer & Mobile Approver as a persona; retain mobile/tablet as generic device modes. | User said mobile app approver is not needed and wants to review the remaining personas/features. |
| Do not modify application code during the requested brainstorm pass. | `/spec-brainstorm` explicitly asks for documentation and ideas only. |
| Document discrepancies as observed sandbox defects and distinguish them from live service capabilities. | Existing UI mixes hardcoded illustration with API-sourced values. |

## Errors Encountered
| Error | Resolution |
|-------|------------|
| Plan had malformed duplicate verification checklist text from earlier exact replacements. | Rewrote the plan cleanly and retained completed phase outcomes. |
| One Preview wait for mobile surface timed out after the UI had already transitioned. | Took a fresh browser snapshot; mobile screen was available and tested. |
| One browser click used a stale uid after a persona transition. | Took a new snapshot and used current ids. |

## Notes
- Selected plan: `.planning/2026-09-27-central-bank-account-overview-and-vps-re/`.
- Persona playtest records the UI’s demo switching behavior; client-side persona switching is not security enforcement.
- Follow-up changed only persona configuration/labels plus documentation. Keep the user on the seven-role preview for further feature selection.
