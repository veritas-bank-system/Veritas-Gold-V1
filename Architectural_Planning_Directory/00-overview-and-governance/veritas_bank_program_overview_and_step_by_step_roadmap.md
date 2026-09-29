# Veritas Bank — Whole-Program Inventory & Step-by-Step Delivery Roadmap

**Status:** Planning baseline; not an approval to operate a bank, issue money/securities, custody assets, or settle real transactions.

**Checkout reviewed:** branch `main`, 2026-09-28. The working tree already had extensive edits and untracked files before this document; this work does not claim ownership of or change those files.

**Purpose:** Give product, engineering, security, operations, legal/compliance, and institutional partners one checkable roadmap based on the repository as inspected.
**Status key:** `Verified in code` means source was inspected or a check was run. `Documented aspiration` means an existing spec says it is planned/desired. `Unverified` means no implementation or evidence was found in this review. `Blocked` means a named prerequisite is missing.

> **Truthful operating boundary:** The current repository is an institutional workflow / ledger demonstration. Treat every environment as Demo/Sandbox until separately evidenced and approved. Do not enable or imply production or mainnet, live RTGS/SWIFT, real deposits, asset backing, custody, regulated trading, independent finality, compliance certification, or central-bank authority based on labels, demo data, a local build, or a test passing. No deployment was performed for this review.

## 1. Executive overview

The repository contains a React 19 + TypeScript + Vite browser workstation, an Axum/Tokio HTTP server and domain/ledger Rust workspace, a mobile-sized web presentation, operational shell scripts, a separate NVIDIA AI-gateway MCP program, and a large set of Markdown specs. The system is currently useful for demonstrating workflows and exercising selected domain invariants. It is not a live bank platform.

### Current inventory, evidence and confidence

| Program / service | What exists in this checkout | Verified status and limits |
|---|---|---|
| Browser workstation | `frontend/src/App.tsx`; 57 TSX files under `frontend/src`; React/TypeScript/Vite; account, holdings, identity, RWA/RFQ, FX reference, collateral, bond/auction, approval, reporting, custody/telemetry, liquidity, bridge, canister-management, and operations-style screens. | **Verified:** frontend production build passes. A 792.98 kB minified main JS chunk triggers Vite's >500 kB advisory. Screens are not evidence that the represented real-world service exists. Several components contain static data/claims. |
| Rust domain/workspace | Ten Cargo workspace members: `domain`, `policy-engine`, `finality-authority`, `settlement-engine`, `identity-registry`, `position-ledger`, `asset-ledger`, `protocol-coordinator`, `icp-canister-suite`, `shared-testkit`. | **Verified:** selected financial invariants and library functions have unit/shared-testkit coverage. The crate name `icp-canister-suite` is not proof it builds a canister. No `ic-cdk`, `ic-stable-structures`, `dfx.json`, Candid interface, or canister deployment workflow was found. |
| HTTP backend | `crates/icp-canister-suite/src/main.rs` starts an Axum server; `src/server.rs` defines `/health` and `/api/v1/*`. | **Verified:** this is a native HTTP simulation using in-process `Arc<RwLock<...>>` and seeded fixtures; restart loses in-memory changes. No production identity/session authorization middleware was found in router setup. CORS permits any origin. Mutation routes should be treated as unsafe demo endpoints, not exposed publicly. |
| Demo API/data | Accounts, holdings, offers, transactions, approvals, collateral, auctions, telemetry, bridge routes, canister status, pools, bonds. | **Verified:** server seed data includes invented-looking institutional/custody/network values. Some reporting fields name SWIFT, ISO 20022, canisters, or hashes without corresponding live connector/evidence. The supervision route returns constants. Fixture provenance needs to be visible end-to-end. |
| FX reference rates | `frontend/src/services/api.ts` fetches Frankfurter ECB reference data directly from the browser for EUR USD/CHF/GBP, validates response fields, records provider/date/retrieval time; converter labels are indicative. | **Verified in source; prior related planning notes report an HTTP 200 live response on 2026-09-25, not re-tested in this review.** Reference-rate data is not an executable quote, bank rate, trade, or settlement. Gold remains a local fixture; no validated gold/custody feed is evidenced. |
| Android / mobile | `frontend/src/MobileAppPrototype.tsx`, `frontend/src/components/mobile/InstitutionalMobileSurface.tsx`, URL/device modes. | **Verified:** mobile web/demo surface exists. **Not found:** Android Gradle project, Kotlin/Java source, `AndroidManifest.xml`, APK/AAB, Android CI/signing configuration. Do not describe it as a native Android app yet. Historical local playtest notes report synthetic cash/approval inconsistencies and simulated action handlers in this UI. |
| AI gateway | `ai-gateway/server.py`, MCP configuration/schemas, `ai-gateway/test_ai_gateway.py`; NVIDIA-only model routing is prescribed by root project instructions. | Separate developer/productivity integration; **not evidence that user-facing Veritas banking workflows use AI**. In this review, 12 tests passed with warnings treated as errors. If application AI is later introduced, keep it on the configured NVIDIA `ai-gateway`, identify actual model/provider, and prohibit AI from authorizing or executing a financial action. |
| Hosting/run paths | `deploy_web_showcase.sh` builds frontend and Rust binary and starts the Axum server with `/health` wait. `setup_and_run_vps.sh` serves only the static `frontend/dist` directory using Python's HTTP server. | Demo utilities only. The second script does not start the API. Neither script supplies TLS, authentication, persistence, hardened deployment, monitored process management, or production authorization. Do not run scripts on shared/production hosts without review and explicit authorization. |
| Tests/CI | Cargo unit tests; Python unittest-based AI-gateway suite; frontend build/lint commands. | **Verified:** `cargo test --workspace` passed 12 Rust tests; `python3 -W error ai-gateway/test_ai_gateway.py` passed 12 tests; frontend build passed; Oxlint passed with 13 warnings. **Not found:** frontend test script/test files, CI workflow YAML, browser E2E harness, native Android tests, testnet deployment tests. `cargo fmt --check` and strict Clippy did not pass (details in §3). |
| Architecture/planning docs | `MDFILES/` contains architecture, status, production, security, standards, privacy, deployment and workflow specs; `.planning/2026-09-27-central-bank-account-overview-and-vps-re/` has implementation/playtest artifacts. | Many Markdown files describe goals as if verified production capabilities. This plan is the current planning baseline; preserve historical records, but revise unsupported present-tense claims and add source/evidence/date to future updates. No directory literally named “Architectural Planning” was found; `MDFILES/` is treated as the architecture-planning directory. |

### Product surfaces/modules included in the plan

The current interface and API organize demonstrations around accounts/cash; assets/holdings; identity; RWA market/offer/RFQ; FX reference conversion; settlement instruments; bond factory/auction/corporate actions; collateral; governance approvals; vault telemetry/proof-of-reserve; liquidity sweep/pools; external bridge routes; canister dashboards; reporting exports; supervisory/admin views; and mobile/tablet presentation. The Roadmap covers these as separate workstreams but labels an item “implemented” only when the actual contract/data source, tests, and operational evidence support it.

