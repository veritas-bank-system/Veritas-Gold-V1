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

## Phase 3 — Remaining de-aliased views ✅ (complete: 7d73d81 + 744785c + third tranche)
- ✅ **Payments & ISO 20022** (`cb_iso20022`, own view `Iso20022PaymentsView`)
- ✅ **Delivery & Transfers** (`delivery_transfers`, institutional RFQ desk untouched)
- ✅ **Access Logs** on the server audit chain (`access_logs`)
- ✅ **Statements & GL** (`statements_gl`): per-currency trial balance, masked account
  hierarchy, 1:1 GL journal from real transactions, maker-step period close
- ✅ **Valuation & P&L** (`cb_valuation`): live-feed price-source comparison; cost basis
  and P&L honestly withheld (Phase 5 engine); valuation snapshot lock (maker step)
- ✅ **Regulatory Reports** (`cb_reg_reports`): calendar, drafts from ledger aggregates,
  validation, submission recording (checker + authority Phase 5), evidence export
- ✅ **Audit Center** (`cb_audit`): chain-verified header, global search, timeline,
  entity before/after history, scoped export builder re-attesting to the chain
- ✅ **Institutions** (`cb_institutions`): live identity registry, onboarding queue,
  scope proposals (maker step)
- ✅ **Users & Roles** (`cb_users_roles`): role matrix, 8 spec SoD pairs evaluated live
  (violations / separate / not-present — never silently clean), recertification proposals
- ✅ **Mandates & Policies** (`cb_mandates`): catalogue of enforced mandates, amendment
  drafts (editor ≠ publisher), exceptions with owner + expiry + justification
- ✅ **Counterparties** (`cb_counterparties`): registry joined with settlement accounts;
  KYC/AML/sanctions shown as NOT SCREENED (no engine) — never falsely clear
- ✅ **Settlement Accounts** (`settlement_accounts_config`): verification queue, rails
  derived from observed finalized traffic, restrictions from real limits
- ✅ **System Configuration — Bonds** (`cb_bond_config`): instrument master from live
  contracts, configured coupon frequencies/ACTUS types, config release proposals
- 🔒 **Build badge** on the Common Page Contract strip: served bundle hash visible on
  every page (stale-cache failure mode made observable)

## Phase 4 — Cross-menu access model ⬜
- ⬜ SoD conflict matrix detection (8 conflict pairs from the spec) in access-request flow
- ⬜ Access-request lifecycle (12 steps incl. dual approval, expiry, recertification)
- ⬜ Role-based action gating on every sensitive control (11-role matrix from the spec)
- ⬜ Emergency suspension panel (scope/reason/duration/incident ref/review deadline/audit)

## Phase 5 — Backend sources (Rust, banking-rules review required per item) 🚧
- ✅ Audit/access-event endpoint (append-only, hash-chained) backing Access Logs + Audit
  Center — shipped in `7d73d81` (in-memory; see P5 persistence item below)
- ⬜ Audit-chain persistence (currently in-memory journal, resets on restart)
- ⬜ Limits engine (proposals, dual approval, versioning, automatic expiry)
- ⬜ Stress-scenario store + deterministic simulation runner
- ⬜ ISO 20022 message store + validation/screening pipeline (banking-payment-messaging skill)
- ⬜ Auth guard for `/api/v1/admin/*` (supervision endpoint is currently unauthenticated)
- ⬜ GL/journal + valuation + regulatory-report persistence

## Definition of done (per tranche)
- tsc, oxlint, production build all clean; preview walkthrough of every touched view with
  all states exercised; no fabricated data anywhere; evidence export real; sidebar/deep
  links intact; tour-script compatibility checked.
