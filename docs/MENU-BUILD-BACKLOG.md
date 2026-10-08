# Veritas Gold — Menu Build Backlog

Master to-do list for implementing [VERITAS-GOLD-MENU-SPECIFICATIONS.md](VERITAS-GOLD-MENU-SPECIFICATIONS.md)
across the Central Bank workspace. Each phase is a separately verified tranche.
Rule for every item: banking-vertical-ui law (separate API client, loading/empty/error/
confirmation/audit states, **zero fabricated data**), Common Page Contract strip on every
page, and the five build gates before any commit.

Legend: ✅ done · 🚧 in progress · ⬜ queued

## Phase 0 — Governance ✅
- ✅ Persist the detailed menu catalogue → `docs/VERITAS-GOLD-MENU-SPECIFICATIONS.md`
- ✅ This backlog document (single to-do list for all tranches)

## Phase 1 — Common Page Contract ✅
- ✅ `PageContextStrip` shared component (workspace/institution, persona+role, environment,
  ledger status, permission scope, data freshness + stale warning, pending approvals,
  active incidents, Export Evidence, audit reference)
- ✅ `sessionAudit` service — in-session, hash-chained client events for the audit trail
  (login, persona switch, evidence export, unmask audit), sessionStorage-backed

## Phase 2 — De-alias the worst offenders ✅
- ✅ `RiskDashboardView` (nav `compliance`) — exposure by institution/product/currency from
  live accounts+holdings; limits/breaches sections with honest empty states until P3
- ✅ `ExposureLimitsView` (`cb_limits`, alias removed) — limit registry, utilization,
  temporary exceptions with expiry, proposals (client-side drafts, proposer ≠ approver)
- ✅ `StressTestingView` (`cb_stress`, alias removed) — 8 spec scenarios, builder, honest
  "simulation engine not connected" run state
- ✅ `AccessLogsView` (new `access_logs` nav id; institutional chat keeps `secure_chat`) —
  filterable event table, in-session events only, "server audit trail not connected" state

## Phase 3 — Remaining de-aliased views ⬜
- ⬜ **Payments & ISO 20022** (`iso20022_bridge`, currently FX view): message explorer,
  validation/repair queue, screening status, approvals, audit trail (needs P5 message store)
- ⬜ **Delivery & Transfers** (`trade`, currently RFQ desk): transfer queue, chain-of-custody
  timeline, bar-level evidence, holds/exceptions
- ⬜ **Statements & GL** (`statements_gl`, currently shared accounting view): account
  hierarchy, journal queue, period close, posting approvals
- ⬜ **Valuation & P&L** (`cb_valuation`): price-source comparison, realized/unrealized P&L,
  lock/approval workflow
- ⬜ **Regulatory Reports** (`cb_reg_reports`): reporting calendar, validation, approval +
  submission states, corrections, evidence archive
- ⬜ **Audit Center** (`cb_audit`): global event search, timeline, entity history, evidence
  validation, export builder (needs P5 audit-event source)
- ⬜ **Institutions** (`enterprise_admin`, currently enterprise-admin overview): registry,
  onboarding, scope assignment
- ⬜ **Users & Roles** (`identity_admin`, shared with Counterparties): role matrix,
  SoD conflicts, recertification, sessions
- ⬜ **Mandates & Policies** (`cb_mandates`, currently maker-checker): policy catalogue,
  versioning, exceptions with expiry
- ⬜ **Counterparties** (`identity_admin` CB de-alias): registry, KYC/AML/sanctions states,
  document expiry, eligibility workflow
- ⬜ **Settlement Accounts** enhancement (`settlement_instruments`): verification queue,
  signatories, rail mapping, restrictions
- ⬜ **System Configuration — Bonds** (`canister_mgmt`): instrument master, calendars,
  day-count, versioned config releases with approvals

## Phase 4 — Cross-menu access model ⬜
- ⬜ SoD conflict matrix detection (8 conflict pairs from the spec) in access-request flow
- ⬜ Access-request lifecycle (12 steps incl. dual approval, expiry, recertification)
- ⬜ Role-based action gating on every sensitive control (11-role matrix from the spec)
- ⬜ Emergency suspension panel (scope/reason/duration/incident ref/review deadline/audit)

## Phase 5 — Backend sources (Rust, banking-rules review required per item) ⬜
- ⬜ Audit/access-event endpoint (append-only, hash-chained) backing Access Logs + Audit Center
- ⬜ Limits engine (proposals, dual approval, versioning, automatic expiry)
- ⬜ Stress-scenario store + deterministic simulation runner
- ⬜ ISO 20022 message store + validation/screening pipeline (banking-payment-messaging skill)
- ⬜ Auth guard for `/api/v1/admin/*` (supervision endpoint is currently unauthenticated)
- ⬜ GL/journal + valuation + regulatory-report persistence

## Definition of done (per tranche)
- tsc, oxlint, production build all clean; preview walkthrough of every touched view with
  all states exercised; no fabricated data anywhere; evidence export real; sidebar/deep
  links intact; tour-script compatibility checked.