## 2. Stop-the-line findings (do these before expanding the demo or exposing it)

- [ ] **Remove false authority/environment affordances:** production/mainnet selectable labels or badges must not imply that a real environment is configured. The checked login component offers `PRODUCTION`; the account page has a sandbox disclaimer, but historical screenshot notes conflict with current branch. Compare deployed artifact/commit and current source before release; make inaccessible environments unmistakably disabled.
- [ ] **Authentication and tenant isolation:** default `App.tsx` persona is `PERSONA_LIST[0]`; browser role switching is UI state. No evidence found of authentication/session verification or backend authorization. Add server-enforced identities, scoped accounts, least privilege, role/attribute policies, revocation, and maker-checker separation before any non-local network exposure.
- [ ] **Financial mutation safety:** audit every handler. For example, `execute_rfq_trade` debits an account before issuing the asset and can leave a partial result if the second step fails; offer/collateral arithmetic parses `f64`. Make operations atomic/idempotent, use exact decimal domain types end-to-end, reserve before execution, and test failures/races before retaining an execution-like control.
- [ ] **Persistence and audit:** `RwLock` state and server fixtures are process memory. Add durable authoritative state, transactional event/journal semantics, immutable/auditable action history, backups, migrations, and reconciliation before calling it a ledger service.
- [ ] **Fixture cleanup and evidence:** remove or explicitly label all invented BIC/LEI/institution names, balances, gold backing, ratings, market depth, offers, approvals, vault sensors, subnet/canister telemetry, quorum, SWIFT references, finality receipts, “verified production,” and regulatory statements. Provide a source, as-of time, owner, and evidence link for each real datum.
- [ ] **Exposed credential review:** related local `.agents` handoff artifacts include credential-like material, while `.env` exists as an untracked file. Do not copy values into plans or logs. Check ignore rules, scan working tree and relevant history, revoke/rotate any still-valid key, and move secrets to approved secret storage. Never publish these local artifacts.
- [ ] **Reconcile old UI/deployment:** a user screenshot showed Mainnet; current branch source labels sandbox. Pin screenshot/build to its URL, artifact hash and source commit, inspect static hosting/VPS cache and service version, then establish one artifact provenance chain. No claim that the screenshot reflects this checkout.
- [ ] **Android scope:** decide whether “Android” means a native app, managed web app/PWA, or responsive web surface. Current evidence supports mobile web only. Do not count the handset simulator as an Android deliverable.
- [ ] **Mainnet hold:** do not deploy, bridge funds, issue assets, or connect payment rails until every production gate in §10 is signed by accountable legal, security, operations, issuer/custodian, and participant owners.

## 3. Baseline verification performed for this plan

| Check | Result | Interpretation |
|---|---|---|
| `cargo test --workspace` | PASS — 12 Rust tests, no failures. | Useful library-level checks; not HTTP endpoint/API/authorization/canister/mainnet tests. |
| `cd frontend && npm run build` | PASS — TypeScript project build + Vite bundle. | Compile/build only; not browser behavior or correctness of displayed values. |
| `cd frontend && npm run lint` | PASS — 0 errors, 13 warnings. | Warnings include hook dependency/state-in-effect and component export issues; resolve/triage and track baseline. |
| `python3 -W error ai-gateway/test_ai_gateway.py` | PASS — 12 tests. | AI gateway mock/loopback and protocol tests; no external inference endpoint tested by this run. |
| `cargo fmt --check` | FAIL — formatting differences in `crates/icp-canister-suite/src/lib.rs`, `src/server.rs`, and `crates/settlement-engine/src/lib.rs`. | No Rust source was autoformatted as part of this documentation task; schedule formatting in a separately reviewed code change. |
| `cargo clippy --workspace --all-targets -- -D warnings` | FAIL — 9 `useless_borrows_in_formatting` diagnostics in `crates/icp-canister-suite/src/server.rs`. | Existing warnings promoted to errors; schedule cleanup and strict CI. |
| `git diff --check` | Not independently isolated from the whole existing working tree at the time of check. | Run after reviewing staged/specific doc hunks; avoid attributing existing whitespace issues to this documentation task. |
| Android / CI / ICP artifact discovery | No Android project/manifest/Gradle, CI workflow YAML, `dfx.json`, Candid file, or ICP CDK dependency found. | Treat those programs as not yet created, not as failed deployments. |

## 4. Sequenced master checklist

Keep task ownership explicit. Suggested owners are role labels, not assigned people: `Product`, `Legal/Compliance`, `Security`, `Backend`, `Frontend`, `Mobile`, `SRE/Operations`, `Institution/Partner`. Track each item with owner, issue/link, target date, status, evidence URL, and reviewer in the project tracker. No delivery date is assumed here.

### Phase 0 — Define the service and freeze unsafe implications (P0)

- [ ] 0.1 Name the legal operating entity, product owner, technical operator, data controller/processor, and contracting partners.
- [ ] 0.2 Define intended user, use case, asset class, money flow, custody/title model, execution/settlement role, jurisdictions, and whether the platform only orchestrates or itself provides a regulated service.
- [ ] 0.3 Obtain qualified jurisdiction-specific legal classification and licensing/partner analysis before offering deposits, e-money, securities, exchange/MTF, custody, payment, clearing/settlement, crypto-asset, or FMI services.
- [ ] 0.4 Decide the two primary product personas. Recommendation for planning: **Central Bank** plus **Commercial Bank Treasury / Primary Dealer**. If the intended second user is an institutional investor/agency instead, record that decision and adjust entitlements/workflows before narrowing the login. This is a product decision, not an assumed fact.
- [ ] 0.5 Define environment semantics: `Demo` (synthetic/no value), `Integration Sandbox` (partner/test credentials only), and `Production` (not configured until gated). Remove UI controls for unavailable environments.
- [ ] 0.6 Establish a single verified capability matrix: feature, current implementation, data origin, environment, mutating/non-mutating, owner, tests, production prerequisites.
- [ ] 0.7 Inventory every page, API endpoint, script, stored field, external dependency, third party, key, domain, and service; tag it demo/live/unavailable and identify its accountable owner.
- [ ] 0.8 Audit local and deployed source commit/artifact; document the screenshot/Mainnet badge discrepancy and supply-chain path.
- [ ] 0.9 Scan and rotate any valid exposed credentials. Keep secrets out of repository, docs, build artifacts, issue logs, screenshots and mobile bundles.
- [ ] 0.10 Publish an honest project status page and a demo disclaimer. Disable public access to unsafe state-changing endpoints until protected.

**Exit gate:** approved product/legal scope, named owners, explicit Demo/Sandbox boundary, no misleading Mainnet entry point, credential incident handled, complete capability inventory. No production build/deployment from an unresolved P0.

### Phase 1 — Product/domain, data, architecture and security design (P0)

