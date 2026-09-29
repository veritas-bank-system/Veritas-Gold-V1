# P0 Current Architecture Status — Evidence Reconciliation

**Reviewed:** 2026-09-28
**Status:** Current source review; not an architecture approval or security audit.
**Reconciles:** [`master_platform_architecture_and_working_inventory.md`](master_platform_architecture_and_working_inventory.md), [`icp_canister_suite_architecture_function_audit_and_valuation_advisory.md`](icp_canister_suite_architecture_function_audit_and_valuation_advisory.md), the root README snapshot, and the current source tree. Originals and archive copies are preserved unchanged.

> **Executive status:** The checked-out application is a demo workstation backed by an ordinary Rust/Axum HTTP process and in-memory state. Several legacy architecture documents describe a target ICP canister/banking system as already deployed or operational. The inspected manifests and source do not substantiate those assertions. Treat this system as local Demo/Sandbox only; do not expose state-changing routes publicly or use them for real money or assets.

## Current architecture, supported by source

| Layer | Current evidence | Reconciled status |
|---|---|---|
| Web client | `frontend/package.json` uses React, TypeScript, and Vite. `frontend/src/App.tsx` selects React views and polls API functions. | Web application with desktop/tablet/phone-style browser surfaces. These do not establish a native Android application. |
| FX reference data | `frontend/src/services/api.ts` defines the Frankfurter latest EUR reference-rate URL and a fetch/parse function. | One external reference-rate path is present in frontend source. This is not an executable quote, settlement instruction, or verified ECB integration. |
| Rust domain libraries | Root `Cargo.toml` lists ten workspace crates. `crates/domain`, ledger, policy, identity, and coordinator crates implement types and selected in-process transitions. | Useful domain/library prototypes and unit tests; source review is not proof of network consensus, ICP deployment, or institutional authorization. |
| HTTP gateway | `crates/icp-canister-suite/Cargo.toml` depends on Axum/Tokio and the Rust domain libraries. `src/main.rs` initializes demo principals, ledgers, fixture records, and an Axum server. `src/server.rs::create_app` builds HTTP routes. | Native Axum executable, despite the crate name. The inspected crate manifest has no `ic-cdk` or `ic-stable-structures`; no canister entry points, generated Candid interface, `dfx.json`, or deployment config were found in the checkout. `candid` as a dependency alone does not prove canister behavior. |
| State and fixtures | `main.rs` seeds identities, accounts, offers, transactions, routes, canister-status text, liquidity pools, and bonds. `ServerState` stores collections in `Arc<RwLock<Vec<_>>>`. Several route handlers return fixed JSON. | Process-local demo state; a process restart loses mutations. Many realistic-sounding market, custody, subnet, SWIFT, backing and operational fields are fixture values, not independently sourced evidence. |
| Security boundary | `create_app` uses `CorsLayer::allow_origin(Any)` and `main.rs` binds `0.0.0.0`. Reviewed route construction exposes writes without visible authentication/authorization middleware. `App.tsx` initializes a persona client-side; `InstitutionalLoginSurface.tsx` runs timed UI steps and invokes its callback rather than verifying credentials. | Do not expose the API to an untrusted network. Client-side persona/environment selection is not identity, authorization, tenant isolation, or maker-checker enforcement. |
| Verification screen | `frontend/src/components/views/MvpVerificationSuiteView.tsx` advances through steps using `setTimeout`, randomized display times, and hard-coded success strings; no backend test invocation appears in that component. | A presentation/demo animation, not an acceptance-test runner or evidence of login, canister deployment, settlement latency, signer quorum, PoR, or compliance. |
| Physical reserve/supervision | `ProofOfReserveTelemetry.tsx` supplies fallback values and a “verified” presentation; API/source includes fixture telemetry and hard-coded supervision data. | No physical sensor, custodian, or independent reserve attestation was established in this review. A hash-shaped string is not evidence of assets or a valid attestation. |
| Standards and connectors | Route names and fixture fields mention ISO 20022, DTI, SWIFT, canister IDs, and finality. The inspected route implementations return JSON/CSV or fixed mappings. | Labels/mappings are not official identifier registrations, standards conformance, live SWIFT/RTGS connectivity, ICP network receipts, or settlement finality. |
| Data store/integrations | The inspected Rust workspace manifest contains no PostgreSQL/SQLx persistence dependency. No live SWIFT, custodian, market venue, FRED or vault interface was found in the source reviewed. | Persistent bank-of-record storage and those external integrations remain unverified/not present in reviewed implementation. |

