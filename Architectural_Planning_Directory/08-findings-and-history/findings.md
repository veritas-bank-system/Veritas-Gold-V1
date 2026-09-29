# Findings & Decisions

## Requirements
- Add central-bank-appropriate functionality to the existing Account Overview without removing other site features.
- Create root `MAINCHANGELOG.txt` recording implementation decisions and verification.
- Prepare and verify a VPS showcase deployment path without deploying externally or claiming production authorization.
- Complete `/playtest` by using the real website.

## Research Findings
- The Account Overview component is `frontend/src/components/smart/BankCardSurface.tsx`, routed from existing app code under `portfolio`.
- Product requirements in `MDFILES/veritas-institutional-ledger-production-spec.md` call for settlement account visibility while explicitly treating this product as a workflow/orchestration/sandbox prototype, not a central bank, payment system, custodian or authorized live venue.
- Account records include account ID, owner/custodian, currency, settled balance, overdraft limit, daily transfer limit/usage, status and update timestamp. The model has no reserved/blocked/pending balances, settlement cutoffs or account type.
- The existing account API returns two seeded active EURD records with zero settled balance, 1,000/500 EURD overdraft, and 5,000/2,000 EURD daily limits. Transfer is immediate and in-memory; no production authentication, persistence, approvals or external payment rails.
- The former interface conflated €0 settled funds with overdraft headroom and included a Swiss Vault quick-pay recipient absent from API records.
- The existing deployment script had pre-existing user modifications that removed the Cargo build and searched machine-specific prebuilt paths. This would fail on a clean VPS. Scoped correction restores a configured-target release build, `npm ci`, PORT export, and `/health` startup wait. The Rust server binds all interfaces; shell syntax and Cargo build/check passed.
- Port 8080 was already occupied by the shared running backend. The full launcher was not run to avoid replacing/disrupting that service; health was tested against the existing service and the release binary was built independently.
- Workspace contained many unrelated user and agent changes; they were not staged, discarded, or overwritten.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Reframe the page as “Settlement Accounts & Liquidity” and distinguish settled balance from approved credit. | Avoid consumer spending metaphors and prevent credit from being mistaken for settled money. |
| Show settled + approved overdraft only as an indicative ceiling; disclose absent reservations/holds/pending settlement. | The API cannot calculate final spendable liquidity or these settlement states. |
| Use only account API facts for balances, currency, identifiers, limits, usage, status and freshness. | Avoid invented central-bank, RTGS or reconciliation values. |
| Replace hardcoded recipients with active account choices and preserve the sandbox transfer workflow with visible validation and direct in-memory disclosure. | Swiss Vault was unsupported; preserving the demo action must not imply approvals or live rails. |
| Treat VPS readiness as a repeatable showcase build/run path, not production readiness. | No external credentials, authorization, infrastructure security controls or production rails are available. |
| Keep the mobile shell issue out of this feature patch. | Playtest localized clipping to shared workstation navigation; table itself has its own horizontal scroller. |
| Preserve unrelated working-tree edits. | Shared checkout contains substantial pre-existing user modifications. |

## Real Website Playtest Findings
- Invalid transfer amount of 1,200 EURD (against 1,000 EURD indicative headroom) displayed an error and disabled submit. Valid 500 EURD cleared the error and enabled submit; cancelled without recording it.
- Account-ID search matched a seeded record; unmatched search showed a clear no-results empty state. Active filter selected by keyboard and retained both seeded records.
- At 390x844, Account Overview content remained present; internal table scroller was 318px wide for a 1080px table. Global workstation shell/document expanded to 1015px and clipped content. “Mobile (iPhone)” is a different dashboard surface, not a responsive rendition of Account Overview. This is an existing shell/navigation issue.
- Account-page console showed no errors, only informational Vite/React DevTools messages.

## Persona Playtest (real website, 2026-09-27)
The app configures eight personas. Starting as the default Super Admin, the Master Admin participant registry’s “Switch Role” action changes the persona label/toast but stays on the same global Master Admin Radar; the common Admin menus and action ribbon remain visible for the other personas as well. Observed by switching Central Bank, Commercial Bank, Custodian, DMO, Asset Manager, Auditor, and Executive roles from the participant registry. This is a concrete role-boundary failure for any real authorization interpretation; direct role switching is currently a demo impersonation, not enforced access control.