- [ ] 1.1 Define domain vocabulary separately for account balance, available balance, approved credit, reserved/blocked funds, pending settlement, final settlement, instrument, quote, trade, instruction, approval and receipt.
- [ ] 1.2 Define source-of-truth per object (ledger/canister, bank, custodian, venue, external reference API, reporting projection); establish stable IDs, provenance, freshness, expiry and reconciliation owner.
- [ ] 1.3 Replace cross-persona browser state with server-derived identity/organization/mandate and per-tenant data access. Test direct requests to forbidden resources; hidden UI is not access control.
- [ ] 1.4 Produce threat model/abuse cases: compromised signers, insider/admin abuse, confused-deputy access, replay, duplicate messages, race/double execution, partial settlement, oracle manipulation, malicious client, supply-chain compromise, key loss, denial-of-service, data disclosure and unauthorized upgrade.
- [ ] 1.5 Specify authentication: institutional identity proofing, SSO/federation if required, phishing-resistant WebAuthn/passkeys or approved equivalent, step-up approval, service identity/mTLS, session expiry/revocation and recovery.
- [ ] 1.6 Specify RBAC + ABAC and segregation of duties: who can read, propose, edit, approve, execute, pause, export, administer and upgrade. Enforce maker ≠ checker and institution/account/resource scope at the server/domain boundary.
- [ ] 1.7 Specify exact-money arithmetic, currency scale, rounding policy, serialization, overflow limits, negative balance/credit semantics and independent reconciliation equations. Eliminate float use in financial paths.
- [ ] 1.8 Decide authoritative persistence and event model; specify transaction boundaries, locking/reservations, idempotency, outbox/inbox, retry, cancel/expire/reversal rules, append-only audit and correction workflow.
- [ ] 1.9 Define API contracts, schema/versioning, error model, rate limits, pagination, validation, idempotency and OpenAPI generation. CORS must be restricted to approved origins; apply request-size/body limits.
- [ ] 1.10 Choose platform architecture after comparing current Axum service with intended ICP deployment. A native Axum simulation and an ICP canister are different artifacts and runtimes; if ICP remains target, plan a real CDK/Candid/stable-memory canister implementation and test it separately.
- [ ] 1.11 Decide Android product target (native Android vs managed responsive web/PWA). Define user journeys, supported devices/OS, deployment/MDM, secure key use, push notifications, offline policy, accessibility and app-store constraints.
- [ ] 1.12 Create data classification, privacy/data-flow map, retention schedule, legal-hold process, data-subject request process, DPIA triggers and cross-border transfer/vendor list.
- [ ] 1.13 Define architecture decisions (ADR) and risk register with decision owner, expiry/revisit date and evidence.

**Exit gate:** reviewed threat model, architecture/ADR, domain/API/persistence design, two-persona decision, Android target, data classification and legal service boundary.

### Phase 2 — Make the Demo safe and truthful (P0/P1)

- [ ] 2.1 Put a persistent Demo banner/environment badge on every screen, report, exported file, notification, mobile route and API response. Carry environment in data provenance.
- [ ] 2.2 Replace fabricated production/custody/SWIFT/central-bank/PoR/canister/quorum/market-depth/ratings claims with clearly synthetic scenario data or unavailable states.
- [ ] 2.3 Remove/disable production selection, mainnet indicators and actions until a production environment exists. Add tests against accidental enabling via query param, local storage, build config, mobile route or stale cache.
- [ ] 2.4 Ensure every seeded fixture has a `fixture` marker, source label, scenario ID and generated/static date; add deterministic resettable scenarios. Do not mix seed rows with live responses without per-row provenance.
- [ ] 2.5 Keep external reference FX clearly indicative, show effective date/provider/retrieval time/stale condition, and isolate it from execution/payment prices. Evaluate provider terms, browser availability/CORS, rate limits and proxy/cache strategy for any broader service.
- [ ] 2.6 Fix mobile mock balances, approvals, local state drift and client-only approve/buy/reject handlers. Derive badges from the same data records; disable any real-looking mutations or label them as non-executable demo simulation.
- [ ] 2.7 Ensure exports carry Demo watermark, environment, as-of time, source and schema; prevent synthetic records from being represented as regulated accounting statements.
- [ ] 2.8 Remove guaranteed/zero-risk/sub-second/mainnet/compliance/certification/verified-production wording unless supported by evidence and approved legal copy.
- [ ] 2.9 Pin deployed UI to a build ID/source commit; expose a non-sensitive version endpoint and visible version; add cache invalidation/release verification.
- [ ] 2.10 Separate the static-only `setup_and_run_vps.sh` from API-backed showcase instructions. Add preflight warning and explicit opt-in; never silently use broad network binding for an unprotected API.

**Exit gate:** independent content review finds no unqualified live-funds/mainnet/compliance/backing/finality assertions; synthetic data is machine-identifiable and clearly marked; no unsafe mutation can be reached outside intended local demo.

### Phase 3 — Ledger/backend foundation (P0/P1)

- [ ] 3.1 Build persistence, schema migrations, backup/restore and deterministic test fixtures. Decide if the authoritative store is ICP state or a conventional database; do not run two conflicting sources of truth.
- [ ] 3.2 Add authenticated request context and enforced tenant/account ownership/mandate checks to every read and write route. Deny anonymous and malformed identities; remove fallback-to-demo-principal behavior.
- [ ] 3.3 Refactor API handlers into domain command/query services; validate input sizes, decimal scale, currency, entity existence, state transition and policy version.
- [ ] 3.4 Make transfer, RFQ, offer acceptance, issuance/redemption, bid, corporate action, collateral and bridge workflows transactional with reservation/lock, state machine, idempotency key, durable event, atomic commit/abort and outcome-unknown handling.
- [ ] 3.5 Fix partial-mutation risks such as debit-first RFQ before asset issuance. Add compensation only where legal/domain semantics permit; never report `Finalized` from a placeholder response.
- [ ] 3.6 Replace `f64` money/quantity/value calculations with exact decimal/integer minor units and checked rounding. Validate unit × quantity, fees, haircut, FX and bounds.
- [ ] 3.7 Replace `md5`/timestamp-derived hashes and hard-coded receipts with domain-appropriate cryptographic identifiers/digests, signed provenance and actual network receipts where applicable. A digest is not a signature or external proof.
- [ ] 3.8 Add journal semantics (debit/credit entries, balanced postings, unique external references), statements and reconciliation exceptions; retain the actor, before/after references, approvals, policy and correlation ID.
- [ ] 3.9 Add circuit breakers/timeouts/backoff, bounded work, concurrency controls, safe logging and structured metrics. Treat external call outcomes as possibly unknown and make requests idempotent.
- [ ] 3.10 Restrict CORS and network binding; add TLS via approved ingress/reverse proxy, secure headers, CSRF protection as applicable, quotas, body limits and security event logs.
- [ ] 3.11 Add read-only demo mode and reset route guarded against production use. Never expose test resets or mutable seed data in any production build.
- [ ] 3.12 If ICP is confirmed: implement actual canister entry points, Candid schemas, caller authorization, stable memory, bounded/paginated methods, upgrade migration tests, local replica harness, deployment config and reproducible WASM artifacts. Verify with ICP tooling before using “canister.”