## Material contradictions in archived architecture/status claims

The preserved originals include claims such as “100% Operational & Production-Ready,” deployed ICP canisters, Candid/stable memory, live custody/reserve telemetry, real SWIFT ramps, real-time BFT quorum, FIPS authentication, immutable finality, or “live & connected” coverage. This review found no evidence supporting those claims in the present code. In particular:

1. **Platform/runtime:** target architecture prose says native ICP canisters; current server is a native Axum process. Do not use “canister” for this server until actual canister artifacts and deployment evidence exist.
2. **Capability status:** the endpoint/screen names create the impression of full integration, while the implementation initializes fixtures and local process state. Reclassify each such feature as `Demo fixture`, `Implemented library behavior`, `External reference input`, `Not implemented`, or `Unverified`.
3. **Security controls:** a UI-authentication animation and persona selector do not implement WebAuthn, FIPS validation, cryptographic signer authentication, server RBAC/ABAC, or quorum policy.
4. **Ledger semantics:** passing library tests does not prove atomic end-to-end settlement. Current routes can mutate one in-memory domain before a later operation fails; financial parsing includes `f64` paths.
5. **Operations:** “healthy,” “operational,” canister IDs/status, balances, pricing, and reserve/telemetry text in seeded or fixed routes must carry explicit synthetic provenance.
6. **Mobile:** responsive/browser-device UI is not a native Android app. Android deliverable evidence (project/build/package/signing/test artifacts) was not found.

The cross-project findings and change-history context are in [`../08-findings-and-history/project-wide-findings-and-changelog-review.md`](../08-findings-and-history/project-wide-findings-and-changelog-review.md). The program roadmap retains the P0 implementation gates in [`../00-overview-and-governance/veritas_bank_program_overview_and_step_by_step_roadmap.md`](../00-overview-and-governance/veritas_bank_program_overview_and_step_by_step_roadmap.md).

## Required P0 architecture actions

- [ ] Label every screen, API response, generated report and fixture with an unmistakable Demo/Sandbox state and data provenance.
- [ ] Disable/remove production/mainnet controls until a real approved production target exists.
- [ ] Keep the API local/private; replace wildcard CORS and all-interface binding only as part of a reviewed network/security change. Add server-side authentication, authorization, account/tenant scope, rate/size limits, and audit trails before any external exposure.
- [ ] Make financial operations durable, exact-decimal, idempotent, transactional and failure-safe; do not report “Finalized” from fabricated receipts.
- [ ] Decide whether the target is a conventional service or ICP. If ICP is intended, implement actual CDK entry points, Candid interfaces, stable state, local-replica tests, upgrade strategy, and reproducible testnet deployment evidence as separate verifiable deliverables.
- [ ] Replace hard-coded reserve, market, counterparty, network and identity claims with deterministic fixtures visibly marked synthetic, or connect approved evidence-bearing providers.
- [ ] Update legacy source docs only through reviewed follow-up edits; preserve their originals/history and keep this evidence-based companion current.

## Review method and limits

Reviewed source/manifests: `Cargo.toml`, `crates/icp-canister-suite/Cargo.toml`, `crates/icp-canister-suite/src/main.rs`, `crates/icp-canister-suite/src/server.rs`, `frontend/package.json`, `frontend/src/App.tsx`, `frontend/src/components/auth/InstitutionalLoginSurface.tsx`, `frontend/src/components/views/MvpVerificationSuiteView.tsx`, and `frontend/src/components/views/ProofOfReserveTelemetry.tsx`. This was a static documentation reconciliation on the checked-out source. No application tests, live integrations, ICP replica, Android build, external service, production host, or deployment was exercised for this review.