| Persona | Surface checked | Observed result / issue |
|---|---|---|
| Platform Super Admin & Operator | Default workstation and Master Admin Radar | Global totals, network-wide participant list and all modules displayed. KPI count says 8 institutions, participant list says 7 nodes active; figures and “all KYC/LEI cleared”, AUM, subnet, quorum/guarantee appear demo claims not substantiated by live backend. |
| Central Bank Operator & Governor | Switched via Admin’s participant list | Identity changed but Master Admin Radar and admin participant roster remain visible; no central-bank specific policy console becomes active. |
| Commercial Bank Treasury & Primary Dealer | Switched via Admin’s list | Same Admin Radar remains; no participant-scoped account or dealer console. |
| Qualified Custodian & Vault Notary | Switched via Admin’s list | Same Admin Radar remains; no custody-specific view/attestation console. |
| Sovereign Debt Issuer / DMO Lead | Switched via Admin’s list | Same Admin Radar remains; no DMO-specific issuance workspace. |
| Institutional Asset Manager / PE Fund | Switched via Admin’s list | Same Admin Radar remains; no investor/portfolio-scoped workspace. |
| Supervisory & Compliance Auditor | Switched via Admin’s list | Same Admin Radar remains despite “Read-Only” clearance; Admin “Verify Global Invariants” and “Sync Network State” actions remain rendered. Actions were not invoked. |
| Executive Signer & Mobile Approver | Switched from Admin; then separately authorized through the fake login flow to reach Mobile App | Mobile screen shows “Total Cash Available €2,450,000”, 0 pending approvals at top, yet shows two pending checker orders of €2.5m and €5m; all conflict with accounts API’s two zero-balance EURD accounts and approvals API baseline. No live payment/sign action invoked. |

Important access boundary: the login surface’s personas, credentials (read-only hardcoded IDs/masked values), auth-method buttons, database selector, environment buttons and “Authorize & Launch” animation are UI-only. Clicking authorize does not validate credentials; clicking an Admin list “Switch Role” directly mutates client persona. `App.tsx` starts with Super Admin already selected by default. No backend authorization/role enforcement was observed. Do not treat any visible persona separation as security.

The mobile approver flow required a second login: switching persona via Admin list does not change runtime mode to that persona’s default mobile surface. Reopening Switch Persona and authorizing Executive does enter mobile; this launches a branded handset UI, but its cash/approval data is inconsistent with actual API records. Source inspection confirmed `localApprovals` is initialized once from its prop and is not synchronized to later refreshed approval data; demo purchase/approve/reject callbacks only modify local React state.

The mobile Approvals tab displayed 0 pending sign-offs while two `PENDING_CHECKER` tickets remained visible. No action was invoked. The login portal's Production, authentication-method, and backend-engine options are client-side controls; `App.tsx` initializes authenticated state as Super Admin. The Master Admin KPI also conflicts internally (8 institutions vs 7 active nodes) and presents unproven AUM/KYC/network claims without API provenance.

## Build and Readiness Results
- Frontend `npm run build`: passed; existing ~774 kB chunk advisory.
- Frontend `npm run lint`: passed with 0 errors and 13 unrelated warnings; none in `BankCardSurface.tsx`.
- Launcher `bash -n` and `git diff --check`: passed.
- `cargo check --release --bin icp-canister-suite` and `cargo build --release --bin icp-canister-suite`: passed.
- Existing `/health` endpoint reported healthy `icp-canister-suite`.
- Full launcher and external VPS deployment were not run; no external deployment was authorized, and full launcher would compete for occupied shared port 8080.

The full eight-persona matrix, defect ranking, role/code ownership analysis, seven scored enhancement ideas and cold-start plan for the top choice are in `persona-playtest-spec-brainstorm.md`.

## Outstanding Production Requirements
Persistent storage, authenticated roles and enforced approval workflows, participant identity/mandates, live settlement integrations, reservations/pending/reconciliation records, security/secrets review, TLS/reverse proxy and process supervision, monitoring, and legal/regulatory authorization. Mobile workstation shell clipping is also outstanding for general UX.

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| Initial plan resolver returned no selected directory. | Initialized and explicitly selected named plan `2026-09-27-central-bank-account-overview-and-vps-re`. |
| Broad Markdown glob did not locate project docs; one combined read was truncated. | Located `MDFILES/` and used bounded reads. |
| Prior Preview browser tab unavailable. | Opened a fresh preview tab at the running website. |
| Native select option click could not compute its box model. | Selected status by keyboard; verified the rendered account rows. |
| Initial launcher string replacement used non-matching escaped text. | Re-read exact file section and applied exact replacements. |
| Mobile screenshot showed clipped page. | Probed DOM widths to isolate shared global shell issue; left outside this page change.

## Relevant Files
- `frontend/src/components/smart/BankCardSurface.tsx`
- `deploy_web_showcase.sh`
- `MAINCHANGELOG.txt`
- `MDFILES/veritas-institutional-ledger-production-spec.md`
- `crates/domain/src/accounts.rs`
- `crates/icp-canister-suite/src/server.rs`