**Exit gate:** persistent, authenticated, tenant-scoped, exact-value backend; rollback/duplicate/race tests pass; no fixture-only route can mutate a live ledger; operational audit is reconstructible.

### Phase 4 — Two-persona product and desktop/mobile workflows (P1)

- [ ] 4.1 Implement only the agreed Central Bank and Commercial Bank (or approved alternative) demo roles with policy-defined landing pages, route visibility, entity scope and action matrix.
- [ ] 4.2 Remove startup pre-authenticated Super Admin and impersonation language. Demo persona preview, if retained, must be a separately labelled simulator and never change a real authenticated claim.
- [ ] 4.3 Central Bank workflow: view participant/policy data with authorized scope; review rule/instrument proposals; policy approval, limits and supervisory actions only when supported by a real backend policy and independent authorization.
- [ ] 4.4 Commercial Bank workflow: own-entity accounts, liquidity, payment/trade drafts, RFQ/bids and status; approval and execution depend on mandate and server policy.
- [ ] 4.5 Build a common approval case file showing immutable action terms, originator, institution, account/counterparty, amount/currency, source data, checks, approvals required, expiry, risks and audit history. Any change invalidates approval.
- [ ] 4.6 Build responsive web workflows for desktop, tablet, narrow viewport and assistive technology. Ensure mobile shell, tables, touch, keyboard and screen-reader labels work; do not equate a simulator frame with an Android app.
- [ ] 4.7 If native Android approved: create Android application structure, dependency/permission inventory, secure auth and OS keystore integration, device posture/MDM policy, certificate pinning decision, privacy-safe push, secure screen handling, offline restrictions, tamper/debug policy, signing/release process, crash/telemetry consent and accessibility tests. No private signing key or secrets in app storage/bundle.
- [ ] 4.8 Add FCM/push only after threat/privacy design; a push notification must not approve or execute by itself. Deep links must re-authenticate and re-check current authorization.
- [ ] 4.9 Align accounts/approvals/market values across desktop and mobile from one server source; display stale/unavailable/empty distinctly.
- [ ] 4.10 Test persona access matrix, forbidden routes/actions, tenant isolation, browser refresh/deep-links, mobile device loss/session revoke, and high-value approval step-up.

**Exit gate:** both agreed personas have usable, server-enforced least-privilege workflows; every displayed amount is sourced or marked fixture; Android status is named accurately and target-specific criteria pass.

### Phase 5 — Reports, analytics and evidence (P1)

- [ ] 5.1 Define report catalogue, users, purpose, retention, authorization, owner, authoritative source and exact schema per report.
- [ ] 5.2 Implement transaction/position/account statements from the authoritative journal: opening, debits/credits, holds, pending items, closing, currency, value/booking dates, references, status and reconciliation marker.
- [ ] 5.3 Implement reconciliation reports against external bank, custodian, venue, network and internal projection; handle breaks, duplicate, missing, late, reversed, disputed and unknown outcomes with owner/SLA.
- [ ] 5.4 Implement operational reports: service and API availability, latency, error rates, queue depth, failed/unknown settlement, stale feeds, auth/policy denials, access review, privileged change, backup/restore and incident history.
- [ ] 5.5 Implement compliance evidence exports only for applicable approved needs; track source, data lineage, reviewer, evidence collection date, control, exception and retention. Do not call a screen an audit report/certification.
- [ ] 5.6 Implement institutional accounting/ISO 20022 exports using official schemas and test vectors for only the messages/versions in agreed scope. Validate with partner/network conformance suite; distinguish JSON demo mapping from valid ISO XML messages.
- [ ] 5.7 Add report signing, integrity checksum, generation ID, creator, timestamp/timezone, filters, environment and redaction metadata; preserve reproducibility and audit download.
- [ ] 5.8 Verify CSV injection protection, PDF rendering (if introduced), XML external-entity/parser defenses, access logs and cross-tenant export controls.
- [ ] 5.9 Reconcile documentation claims in `MDFILES/iso_standards_mapping_table.md` and `standards_mapping_iso20022_iso24165_openapi.md` with implemented schemas, actual registrations, licenses and conformance test evidence.

**Exit gate:** every report has a definition, authorized audience, source lineage, test vectors, integrity/audit record and no unsupported official status claims.

### Phase 6 — Security, privacy and supplier controls (P0/P1; continuous)

- [ ] 6.1 Approve security policies: secure SDLC, access control, asset inventory, data classification, cryptography/key management, vulnerability response, change management, logging, incident response, backup/DR and vendor risk.
- [ ] 6.2 Establish secrets management and rotation; scan source, history, issues, `.env`, generated bundles and CI artifacts; define breach notification/escalation procedure.
- [ ] 6.3 Use supported cryptography, HSM/KMS custody and separation of duties for signing/production keys; establish ceremonies, backup, rotation, revocation, recovery, quorum and compromise procedures.
- [ ] 6.4 Encrypt data in transit and at rest; inventory keys/certificates; least privilege; redacted structured logs; monitor anomalous access. Never put PII/private keys/secrets into immutable ledger unnecessarily.
- [ ] 6.5 Create data inventory/ROPA where required, DPIA screening, lawful basis and purpose limitations, processor/controller mapping, data-subject request workflow, retention/legal hold and verified deletion. Do not assert a blanket “10-year” rule or guaranteed GDPR compliance without counsel and data classification.
- [ ] 6.6 Perform dependency/SBOM/license and vulnerability management for Rust, npm, Python, Android (if created), containers and deployment images. Pin/review lockfiles and produce signed build provenance.
- [ ] 6.7 Harden endpoints, headers, rate limits, deserialization, authorization, SSRF, CORS, secret exposure and logs; threat-model integrations and untrusted financial messages.
- [ ] 6.8 Commission independent penetration test and architecture review before institutional pilot; for smart contracts/canisters obtain scope-appropriate independent audit/formal verification, remediate findings, retest and publish approved summary.
- [ ] 6.9 Define security incident severity, on-call, containment, evidence preservation, notification obligations, service isolation, signer/key compromise actions, recovery and tabletop tests.
- [ ] 6.10 Review third parties: market data, cloud/VPS, AI gateway, identity/KYC, sanctions, custody, network, payment rail and support; record data location, subprocessors, contracts, exit plan, availability, security evidence and concentration risk.
- [ ] 6.11 If user-facing AI features exist, document feature/model/provider (NVIDIA gateway only per repository rule), prompt/data retention, evaluation, access, human review, abuse, output citations, incident controls, and prevent AI from final approval or trading.

**Exit gate:** risk treatment and audit evidence accepted; no unresolved critical/high issues for pilot; keys, data, vendors and incident processes have named accountable owners.

### Phase 7 — Compliance applicability and readiness program (begin early; not a coding-only task)

**This is a screening/mapping plan, not legal advice or a declaration that any framework applies or is met.** Qualified counsel/compliance must identify the entity, jurisdictions, services, customer/data categories, criticality, outsourced ICT role and competent regulator. Record applicability as `Applicable`, `Not applicable with rationale`, or `Needs advice`; name the accountable control owner and evidence. Do not call SOC 2 a certification.

- [ ] 7.1 Create regulatory perimeter memo by legal entity/service/country: deposit/e-money/payment, investment/venue/brokerage, custody, securities issuance, crypto-asset, clearing/settlement/FMI, critical ICT provider and cross-border activity.
- [ ] 7.2 Build a control register: requirement → risk → control statement → owner → system/process → evidence → frequency → exception/remediation → test → auditor/regulator mapping.
- [ ] 7.3 **SOC 2 (if customer/procurement scope justifies):** AICPA Trust Services Criteria scoping; security baseline; optionally availability/confidentiality/processing integrity/privacy criteria. Define system boundary/subservice organizations; evidence collection; control design/ownership; access/change/incident/vendor/backup controls; readiness gap assessment; independent CPA examination. Type I is point-in-time design/implementation; Type II tests operating effectiveness across an agreed review period. Do not claim SOC 2 report until the independent report exists and its scope is accurately described.
- [ ] 7.4 **DORA (if in scope):** determine whether Veritas is an EU financial entity, an ICT service provider to one, or otherwise captured by contractual/third-party requirements. DORA has applied since 17 January 2025. Map ICT risk management, governance, asset/dependency inventory, incident classification/reporting, resilience testing, backup/recovery, third-party ICT risk/register/contracts, concentration/exit, audit/access and (for designated critical ICT providers) oversight. Build an evidence-backed register and contractual allocation; do not imply registration/designation automatically.
- [ ] 7.5 **Privacy:** evaluate GDPR (EU/EEA) and Swiss FADP; other local privacy laws as relevant. Identify controller/processor roles, lawful basis, minimization, notices, rights, DPIA, processor terms, cross-border transfers, retention/deletion/legal hold, breach response and access logs. Immutability requires data-protection architecture/legal review, not a claim that hashes are automatically anonymous.
- [ ] 7.6 **Cyber/operational resilience:** evaluate NIS2 and national implementation only if entity/activity/scope matches; consider ISO 27001 ISMS, ISO 22301 continuity and ISO 27701 privacy as voluntary/contractual framework choices; map NIST CSF/SSDF or CIS controls as engineering baselines. Certificates/attestations require defined scope and independent assessment.
- [ ] 7.7 **Financial sector:** evaluate MiFID II/MiFIR, MiCA, DLT Pilot Regime, CSDR, EMIR, Prospectus/Market Abuse, AML/CFT, sanctions, travel rule, outsourcing/cloud, records, safeguarding/custody and licensing only for the actual legal model/markets. Engage central-bank/payment-system operators before RTGS scope.
- [ ] 7.8 **SWIFT:** SWIFT Customer Security Controls Framework is relevant only if the entity participates/connects to SWIFT or contractually inherits controls; obtain authorized connectivity, CSP assessment and network tests. Current fields named `swift_*` are not a SWIFT connection.
- [ ] 7.9 **PCI DSS:** only if payment-card account data enters scope; minimize scope and use certified third party where possible. A virtual card mock is not payment-card processing.
- [ ] 7.10 **ISO 20022 / ISO 24165 / ACTUS / FIX / FpML:** treat as message, identifier, contract-model or protocol standards—not proof of licensing, production interoperability, financial stability, settlement finality, or certification. Obtain official identifier assignments and conformance evidence where relevant.
- [ ] 7.11 **FMI expectations:** if legal/functional classification indicates a financial market infrastructure or systemically important service, obtain counsel/supervisor advice on CPMI-IOSCO PFMI, settlement finality, governance, participant default, liquidity, custody and operational-risk expectations; do not self-declare compliance.
- [ ] 7.12 **AI laws/controls:** if AI becomes user-facing or affects decisions, counsel should scope EU AI Act and other applicable AI/privacy/consumer rules; classify risk and require human oversight, traceability, evaluation, data controls and model/vendor governance.
- [ ] 7.13 Schedule internal control testing, evidence sampling, independent gap assessment, remediation and management sign-off. Record residual risks and exceptions.

**Exit gate:** counsel/compliance-approved applicability matrix, named control owners, evidence repository, completed scoped gap assessment, independent assurance plan and no unsupported claim of compliance/certification.

### Phase 8 — Testing and CI quality gates (start now; required for every change)

- [ ] 8.1 Add CI on every pull request: Rust format, Clippy, workspace unit/integration tests; frontend typecheck/build/lint/tests; AI gateway tests; dependency/security/SBOM scans; secret scan; docs/link check as feasible.
- [ ] 8.2 Preserve current baseline results from §3; remediate Rust format/Clippy failures and triage 13 frontend lint warnings. Treat known exceptions as time-limited tracked debt, not permanent hidden baseline.
- [ ] 8.3 Rust domain tests: decimal boundaries/rounding/overflow, currency scale, balance conservation, overdraft/limits, account status, identity/mandate, policy, signature separation, idempotency, duplicate/replay, record consumption and state transitions.
- [ ] 8.4 Protocol/integration tests: happy path + every intermediate failure; debit/credit symmetry; atomic DvP; retries/timeouts/outcome unknown; concurrent duplicate commands; lock expiry; crash/restart; corrupted persistence; rollback/recovery; reconciliation.
- [ ] 8.5 Axum API tests with `tower::ServiceExt`: every endpoint status/schema, unauthenticated denial, authorization matrix, tenant isolation, invalid/oversized inputs, exact arithmetic, CORS, content type, idempotency, concurrent requests, persistence and error behavior. No test should issue external funds.
- [ ] 8.6 Frontend unit/component tests for data mapping, loading/empty/error/stale states, source/timestamp, price formatting, input validation, accessibility and safe disabled states. Introduce a maintained React test stack only after selecting/approving it for this repository.
- [ ] 8.7 Browser E2E tests for the two approved personas, key account/approval/report flows, responsive desktop/tablet/phone, offline API, stale rates, keyboard/accessibility, refresh/deep link, forbidden routes and environment lockouts. Use deterministic fixtures and non-mutating tests by default.
- [ ] 8.8 Regression tests for known issues from `.planning/2026-09-27-central-bank-account-overview-and-vps-re/findings.md`: fake auth and persona-switch boundary, admin controls for read-only users, inconsistent mobile balances/approval counts, unsupported KPI data, 390px shell clipping and stale deployment mismatch.
- [ ] 8.9 Android tests only after native app decision: unit/instrumented/UI tests, supported API levels/devices, offline/session expiry, lost-device revoke, secure storage, accessibility, deep links, signing/release and MDM policy. If web/PWA, use web E2E/manifest/service-worker/security tests instead.
- [ ] 8.10 If ICP canisters are built: local replica tests, Candid compatibility, upgrade/migration tests, stable-memory recovery, cycles/resource budgets, caller authorization, adversarial and property/fuzz tests, canister interface check, deterministic artifact verification. A Rust native test is not a canister test.
- [ ] 8.11 Performance/reliability: expected workloads, burst/concurrency, large reports, backpressure, queue exhaustion, dependency outage, latency/error budget, memory/cycle budget and graceful degradation.
- [ ] 8.12 Security tests: SAST/DAST/dependency scans, secret scan, authorization pen tests, fuzzing/parsers, cryptographic review, mobile assessment, external penetration test; verify findings remediated/retested.
- [ ] 8.13 Publish test strategy, coverage map, fixtures, test data privacy rules and release evidence. Coverage percentage is not proof of correctness; set targets after a baseline and include critical-path contract coverage.

**Exit gate:** required tests are reproducible in CI; failures block release; all P0/high defects have owners and dispositions; no production mutation tested using uncontrolled real counterparties/funds.

### Phase 9 — Service operations and programs kept running (P1)

Create a service catalog and per-service operational owner. Do not mark a program “running” because a route/component exists. Minimum catalog fields: service name, purpose, environment, deployment artifact/hash, dependency, owner/on-call, health check, SLO, alerts, backup/recovery, secrets, access, data class, support and stop/rollback steps.

- [ ] 9.1 **Frontend/web:** build once, immutable artifact, source commit/build ID, approved hosting, TLS/CDN/security headers, cache invalidation, availability monitoring, web error telemetry with privacy filtering, accessibility checks and rollback.
- [ ] 9.2 **Rust API:** supervised service/container, health/readiness/liveness, auth, TLS ingress, database pool/migrations, resource limits, structured logs/metrics/traces, request IDs, rate limiting, dependency checks and tested restart behavior.
- [ ] 9.3 **Authoritative database/canisters:** backups/snapshots, replication, migrations, restore test, ledger integrity checks, access/key recovery, capacity, upgrade controls and reconciliation. For ICP, monitor cycles/stable memory/traps/wasm hash/controllers; actual canister deployment not yet evidenced.
- [ ] 9.4 **Android app or mobile web:** release channel, app signing custody, staged rollout, supported versions, crash/security monitoring, remote config kill switch, device/session revoke, helpdesk and lost-device incident procedure.
- [ ] 9.5 **Market/reference feeds:** provider contracts/terms, source provenance, polling limits, cache, freshness SLA, out-of-order/stale/outlier checks, fallback disclosure, outage alert and no trade on stale/missing rates. Frankfurter reference rates are not commercial executable quotes.
- [ ] 9.6 **Identity/KYB/sanctions/custody/bank/network adapters:** health probes, credentials/cert rotation, partner escalation, rate limits, timeout/unknown outcome handling, queue replay policy, reconciliation and per-adapter kill switch. None is presently verified as integrated.
- [ ] 9.7 **AI gateway:** independent service inventory; protect API keys; redact prompts/logs; limit access; monitor rate/error; test mock and approved connectivity; document retention/provider/model; kill switch. Do not depend on it for payment authorization.
- [ ] 9.8 **Observability:** define SLI/SLO/error budget and alerts for availability, latency, errors, login denials, policy outcomes, stale data, settlement lifecycle, queue age, reconciliation differences, backup failures, mobile errors and key/certificate expiry.
- [ ] 9.9 **Operations:** on-call rotations, runbooks, incident and status communication, change/release calendar, access reviews, dependency updates, vulnerability SLAs, capacity planning, business continuity and DR exercises.
- [ ] 9.10 **Environments:** isolated demo/dev/integration/UAT/staging/production accounts, networks, databases, keys, domains, data, telemetry and deployment permissions. No promotion of credentials or data across environments.
- [ ] 9.11 **Runbook test:** fresh environment install from documented commands, health check, graceful shutdown, restart, backup restore, rollback and incident drill. Do not use `setup_and_run_vps.sh` as a production service manager.

**Exit gate:** every live service has an owner, monitored objective, tested recovery, runbook and change path; no unknown process or shared credential is required to operate it.

### Phase 10 — Local integration → testnet → limited pilot → mainnet/production (all gates mandatory)

1. **Demo/local only**
   - [ ] 10.1 Freeze synthetic data and deterministic fixtures; expose only on localhost by default; prohibit public unauthenticated writes.
   - [ ] 10.2 Verify API, UI, reports, controls and reset in local automated suites; run UI on desktop/tablet/phone viewport; prove no outbound money/asset call exists.
   - [ ] 10.3 Record known limits and demo build provenance. Do not use real PII or real/private production keys.

2. **Integration environment (no real value)**
   - [ ] 10.4 Build partner adapters behind interfaces; use partner sandboxes/mock servers, allowlisted endpoints and non-production credentials.
   - [ ] 10.5 Test signed authentication, message schemas, idempotency, callbacks, timeouts, duplicate deliveries, unknown result recovery, daily reconciliation and partner outages.
   - [ ] 10.6 Run operational, privacy, threat, performance and DR tests; document partner acceptance and data-sharing contracts.

3. **ICP local replica / network test environment (only if ICP confirmed)**
   - [ ] 10.7 Add actual IC CDK/Candid/stable memory toolchain and reproducible Wasm; run local replica and upgrade tests first.
   - [ ] 10.8 Deploy only to a disposable/local or explicitly selected non-production network using test identities/tokens; verify network ID, canister IDs, controllers, wasm hashes, cycles/resource plan, monitoring and removal/recovery plan.
   - [ ] 10.9 Confirm all assets are valueless test assets; test DvP failure/race/replay/upgrade/restore, outcalls if needed, oracle manipulation and key/controller governance.
   - [ ] 10.10 Keep all production credentials, real counterparties and production asset identifiers out of testnet config. Label screenshots and exports “TESTNET / NO VALUE.”

4. **Institutional UAT / limited pilot (regulated partner-approved)**
   - [ ] 10.11 Execute documented participant onboarding, legal/operational readiness, runbook rehearsal, training, capacity/risk limits, disaster recovery, security audit and participant test evidence.
   - [ ] 10.12 Use synthetic or contractually controlled test assets; if pilot has real value, hold a separate legal/regulatory/board/partner go/no-go with bounded exposure, explicit customer protections, funded liquidity, custody, dispute handling and rollback/compensation process.
   - [ ] 10.13 Approve support, incident reporting, reconciliation, metrics, monitor coverage, change freeze and exit/termination process. Pilot authorization is not general production approval.

5. **Mainnet / production (separate high-consequence approval)**
   - [ ] 10.14 Obtain written legal opinion and required licenses/permissions/partner agreements for the exact entity, jurisdiction, product, instrument, participant, network and activity.
   - [ ] 10.15 Verify production identity, tenant mandates, segregated accounts, key custody/HSM, multi-party deployment and transaction signing, controller/upgrade governance, emergency pause, key revocation and tested recovery.
   - [ ] 10.16 Complete independent security review/penetration or canister audit, remediate/retest; complete SOC 2/DORA/other requirements only to the scope actually applicable and independently assessed.
   - [ ] 10.17 Verify production market-data license and quality, real custody/title/reserve evidence, eligible counterparties, compliant settlement instrument/rail, legal settlement-finality model, funding, fee/liquidity, sanctions/AML and reconciliations.
   - [ ] 10.18 Run production dress rehearsal on isolated environment; verify artifact signatures and SBOM, config diff, secrets, domain/TLS, monitoring, backup restore, rollback, incident contacts and no stale frontend/service build.
   - [ ] 10.19 Use two-person go/no-go: technical owner + independent security + operations + legal/compliance + relevant bank/issuer/custodian/rail owner; capture signed minutes, scope, caps, monitors, rollback and stop conditions.
   - [ ] 10.20 Start with allowlisted entities/instruments, conservative limits and monitored canary; reconcile every transaction; halt automatically on stale prices, unexplained ledger breaks, key issues, auth anomaly, finality ambiguity or partner outage.
   - [ ] 10.21 Expand only after independent review of pilot evidence and fresh written approval. Mainnet deployment itself never proves production readiness or regulatory compliance.

**Hard stop:** any missing authority, unclear finality/custody, open critical/high security defect, unreconciled accounting, undocumented key owner, failed recovery, ambiguous data lineage, or unauthenticated mutation endpoint blocks progression to the next environment.

## 5. Compliance and assurance map (applicability must be decided)

| Area | Why it may matter | What to establish/evidence before claiming readiness |
|---|---|---|
| SOC 2 | Customer/vendor assurance for a defined service organization/system boundary. | AICPA criteria scope; control owners and period; independent CPA report; subservice exclusions/inclusions and exceptions. It is an attestation report, not a blanket product certification. |
| DORA | EU financial entities' digital operational resilience; relevant ICT third-party contractual/supervisory context. Applied since 2025-01-17. | Entity/provider applicability, ICT risk governance, incidents, resilience testing, third-party register/contracts, continuity, recovery, concentration/exit and evidence. Obtain specialist legal analysis. |
| GDPR / Swiss FADP / other privacy | Personal data, identity, signers, device telemetry, logs, analytics, support and cross-border hosting. | Data map, roles/legal basis, minimization, notices, processor contracts, DPIA screening, rights, breach process, transfers, retention/deletion/legal holds and access audit. |
| NIS2 / local cyber laws | Depends on entity type/size/service and national implementation. | Jurisdiction and entity scope; competent authority, risk controls, incident timelines and supply chain duties where applicable. |
| MiFID II/MiFIR, MiCA, DLT Pilot, CSDR, EMIR, Prospectus/MAR | Could apply to issuance, brokerage, venue, custody, crypto-asset, clearing/settlement, or market activity. | Product/entity classification, authorizations, venue/participant contracts, client protections, conduct, reporting and settlement model. Do not infer from UI labels. |
| AML/CFT, sanctions, travel rule | Depends on regulated activity and transaction/service model. | KYB/UBO, risk assessment, screening, monitoring, holds/cases, reporting, record keeping, accountable compliance officer and verified provider integration. |
| SWIFT CSCF | Only for SWIFT connected participant or contractual scope. | Authorized SWIFT connectivity, secure architecture, annual control attestation/assessment as required; actual end-to-end conformance. `swift_*` database fields do not meet it. |
| PCI DSS | Only if cardholder data environment is in scope. | Data-flow/scope confirmation, segmentation, approved processing and independent validation as appropriate. A virtual card mock alone does not trigger/meet it. |
| ISO 27001 / 22301 / 27701 | Voluntary, procurement, or jurisdiction/contractual assurance options. | Implement scoped management system; independent certification where chosen; statement of applicability, risk treatment, internal audit, management review and continual improvement. |
| ISO 20022, DTI (ISO 24165), ACTUS, FIX, FpML | Interoperability/data-model/identifier standards relevant to selected workflow. | Valid official assignment, supported version, conformance vectors, partner acceptance, operations and data mapping. Not certificates for a bank or ledger. |
| CPMI-IOSCO PFMI / FMI oversight | If the service is legally/structurally a financial market infrastructure or systemically important. | Counsel/supervisor classification; governance, credit/liquidity, settlement finality, custody, participant default, operational resilience, access and recovery analysis. |
| AI governance / EU AI Act | Only if the app uses AI in a covered role/use case or handles regulated/personal data with AI. | Use-case/model/provider inventory; legal risk classification; data and vendor controls; testing, oversight, logging, escalation and decision boundaries. AI must not settle/approve autonomously. |

## 6. Related project threads/artifacts checked

This workspace does not expose another conversation's live thread store to this review. The items below are the related local artifacts that were actually inspectable; they are notes/handoffs, not independent verification of the claims inside them.

| Artifact | Related work / findings to carry forward |
|---|---|
| `.planning/2026-09-27-central-bank-account-overview-and-vps-re/findings.md` | Account Overview/VPS work; local playtest of all then-configured personas; fake UI auth, no tenant scoping, unsupported admin KPIs, mobile cash/approval inconsistency, auditor write controls, 390px shell clipping. Treat as historical observations and re-test current build. |
| `.planning/2026-09-27-central-bank-account-overview-and-vps-re/persona-playtest-spec-brainstorm.md` | Ranked future work: safe workspaces, evidence-backed data, approval case file, reconciliation, demo scenarios, responsive workstation, mandate registry. Includes old eight-persona findings; later local progress says one mobile-approver persona removed (seven remain). |
| `.planning/2026-09-27-central-bank-account-overview-and-vps-re/progress.md` and `task_plan.md` | Earlier account/persona work reported frontend build/lint and release build pass, but keep historical checks distinct from this fresh verification. It records a user choice to remove Executive/Mobile Approver as a role while keeping mobile/tablet device modes. |
| `.agents/teamwork_preview_implementer_1/handoff.md` and `.agents/teamwork_preview_reviewer_1/handoff.md` | NVIDIA AI-gateway implementation and adversarial review report. The local handoff contains credential-like material: handle as a secret incident; do not repeat it. Reviewer handoff reports 12 AI-gateway tests; freshly rerun here, 12 passed. |
| `.agents/teamwork_preview_swe_1/BRIEFING.md`, `DISPATCH.md`, `progress.md` | Historical SWE orchestration artifacts from September 11; may contain stale tasks, environment assumptions, and secret references. Do not run scripts or install config from them without review. |
| `MAINCHANGELOG.txt` | Historical account/persona/deployment notes; reconcile with source and current build before relying on deployment claims. |
| `MDFILES/veritas-institutional-ledger-production-spec.md` | Product-boundary spec says sandbox prototype, not itself a bank/payment system/custodian/authorized venue; use as a constraint, but reconcile its aspirational details against current code. |
| `MDFILES/master_platform_architecture_and_working_inventory.md`, `system_verification_summary_and_status.md`, `production_readiness_status_and_implementation_roadmap.md`, `production_readiness_checklist_and_institutional_rollout.md` | Legacy inventory/status documents use unsupported “production ready,” “live,” “verified,” “100%,” real institution/backing/SWIFT/ICP claims. Use the evidence corrections recorded in this roadmap and update/archive those passages. |

**Cross-thread follow-up checklist:** [ ] ask the user for explicit thread references if more conversation histories must be checked; [ ] obtain current deployed URL/build ID and screenshots from the owner; [ ] verify newer persona/Android decisions before implementation; [ ] reconcile stale plan checkboxes and code status; [ ] never execute any prior handoff's requested install/deploy/credential command without current authorization.

## 7. Architecture Planning Markdown review index

`MDFILES/` is the discovered planning/architecture directory (there is no literal `Architectural Planning/` folder). This roadmap is its current source-of-truth status/checklist. Review existing docs in this order; preserve dated historical specs, but add an “aspiration vs verified implementation” banner and evidence link where they still read as current fact.

### P0 — Correct statements that may imply authorization, backing, security, or operational readiness

- [ ] `master_platform_architecture_and_working_inventory.md` — replace fake “100% operational/production-ready,” old role counts, live-feed and 1-click real acceptance claims with current verified inventory.
- [ ] `system_verification_summary_and_status.md` — separate actual tests from unsupported live banking/SWIFT/RWA/backing claims; refresh only when tests/evidence actually run.
- [ ] `production_readiness_status_and_implementation_roadmap.md` — mark as historical aspiration; remove completed/green claims for real capabilities not evidenced.
- [ ] `production_readiness_checklist_and_institutional_rollout.md` — retain useful legal/product boundaries; correct overly absolute regulatory prescriptions, retention periods, hardware levels and deployment assumptions.
- [ ] `developer_security_hardening_and_task_roadmap.md` — audit checked boxes against code; correct unsupported CallerGuard/cycle/precision/privacy claims and free-data/production assumptions.
- [ ] `data_privacy_gdpr_and_10year_retention_architecture.md` — remove “100% compliant” conclusions and blanket 10-year/destruction claims; get counsel/privacy review on actual data and statutory retention.
- [ ] `real_data_apis_icp_outcalls_and_security_hardening.md` — clearly separate browser Frankfurter ECB reference data from unbuilt canister outcalls; remove unsupported production-free feed and security control claims.
- [ ] `veritas_gold_deployment_guide_and_financial_charting_plugins.md` — remove unverified `dfx deploy` instructions until build metadata/artifacts exist; warn that current showcase is not hardened production.
- [ ] `standards_mapping_iso20022_iso24165_openapi.md` and `iso_standards_mapping_table.md` — label proposed mappings vs actual message implementations/registrations/partner tests.
- [ ] `icp_canister_suite_architecture_function_audit_and_valuation_advisory.md` — correct canister/CDK and endpoint status; segregate unsupported valuation/market claims from engineering evidence.
- [ ] `data_mutability_classification_and_10year_retention.md` — verify classifications and retention with data owner/counsel.
- [ ] `veritas-institutional-ledger-production-spec.md` — retain as target product spec, update persona list and acceptance status, ensure no capability is asserted as already delivered.

### P1 — Align intended workflows and system inventory with source

- [ ] `sovereign_ledger_final_design_and_production_roadmap.md`
- [ ] `master-prompt-corda-to-rust-icp.md`
- [ ] `advanced_central_bank_extensions_specification.md`
- [ ] `central_bank_transaction_taxonomy_and_smart_contract_architecture.md`
- [ ] `enterprise_screen_wireframe_flow_and_architecture.md`
- [ ] `sovereign_central_bank_enterprise_core_and_whisper_extension_strategy.md`
- [ ] `veritas_gold_signal_integration_dual_custody_and_central_bank_rwa_settlement.md`
- [ ] `realtime_api_ingestion_and_institutional_platform_matrix.md`
- [ ] `rwa_terminal_data_feeds_and_node_telemetry.md`
- [ ] `data_dictionary.md`, `corda_semantics.md`, `mapping_to_icp.md`
- [ ] `mvp_acceptance_and_live_verification_guide.md`
- [ ] `system_functions_and_roles_guide.md`
- [ ] `institutional_workflow_and_lifecycle_specification.md` under `Additional Features/`
- [ ] `smart_contract_prebuilt_settlement_rules.md` under `Additional Features/`
- [ ] `web_deployment_and_showcase_guide.md` under `Additional Features/`

### P2 — Review for product scope, naming, duplicate drafts and safe claims

- [ ] `red-broadcast-DESIGN.md`
- [ ] `stitch_design_retrieval_and_cross_platform_sync.md`
- [ ] `google_stitch_project_description_veritas_gold.md`
- [ ] `rust-enterprise-blockchain-ai-rules-library.md` and its `(1)` duplicate
- [ ] `rust-business-application-ai-rules-library.md` and its `(1)` duplicate
- [ ] `icp_backend_institutional_advantages_and_investor_mvp_checklist.md`

For each reviewed document: record reviewer/date, source files checked, exact verified/unverified scope, decisions superseded, links to code/tests, and whether it is current, aspirational, archival or retired. Do not bulk-rewrite unrelated/dated documents without review.

## 8. Standard definition of done for every feature

- [ ] Requirement, user/persona, jurisdiction/environment, owner and acceptance criteria agreed.
- [ ] Data/source-of-truth, authorization, lifecycle, limits, failure/recovery, audit, retention and privacy designed.
- [ ] UI does not promise more than backend; fixture/live/stale/unavailable data is explicit.
- [ ] API/domain implementation reviewed; exact arithmetic; idempotent transactions; no client-only security controls.
- [ ] Unit, integration, negative, concurrency, accessibility, E2E and security tests appropriate to risk pass in CI.
- [ ] Observability, runbook, backup/recovery, incident/rollback and support ownership delivered.
- [ ] Documentation, standards and compliance control mapping accurately updated with evidence.
- [ ] Independent reviewer approves high-risk financial/security changes; pilot/mainnet gates signed separately.

## 9. Decisions the project owner must eventually confirm

1. Which two institutional personas are the product target (Central Bank + Commercial Bank Treasury recommended, or Central Bank + Institutional Investor/Agency)?
2. Is Android meant to be a native Android product, a managed PWA/web app, or only a responsive showcase? Is there an external Android repository not present here?
3. What exact jurisdiction, legal entity, service, customer and asset/settlement model is intended? Who is the licensed issuer/custodian/payment-system/venue partner, if any?
4. Is ICP actually the target ledger/network, or merely a prior design option? Which test network and production network are authorized?
5. Which reporting outputs are contractual/regulatory requirements (accounting, statements, ISO 20022, SOC 2 evidence, DORA register, incident, AML, audit)?
6. Does any credential-like material found in local handoffs or `.env` correspond to a still-valid key, requiring immediate revocation and incident handling?

## 10. Operating rule

A checkbox becomes complete only when the implementation exists, the relevant tests/checks ran against the current commit/artifact, a named reviewer accepts the evidence, and any external approval is recorded. A prior assistant note, screenshot, mock, component title, README statement, fixture, successful compiler run, or local test is not sufficient proof of production readiness, compliance, backing, custody, settlement finality or mainnet operation.
