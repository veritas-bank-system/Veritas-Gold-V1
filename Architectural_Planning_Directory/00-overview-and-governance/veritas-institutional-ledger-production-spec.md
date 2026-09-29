# Veritas Institutional Ledger — Production-Readiness Specification

> **Purpose:** Build an institutional, permissioned digital-assets workstation on Internet Computer (ICP) for tokenized bonds, tokenized deposits, custody-backed RWAs, liquidity, collateral, controlled settlement, and supervised workflows.
>
> **Important:** This is a product and technical specification, not legal advice and not an authorization to issue money, securities, deposits, CBDC, or to connect to central-bank / SWIFT production infrastructure. All product claims and data must be clearly labelled as **Sandbox**, **Simulated**, or **Production**. Production functions require the appropriate regulated entities, licences, contractual integrations, legal opinions, and supervisory approval.

---

## 1. Product Boundaries

### 1.1 Product Position

The platform is an **institutional workflow, recordkeeping, settlement-orchestration, and tokenized-assets terminal**. It is not itself a central bank, commercial bank, custodian, CSD, MTF, payment system, or SWIFT participant.

The product must support three deployment modes:

| Mode | Purpose | Allowed behavior |
|---|---|---|
| Demo | Sales, UI validation, developer demonstrations | Synthetic data only; no externally valuable assets; no real settlement |
| Sandbox | Controlled integration and institutional UAT | Test identities, test assets, simulated or partner sandbox rails |
| Production | Regulated live operations | Only for approved entities, jurisdictions, instruments, custody arrangements, and connected settlement rails |

### 1.2 Terminology Rules

- Do not label a token as “CBDC,” “digital euro,” “central-bank money,” “deposit,” “bond,” or “regulated security” unless its legal structure and issuer support that label.
- Use **tokenized deposit** only where issued by a regulated deposit-taking institution and redeemable under the agreed legal terms.
- Use **regulated e-money token (EMT)** only where the issuer and reserve / redemption framework meet the applicable requirements.
- Use **settlement token** or **sandbox EUR token** for simulations.
- Do not market ICP chain-key assets as central-bank money. ICP documentation currently lists ckBTC, ckETH and ckERC-20 assets such as ckUSDC; availability of a “ckEUR” or “ckUSD” must be verified rather than assumed.
- “Buy on ICP” must never execute a purchase immediately. Replace it with a controlled order / RFQ / subscription workflow.

### 1.3 Regulatory Workstreams

Before any live issuance, custody, secondary trading, tokenized deposit, or payment functionality, maintain a jurisdiction-by-jurisdiction legal and compliance matrix covering:

- MiFID II / MiFIR and local investment-services authorization.
- EU DLT Pilot Regime eligibility and permissions for DLT MTF, DLT SS, or DLT TSS where relevant.
- CSDR, Prospectus Regulation, Market Abuse Regulation, EMIR and settlement-finality considerations where applicable.
- MiCA classification for crypto-assets and e-money-token / asset-referenced-token considerations where applicable.
- AML / CFT, sanctions, travel-rule, beneficial-ownership, data-protection, record-retention, outsourcing, operational-resilience, and cybersecurity requirements.
- The specific central-bank, RTGS, TARGET Services, CSD, commercial-bank, SWIFT, custodian, oracle, and market-data agreements required for an integration.

No live central-bank connection, SWIFT message, token issuance, redemption, secondary-market execution, or customer asset transfer may be enabled by a frontend flag alone.

---

## 2. Users, Personas and Entitlements

Use role-based access control (RBAC) plus attribute-based access control (ABAC). Every authorization decision must be evaluated server-side / canister-side; never trust UI hiding.

### 2.1 Personas

| Persona | Typical organization | Core capabilities | Restricted capabilities |
|---|---|---|---|
| Platform Super Admin | Operator | Tenant configuration, environment governance, incident response | Cannot approve own sensitive actions |
| Central Bank Supervisor | Central bank / supervisor | Read-only systemic monitoring, audit evidence, policy review, approved intervention workflows | No commercial trading or unilateral customer-asset movement |
| Central Bank Operator | Central bank | Issue / redeem approved settlement instruments, manage approved liquidity facilities, supervise participants | Requires separation of duties and policy quorum |
| Commercial Bank Treasury | Bank | Manage accounts, RFQs, subscriptions, transfers, liquidity and collateral | Limited by credit, mandate, jurisdiction and approval policy |
| Custodian / Notary | Qualified custodian, vault, CSD, registrar | Attest holdings, process controlled issuance/redemption, submit proof-of-reserve evidence | Cannot alter client ownership without governed process |
| Issuer / Debt Management Office | Sovereign, agency, corporate | Draft instruments, auctions, disclosures, corporate actions | Cannot self-approve issuance or settlement |
| Asset Manager / PE / Fund | Institutional investor | Onboard, subscribe, trade via permitted venues, manage portfolio | Eligibility, investor classification and limits apply |
| Broker / Dealer | Regulated intermediary | Submit quotes, execute permitted RFQ trades, supply liquidity | Market-conduct controls and entitlement limits apply |
| Compliance Officer | Participant or operator | Review alerts, cases, holds, SAR/STR workflow preparation, reporting | No unilateral settlement action |
| Auditor | Internal / external auditor | Evidence access, immutable reporting export, controls review | Read-only and scoped data access |
| Mobile Approver | Authorized senior officer | Review and approve/reject pre-authorized pending actions | Cannot originate high-risk actions by default |

### 2.2 Segregation of Duties

- Minimum **four-eyes** approval for payments, purchases, asset transfers, minting, redemption, collateral release, and configuration changes above policy thresholds.
- Support 2-of-3, 3-of-5, and policy-defined quorum—not hard-coded only 2-of-3.
- Enforce maker ≠ checker, checker ≠ final releaser for high-risk actions where policy requires it.
- Require distinct legal persons / accounts for related-party trades and conflict declarations.
- Require elevated approval for white-list changes, limit increases, smart-contract upgrades, emergency pause/unpause, oracle-source changes, and settlement-rail activation.
- Use step-up authentication (FIDO2 / passkey plus organization-approved MFA) for approval, not merely login session confirmation.

---

## 3. Information Architecture and Sidebar

The existing sidebar should become a role-aware navigation tree. Users see only modules authorized for their institution, environment, jurisdiction, and role.

### 3.1 Recommended Navigation

```text
WORKSPACE
  Dashboard
  Tasks & Approvals
  Notifications

ACCOUNTS & CASH
  Accounts Overview
  Tokenized Deposits / Settlement Tokens
  Transfers & Payment Instructions
  Liquidity Management
  Statements & Reconciliation

MARKETS & ASSETS
  RWA Terminal
  Asset Catalogue
  Bond Issuance
    Draft Instruments
    Auctions & Syndication
    Primary Subscriptions
    Corporate Actions
  Trading
    RFQ Desk
    Bilateral Orders
    Secondary Market (licensed / enabled only)
    Trade Blotter & DvP
  Yield & Analytics

CUSTODY & COLLATERAL
  Custody Positions
  Issuance & Redemption Requests
  Proof of Reserve & Attestations
  Collateral Desk
  Repo & Securities Lending

SETTLEMENT & INTEROPERABILITY
  Settlement Monitor
  ISO 20022 Messages
  Approved Rail Connectors
  Chain-Key / External Chain Connectors
  Reconciliation Exceptions

RISK & COMPLIANCE
  Compliance Dashboard
  KYC / KYB / UBO Registry
  Sanctions & Screening
  Transaction Monitoring
  Market Surveillance
  Limits & Exposure
  Audit Evidence

PLATFORM OPERATIONS
  Notary / Finality Monitor
  Canister Operations
  Oracle Operations
  Incident & Resilience Centre
  Feature Flags & Environments

ADMINISTRATION
  Institution Profile
  Users, Roles & Delegations
  Approval Policies
  Product & Instrument Templates
  Fees & Limits
  API Clients / Webhooks

HELP
  Documentation
  Product Tours
  Support Tickets
  Status Page
```

### 3.2 Existing Menu Migration

| Current item | New location | Required change |
|---|---|---|
| Notaries | Platform Operations → Notary / Finality Monitor | Show actual consensus / attestation architecture; do not label simulated Raft data as ICP finality |
| BFT Quorum | Platform Operations → Notary / Finality Monitor | Separate ICP consensus from optional off-chain multi-party attestation quorum |
| Portfolio | Accounts & Cash → Accounts Overview; Markets & Assets → Portfolio | Split cash balances from investment holdings |
| RWA Terminal | Markets & Assets → RWA Terminal | Make it an institutional market-data / RFQ entry point |
| Live Chart | Markets & Assets → Yield & Analytics | Add source, timestamp, entitlement and stale-data warnings |
| Contract Maker | Markets & Assets → Bond Issuance → Draft Instruments | Convert to gated instrument lifecycle workflow |
| Factory | Administration → Product & Instrument Templates | Version templates, legal docs, approvals and audit history |
| Vault Custody | Custody & Collateral → Custody Positions | Replace direct buying with request / RFQ / approved execution |
| Trade & DvP | Markets & Assets → Trading → Trade Blotter & DvP | Gate matching and settlement by venue / approvals |
| Collateral Desk | Custody & Collateral → Collateral Desk | Add eligibility, haircuts, concentration and margin workflows |
| Bond Auctions | Markets & Assets → Bond Issuance → Auctions & Syndication | Add bidder eligibility and auction governance |
| Coupon Engine | Markets & Assets → Bond Issuance → Corporate Actions | Use payment approval and reconciliation gates |
| Maker-Checker | Workspace → Tasks & Approvals | Global queue plus object-specific approval history |
| PoR Telemetry | Custody & Collateral → Proof of Reserve | Treat IoT feed as evidence, not proof by itself |
| Liquidity Sweeper | Accounts & Cash → Liquidity Management | Add limits, dry-run, exceptions and approval workflow |
| Harmonix Bridge | Settlement & Interoperability → Approved Rail Connectors | Disable generic bridge until custody, legal and security controls are proven |
| Smart Contracts | Platform Operations → Canister Operations | Production deployment controls, upgrade governance, telemetry |
| Wholesale Pools | Markets & Assets → Trading → Liquidity Facilities | Do not use AMM for regulated bond market unless legal design permits it; favor RFQ/order-book model |
| Interoperability | Settlement & Interoperability → Settlement Monitor | Separate conversion estimate from real executable settlement |
| Compliance | Risk & Compliance → Compliance Dashboard | Add case management, reporting and policy controls |

### 3.3 Dashboard

The main dashboard is desktop-first and responsive. It contains:

- Institution name, legal entity, BIC, LEI, environment badge, role and current approval authority.
- Cash / settlement-token balances, available credit, blocked balance, pending settlement and intraday-liquidity status.
- Portfolio NAV, duration, yield, accrued interest, collateral utilization, concentration and FX exposure.
- Pending actions requiring the current user’s approval.
- Exceptions: sanctions hits, failed DvP, stale oracle, reconciliation mismatch, limit breach, expiring documents and security events.
- Production guardrail banner: **No live execution is enabled until settlement rail, authorization, account mandate and approval requirements all pass.**

Do not make the full operational terminal “phone-first.” Provide a separate responsive mobile approval application / route optimized for review, step-up authentication, approval, rejection, alerts and read-only monitoring.

---

## 4. Feature Catalogue

### 4.1 Institutional Onboarding and Identity

#### Required Features

- Institution registration with legal entity details, LEI, BIC where applicable, country, tax identifiers, licenses, beneficial owners, authorized signatories and settlement instructions.
- KYB / UBO verification workflow with document upload, verification status, expiry and periodic refresh.
- Sanctions, PEP, adverse-media and jurisdiction screening through approved providers.
- Organization hierarchy: parent, legal entity, desk, branch, account, sub-account and delegated authority.
- Account mandates: who may initiate, approve, release, cancel, view and export.
- Investor classification: professional client, eligible counterparty, qualified investor, restricted investor and country restrictions.
- Identity link to ICP principal(s) only after institutional verification and mandate approval.
- Certificate / WebAuthn / passkey enrollment and hardware-security-key policy.
- Environment separation: each production identity is separately verified; sandbox identity cannot be promoted automatically.

#### Status Model

```text
Draft → Submitted → Screening → Enhanced Due Diligence (optional)
→ Compliance Approved → Operations Approved → Active
→ Suspended / Restricted / Offboarded
```

### 4.2 Accounts, ckEUR / ckUSD and Settlement Tokens

#### Required Product Model

Build a generic **Settlement Instrument Registry** rather than hard-coding ckEUR or ckUSD.

Each instrument must store:

- Instrument ID, name, symbol, currency ISO 4217 code, issuer legal entity, legal classification, jurisdiction, network, decimal precision and contract / canister reference.
- Reserve / backing policy, redemption terms, attestation frequency, custody bank / reserve account reference, eligibility, transfer rules, whitelists and blacklists.
- Environment, status (Draft, Pending Approval, Active, Suspended, Redeeming, Retired), issue cap and per-account / per-transaction limits.
- FX price source, valuation rules, cutoff times, fees and reconciliation account.

#### ckEUR / ckUSD Rules

- Do **not** assume an official ICP-native ckEUR or ckUSD exists.
- If using a third-party EUR or USD asset, display the exact issuer, legal terms, chain / bridge model, redemption rights, reserve attestation, smart-contract / canister address, transfer restrictions and risk disclosure.
- For an internal prototype, issue only clearly labelled **sandbox settlement tokens** such as `sEURD` and `sUSDD`; they must be valueless, non-transferable outside sandbox, non-redeemable and visually marked as simulated.
- For production, integrate only an approved issuer / bank / central-bank settlement rail under a separate adapter. The platform must not manufacture “central bank money.”

#### Large-Value Transfers and Purchases

The system must support €15M, €40M and €50M nominal institutional workflows, but actual values must be governed by entity-specific limits, liquidity, instrument eligibility, rail capacity and supervisory policy.

For every high-value transfer, subscription, auction bid, RFQ acceptance, asset purchase, mint, redemption, bridge request or collateral release:

1. Validate identity, mandate, role, device assurance and session risk.
2. Validate account status, available balance, overdraft / credit eligibility, blocked funds and settlement-date availability.
3. Validate per-transaction, daily, product, country, counterparty, credit and concentration limits.
4. Perform sanctions, AML / CFT and fraud checks.
5. Verify asset eligibility, offer validity, price tolerance, quote expiry and corporate-action restrictions.
6. Create a non-executable draft and immutable intent record.
7. Place a funding / asset reservation with expiry.
8. Route to the required maker-checker approval chain.
9. Revalidate all risk controls immediately before execution.
10. Execute DvP or payment only through the approved settlement adapter.
11. Store signed receipt, accounting entries, settlement status and reconciliation references.

#### Transfer Lifecycle

```text
Draft → Validated → Awaiting Approvals → Funds Reserved
→ Compliance Cleared → Settlement Submitted → Pending Finality
→ Settled / Failed / Cancelled / Expired / Reversed (governed only)
```

### 4.3 Tokenized Bond Issuance and Lifecycle

#### Instrument Configuration

- Instrument identifiers: ISIN (where allocated), CFI, FISN, DTI where applicable, internal instrument ID and canister ID.
- Issuer and guarantor legal entities, governing law, offering jurisdiction, investor eligibility and distribution restrictions.
- Currency and settlement instrument, face value, denomination, issuance size, minimum order, maximum allocation and incremental denomination.
- Fixed, floating, zero-coupon, inflation-linked, callable, puttable, amortizing, green / sustainability-linked and private-placement templates.
- Coupon convention, day-count convention, frequency, payment calendar, business-day convention, record date, ex-date, accrual start, maturity, redemption and tax withholding.
- Prospectus / termsheet / pricing supplement / offering memorandum / risk disclosures as immutable versioned documents.
- ACTUS mapping as a calculation model only; legal terms remain authoritative.

#### Workflow

```text
Draft → Legal Review → Compliance Review → Risk Review → Issuer Approval
→ Instrument Activated → Subscription / Auction → Allocation
→ DvP Settlement → Outstanding → Corporate Actions → Matured / Redeemed
```

#### Required Features

- Instrument template library with version control and approval policy.
- Bond calculator: clean price, dirty price, accrued interest, yield-to-maturity, current yield, duration, modified duration, DV01, cash-flow schedule and scenario analysis.
- Bond card: issuer, rating source/date, currency, seniority, coupon, maturity, yield, price, accrued interest, settlement date, eligibility, liquidity indicators, documents, custody / registrar and risk flags.
- Primary issuance through auction, syndication, bilateral allocation or private placement.
- Auction types: competitive, non-competitive, uniform-price, multiple-price / Dutch, sealed bid; configurable tie-breaker and allocation policy.
- Subscription allocation, payment reservation, DvP settlement, failed-trade management and confirmations.
- Corporate actions: coupons, amortization, redemptions, calls, puts, consent events and withholding tax.
- Full lifecycle ledger and reconciliation export.

### 4.4 Trading, RFQ and Controlled DvP

#### Replace “Buy on ICP”

Replace every instant “Buy on ICP” / “Buy” action with contextual, non-executing entry actions:

- `Request Quote`
- `Start Subscription`
- `Create Purchase Instruction`
- `Review Trade`
- `Submit for Approval`

The interface must show the total consideration, price timestamp, quote expiry, settlement currency, fees, settlement date, account, available funds, approvals required, documentation and risks **before** a user submits an instruction.

#### Trading Models

- RFQ: institutional buyer requests a quote from eligible dealers; quote has size, price, fee, settlement date, expiry and execution conditions.
- Bilateral order: buyer and seller negotiate and both affirm terms.
- Auction: eligible bidders submit sealed or visible bids based on configured rules.
- Secondary market: enable only where the venue and permissions are legally available. Include trading hours, market-conduct surveillance, order controls and cancellation rules.
- Block trade: requires entity-level limits, enhanced approvals and pre-trade compliance checks.

#### DvP States

```text
Trade Draft → Quote / Order Accepted → Pre-Trade Checks
→ Buyer Cash Locked + Seller Asset Locked → Dual Affirmation
→ Settlement Instruction → Atomic / Coordinated DvP
→ Finality Confirmed → Ledger + Statements Updated
```

Never advertise “zero counterparty risk” without a precise legally reviewed settlement-finality and custody design. Show the settlement model and residual risks instead.

### 4.5 Liquidity, Treasury and Cash Management

- Multi-currency account overview, projected cash flow, settlement calendar and intraday position.
- Available, reserved, blocked, pending, overdraft and credit-facility balances separated clearly.
- Configurable liquidity sweeps with source/target account, threshold, cutoff, maximum amount, exception policy, dry-run, simulation and required approval chain.
- Payment prioritization: regulatory, margin, securities settlement, payroll, internal transfer, low priority.
- Liquidity pools / facilities must be modelled as bilateral or approved multilateral facilities with transparent eligibility, rate, maturity, collateral and limits; do not default to a retail-style AMM.
- Margin calls, collateral substitutions, repo maturity ladders and liquidity stress testing.
- ISO 20022 statement ingestion / generation where an approved rail supports it (for example camt.052, camt.053, camt.054, pain.001, pacs.008), but only after message validation and bank / network authorization.

### 4.6 Custody, Proof of Reserve and Redemption

- Separate customer asset records from operator assets and from synthetic demo assets.
- Asset registry with legal owner, custodian, vault / CSD / registrar reference, quantity, encumbrance, valuation, attestation status and reconciliation status.
- Custody attestation workflow: evidence upload, signature, dual review, expiry, exception tracking and publication policy.
- Proof-of-reserve dashboard must show scope, valuation timestamp, liabilities coverage, evidence source, assurance level and limitations; IoT sensor data alone is never sufficient proof of ownership or unencumbered title.
- Controlled minting / issuance: requires verified underlying assets, legal approval, maker-checker, supply-cap check, reserve reconciliation and an immutable attestation reference.
- Controlled redemption: entitlement validation, sanctions checks, delivery / payout instruction, burn / lock event, reconciliation and custody release confirmation.
- Do not claim that U.S. Treasury bills, physical gold, real estate or deposits are backed without a verified legal arrangement and current evidence.

### 4.7 Collateral, Repo and Risk

- Collateral eligibility schedules by currency, issuer, rating, maturity, issuer concentration, asset class and jurisdiction.
- Market-data source hierarchy, valuation haircuts, independent price verification, stale-price treatment and manual override governance.
- Initial margin, variation margin, threshold, minimum transfer amount, independent amount and call schedule.
- Pledge, substitution, release, rehypothecation status and consent record.
- Repo workflow: trade date, settlement date, repurchase date, rate, collateral, haircut, margining, substitution and closeout process.
- Exposure and concentration dashboard by counterparty, issuer, country, currency, asset class and maturity.
- Automated actions must be policy constrained; a system cannot silently rehypothecate customer collateral.

### 4.8 Compliance, Supervision and Market Integrity

- KYB/KYC/UBO status and periodic review.
- Sanctions, PEP, adverse media, transaction-monitoring and velocity / structuring checks.
- Rule-based and case-management workflow with reviewer, disposition, evidence, escalation and retention.
- Market surveillance: wash trades, spoofing indicators, unusual pricing, circular trading, insider-list controls where applicable and suspicious-order alerts.
- Immutable audit event log: actor, institution, device/session assurance, action, old/new state hashes, approval chain, policy version, timestamp and correlation ID.
- Supervisor view must use legal authorization, least privilege, dual control and documented purpose. Avoid a generic “unmask anybody” function; use a governed lawful-access case workflow.
- Privacy design: minimize personally identifiable information on-chain. Store only salted commitments / references where possible; retain sensitive documents and PII in encrypted off-chain storage with controlled access and retention policies.

### 4.9 Interoperability and External Rails

- Build each external connection as a separately approved adapter with configuration, keys, operational owner, test evidence, outage behavior, reconciliation and kill switch.
- Supported adapter categories: commercial-bank APIs, RTGS / payment gateway (only under partner agreement), custodian / CSD, pricing / market-data provider, KYC provider, sanctions provider, document-signing provider, SWIFT gateway (only for authorized users), and approved blockchain networks.
- ICP Chain-Key integration may be used where a supported chain and asset are actually available. Do not treat a generic bridge as a substitute for regulated custody, settlement finality, or bank-network membership.
- All cross-network transfers require destination validation, allowlisting, risk scoring, travel-rule / required data handling where applicable, approval policy, quote / fee disclosure, transaction monitoring and post-transfer reconciliation.
- “Harmonix Bridge” should initially be renamed **External Connectivity (Sandbox)**. Production bridge functions remain disabled until security review, custody model, operational controls, legal analysis and partner approvals are complete.

### 4.10 Canister Operations and ICP Skills

#### Canister Architecture

Use modular Rust canisters with explicit boundaries:

| Canister / Service | Responsibility |
|---|---|
| identity-registry | Institution-to-principal link, role claims, verification references, revocation state; no raw KYC documents |
| policy-engine | RBAC/ABAC, limits, approval policies, risk-control decision records |
| account-ledger | Account partitions, balances, reservations, journal references and statements |
| instrument-registry | Bond / RWA metadata, lifecycle state, documents hashes and eligibility |
| position-ledger | Ownership positions, encumbrances, freezes and settlement reservations |
| issuance-engine | Governed mint / burn / issuance / redemption workflow |
| auction-engine | Configurable issuance auctions, bid validation, allocation and evidence |
| rfq-engine | RFQ requests, dealer eligibility, signed quotes, expiry and acceptance |
| settlement-engine | DvP state machine, idempotency, lock/unlock, finality receipts and exceptions |
| collateral-engine | Eligibility, valuation snapshots, haircuts, margin and pledge state |
| corporate-actions-engine | Coupon, maturity, redemption, tax / payment instruction workflow |
| compliance-case-engine | Alerts, holds, cases, approvals and auditable dispositions |
| oracle-attestation | Signed data-source attestations, source quality, timestamps and quorum evidence |
| notification-service | Signed event notifications, webhooks, inbox and escalation |
| document-registry | Document hashes, versions, signatures, retention references and access policy |
| ops-governance | Upgrade proposals, pause controls, incident controls, configuration approvals |

Use PostgreSQL only for off-chain query projections, reporting, search indices, encrypted documents, non-authoritative integration state and operational analytics. Define which ledger is legally / operationally authoritative per workflow; do not allow ICP and PostgreSQL to diverge without reconciliation and exception handling.

#### Mandatory ICP Engineering Controls

- Rust only for production canisters; stable-memory migrations with tested schema versioning and rollback / recovery plan.
- Authorization at every update method; query methods must avoid exposing sensitive data.
- Use Candid interfaces versioned and compatibility-tested.
- Use bounded collections, pagination and resource controls to protect against memory / cycle exhaustion.
- Use idempotency keys and correlation IDs for every external instruction and settlement event.
- Treat inter-canister calls and external calls as asynchronous; write durable state-machine transitions before and after awaits.
- Never expose keys, raw KYC data, secrets or private signing material in canister state, logs, frontend bundles or environment files.
- Use secure randomness (`raw_rand`) where randomness is needed; never use timestamps as a security random source.
- Maintain reproducible WASM builds, pinned toolchain/dependencies, SBOM, `cargo audit`, `cargo deny`, formatting and Clippy checks in CI.
- Test unit, integration, property, fuzz, authorization, upgrade/migration and adversarial state-machine paths.
- Use `ic-wasm check-endpoints` and artifact / hash verification in CI.
- Canary deploys, emergency pause controls, separate deployer / approver roles, and multi-party governance for upgrades.
- Monitor cycles, heap, stable memory, traps, call errors, latency, failed migrations and policy-denial patterns.

### 4.11 Audit, Reporting and Operations

- Audit exports by period, entity, account, instrument, transaction status, approval, compliance case and ledger entry.
- Daily reconciliation between canister records, PostgreSQL projections, custodians, banks, settlement rails and market-data sources.
- Operations dashboard: service health, canister cycles, queue depth, integration health, stale data, failed settlement, policy denials, reconciliation breaks and incident timeline.
- Business-continuity plan, disaster-recovery runbooks, incident severity model, tabletop exercises and reconciliation recovery procedures.
- Data retention and deletion policy based on legal obligations; redact / minimize off-chain PII with auditable legal-hold behavior.

---

## 5. Page Specifications

Every page needs a clear top-of-page `What is this?` drawer and `Operational guidance` panel. The documentation is not merely marketing: it must explain permissions, data sources, lifecycle states, controls, risks and escalation path.

### 5.1 Standard Page Header

Each functional screen must display:

- Environment: Demo / Sandbox / Production.
- Legal entity, account / portfolio context and role.
- Data freshness, source and timestamp.
- Current status / lifecycle state.
- Available balance or available quantity versus reserved / blocked amounts.
- Required approvals and policy applied.
- Links to relevant documents, audit trail, support article and incident status.

### 5.2 Notaries / Finality Monitor

Purpose: monitor the platform’s cryptographic attestations, ICP execution status, external-finality references and operational health.

Requirements:

- Separate terms: ICP network finality, optional notary quorum, custodian attestation and external rail settlement confirmation.
- Show data origin, environment and whether values are simulated.
- Do not call an off-chain Raft cluster “ICP BFT consensus.”
- Provide controlled diagnostics, exportable health evidence and incident escalation.

### 5.3 Accounts & Portfolio

Purpose: show cash, settlement-token positions, holdings, encumbrances, accrued interest, exposure, and pending movements.

Requirements:

- No negative spending-power display without a clear explanation of overdraft, availability and authorization.
- Split settled balance, available balance, credit line, reserved funds, pending settlement and blocked funds.
- Statements, accounting export and reconciliation status.

### 5.4 RWA Terminal

Purpose: market-data, discovery, eligibility checks and controlled entry to RFQ / subscription / trade instruction.

Requirements:

- Asset card with data source, price timestamp, bid/ask or indicative status, liquidity source, yield methodology and risk disclaimer.
- Order ticket must calculate total consideration, accrued interest, fee, FX, settlement date and approval route.
- A “Buy” click opens review—not execution.
- Large orders default to RFQ / block-trade process rather than public one-click execution.

### 5.5 Bond Contract Maker

Purpose: create an approved instrument proposal, not directly deploy a sovereign-bond canister.

Requirements:

- Wizard: issuer → legal template → economics → calendar → distribution restrictions → settlement → documents → risk/compliance → review → approvals → controlled deployment.
- Validate identifiers and distinguish provisional internal identifiers from official ISIN / DTI assignments.
- Deployment requires legal/compliance/risk/operations approvals and production change-control.

### 5.6 Custody and Proof of Reserve

Purpose: show backing evidence, title / custody references, attestation quality, encumbrance and redemption capability.

Requirements:

- Clearly distinguish allocated, pooled, synthetic, pending verification and demo assets.
- “Redeem” creates a redemption instruction subject to entitlement, fees, logistics / payout, sanctions and approvals.
- Replace all immediate asset purchases with RFQ / subscription / instruction workflow.

### 5.7 Trading and DvP

Purpose: manage offers, quotes, trade affirmation, DvP settlement and exceptions.

Requirements:

- Seller identity should be displayed according to permission and market rules; do not expose counterparties by default if the venue is anonymous.
- Show quantity, unit price, consideration, accrued interest, fees, settlement date, asset availability, cash availability, approval requirements, quote validity and risk flags.
- Lock cash / asset only after the instruction passes controls; provide expiry and release events.

### 5.8 Collateral Desk

Purpose: manage pledges, haircuts, valuations, margins and repo lifecycle.

Requirements:

- Current and fallback price source, haircut policy version, eligibility, concentration, margin call status and dispute workflow.
- Any release, substitution or reuse of collateral requires the contract / consent and approval policy.

### 5.9 Bond Auctions

Purpose: manage primary issuance under approved auction terms.

Requirements:

- Auction rules, eligible bidders, issuance cap, reserve / cutoff methodology, bid validation, audit timestamping, allocation policy and disclosure package.
- Bids above policy threshold route to approvals before becoming binding.

### 5.10 Coupon Engine

Purpose: calculate, approve, schedule, execute and reconcile corporate-action cash flows.

Requirements:

- Independent calculation and exception checks; record-date holdings snapshot; withholding / tax treatment; payment account validation.
- “Execute payout” requires the configured payment approval policy and confirms funds availability.

### 5.11 Maker-Checker Queue

Purpose: a unified approval inbox for all sensitive actions.

Requirements:

- Display exact action, initiating party, legal entity, source/destination, amount, instrument, policy reason, risk checks, documents, confirmations and immutable hash.
- Approvers can approve, reject, request changes or escalate. They cannot modify the economics silently.
- Approval is invalidated automatically if material fields, account, counterparty, amount, price, quote, risk result or policy version changes.

### 5.12 Compliance Radar

Purpose: risk-based compliance operations, not unbounded surveillance.

Requirements:

- Case-based access to identity resolution; lawful basis, reviewer identity, purpose, dual approval and audit event required.
- Compliance holds must prevent settlement but preserve evidence and notify permitted parties according to policy.
- Show both automated score and human decision; never treat an automated score as a final regulatory conclusion.

---

## 6. Side-Chat and Bond Verification

Create a **Bond Intelligence & Verification Panel** on all instrument pages.

### 6.1 Functions

- Explain the instrument in plain language from approved structured data and approved documents.
- Answer only with citations / links to the prospectus, termsheet, issuer disclosures, custody evidence, price sources and approved policy documents.
- Show “verified data,” “indicative data,” “stale data” and “unverified statement” labels.
- Explain coupon, maturity, yield, accrued interest, settlement date, denomination, ranking, collateral, liquidity and transfer restrictions.
- Provide a checklist before subscription / trade: investor eligibility, documents accepted, KYC status, cash availability, approval needs and risk alerts.
- Create support tickets with conversation reference and redacted context.

### 6.2 Safety Rules

- The assistant must not provide personalized investment advice, guarantee returns, fabricate verification, bypass approvals, reveal restricted counterparties, expose PII, or execute trades.
- The assistant may prepare an instruction draft, but submission must return to the controlled transaction workflow.
- Retrieval corpus must be versioned, approved, access-controlled and citation-first.

---

## 7. Documentation and Support Site

Create `docs.<domain>` using the same design system but as a separate application / route. It should be public only for non-sensitive documents and authenticated for institutional operational guides.

### 7.1 Documentation Structure

```text
Getting Started
  Platform Overview
  Environments
  Institution Onboarding
  Security and Access

By Role
  Central Bank Supervisor
  Central Bank Operator
  Commercial Bank Treasury
  Issuer / Debt Office
  Custodian
  Asset Manager / PE / Fund
  Compliance Officer
  Mobile Approver

Product Guides
  Accounts and Transfers
  Settlement Instruments
  Bond Issuance
  Auctions
  RFQ and DvP
  Custody and Redemption
  Collateral and Repo
  Corporate Actions
  Compliance
  External Connectivity
  Canister Operations

Reference
  Lifecycle States
  Approval Policies
  ISO 20022 Mapping
  APIs and Webhooks
  Error Codes
  Security Model
  Data Sources
  Glossary

Operations
  Status Page
  Incident Runbooks
  Reconciliation
  Support and Escalation
```

### 7.2 Required Page Template

Every support article must include:

1. What this page does.
2. Who can use it.
3. Preconditions and required permissions.
4. What data is shown and where it originates.
5. Step-by-step operational process.
6. Controls, approval requirements and failure states.
7. Important risks / warnings.
8. Reconciliation / audit evidence produced.
9. Frequently asked questions.
10. Escalation and support links.

---

## 8. UX and Responsive Design

### 8.1 Design Rules

- React + TypeScript, accessible component library, responsive CSS and keyboard-first desktop workflows.
- Use data-dense desktop layouts for institutional operation: resizable tables, saved views, filters, bulk exports, comparison panels, drill-down drawers and immutable activity timeline.
- Use clear status colors plus text labels; color is never the only signal.
- Provide currency formatting, decimal precision, timezone, date convention and locale controls.
- Never use fake “real-time” indicators without source timestamp and environment label.

### 8.2 Mobile App / Responsive Route

Mobile scope is intentionally limited to:

- Dashboard overview.
- Critical alerts and operational incidents.
- Approval queue with document review and step-up authentication.
- Read-only account / position view.
- Secure notifications and support.

Mobile must not support unrestricted issuance, canister upgrades, configuration changes, bridge initiation, large-value trade origination or high-risk custody release by default.

---

## 9. Delivery Roadmap

### Phase 0 — Product, Legal and Control Design

- Define target jurisdiction, customer type, regulated partners and permissible live use case.
- Produce legal classification matrix for each asset / token.
- Establish data governance, custody model, settlement model, operating model and risk appetite.
- Convert all existing sample data and brands into explicit demo fixtures; remove unverified claims.

### Phase 1 — Institutional Sandbox MVP

- Authentication, institutions, KYB / KYB workflow stubs, roles, mandates and approvals.
- Demo/sandbox settlement-instrument registry and valueless `sEURD` / `sUSDD` tokens.
- Account ledger, reservations, audit log, RWA catalogue, bond instrument drafts and calculator.
- RFQ and DvP simulator; no public trading and no real money.
- Documentation site, support center and context-help panel.
- ICP Rust canister suite, local replica tests, staging deployment and observability.

### Phase 2 — Controlled Institutional Pilot

- Approved KYC / sanctions provider integrations.
- Custodian attestation workflow, controlled issuance/redemption requests and reconciliation tooling.
- Auction and corporate-action workflow with approval gates.
- Secure bank / payment / custody adapter sandbox integrations.
- Security testing, independent smart-contract/canister assessment, penetration test, disaster-recovery exercise and operational runbooks.

### Phase 3 — Regulated Production Path

- Obtain / partner for the licenses and authorizations needed for the selected service model.
- Enable only approved assets, participants, jurisdictions and settlement rails.
- External audit, legal opinions, governance controls, incident response, SOC / operational-resilience program as applicable.
- Pilot with limited instrument / participant / volume caps; comprehensive reconciliations and supervisory reporting.

### Phase 4 — New Products

Design extensibility now for future products, but add them only through product governance:

- Additional bond types and multi-currency issuance.
- Repo, securities lending and collateral optimization.
- Regulated fund units / private-market instruments.
- Cross-border settlement adapters.
- Green / sustainability-linked reporting.
- Wholesale-liquidity facilities.
- New external-chain integrations only after risk, custody, regulatory and security review.

---

## 10. Acceptance Criteria

The MVP is accepted only when all of the following are true:

- Every environment is visually and technically separated; sandbox instruments cannot be mistaken for live money or securities.
- No immediate `Buy on ICP`, `Redeem`, `Transfer`, `Mint`, `Bridge`, `Execute Payout`, or `Deploy` path exists for a high-risk action.
- All sensitive actions have configurable server/canister-enforced validation, limit checks, policy checks, approval chain, idempotency and immutable audit events.
- Every asset / bond page shows source, timestamp, legal classification, status, documentation and risk disclosures.
- The product has a generic settlement-instrument registry; ckEUR / ckUSD are not assumed or misrepresented.
- A €40M order can be drafted and simulated, but it cannot settle unless balance, eligibility, policy, approvals, compliance, approved rail and reconciliation checks pass.
- Canister upgrades and emergency controls require separated governance roles and full audit trail.
- Reconciliation exceptions, stale oracle data, failed settlement and approval expiry are visible and operationally actionable.
- A side-chat can explain and cite approved bond documents but cannot execute or recommend an investment.
- Every sidebar page has a matching documentation article and contextual help drawer.

---

## 11. Suggested Repository Layout

```text
veritas-ledger/
  apps/
    workstation-web/          # React + TypeScript institutional desktop UI
    mobile-approvals/         # Responsive mobile approval app / route
    docs-portal/              # docs.<domain> support and product docs
    api-gateway/              # Rust services for integrations and read models
  canisters/
    identity-registry/
    policy-engine/
    account-ledger/
    instrument-registry/
    position-ledger/
    issuance-engine/
    auction-engine/
    rfq-engine/
    settlement-engine/
    collateral-engine/
    corporate-actions-engine/
    compliance-case-engine/
    oracle-attestation/
    document-registry/
    ops-governance/
  crates/
    domain-model/
    policy-types/
    audit-types/
    iso20022-types/
    test-fixtures/
  infra/
    docker/
    terraform/
    kubernetes/
    monitoring/
  docs/
    architecture/
    runbooks/
    product-guides/
    compliance/
    api/
  tests/
    integration/
    e2e/
    security/
    migration/
```

---

## 12. AI Implementation Prompt

Use the following prompt with a coding agent. Replace bracketed values before use.

```text
You are the lead product engineer and security-conscious ICP/Rust architect for [PROJECT_NAME]. Build an institutional digital-assets workstation, not a retail crypto app.

MANDATORY STACK
- ICP Internet Computer: Rust canisters using ic-cdk, Candid, stable memory and reproducible WASM builds.
- Backend / integration services: Rust + PostgreSQL.
- Frontend: React + TypeScript + accessible responsive CSS/component system.
- Mobile: responsive React approval application / route, limited to alerts, read-only monitoring and secure approvals.
- Do not introduce a different primary stack.

PRODUCT BOUNDARY
- This is a workflow, recordkeeping, settlement-orchestration and tokenized-assets terminal.
- It is not a central bank, payment system, SWIFT participant, custodian, exchange, CSD, or issuer by default.
- Implement Demo, Sandbox and Production modes with strict technical separation.
- Synthetic/demo data must be labelled. Never present simulated data as live, verified, central-bank, custodial, SWIFT or market data.
- Do not assume ckEUR or ckUSD exists. Implement a generic Settlement Instrument Registry. Sandbox may use valueless/nonredeemable sEURD and sUSDD only.

SECURITY AND CONTROL REQUIREMENTS
1. Every high-risk action (transfer, purchase, RFQ acceptance, trade, mint, redeem, bridge, collateral release, payout, canister upgrade, limit change) must follow:
   Draft → validation → risk/compliance → reservation → configurable maker-checker approvals → pre-execution revalidation → execution → reconciliation → immutable audit record.
2. Replace all “Buy on ICP” buttons with Request Quote, Start Subscription, Create Purchase Instruction, Review Trade, or Submit for Approval. No one-click live purchase.
3. Enforce authorization in canisters/backend, not only in the frontend. Use RBAC + ABAC, organization mandates, transaction limits, jurisdictions, product eligibility, environment and approval thresholds.
4. Prevent self-approval. Make every approval invalid if material transaction fields or policy version change.
5. Use idempotency keys, correlation IDs, durable state machines, bounded data structures, pagination and explicit error states.
6. Keep PII and documents encrypted off-chain; store only minimal references/hashes on-chain. Never store secrets in frontend, canister state or logs.
7. Use raw_rand for randomness; test authorization, upgrades, migrations, state-machine race conditions and failures around await points.
8. CI must include rustfmt, clippy, cargo audit, cargo deny, reproducible build checks, ic-wasm check-endpoints, unit/integration/property/fuzz tests and security scanning.

PERSONAS
Implement role-aware UI and policies for Platform Super Admin, Central Bank Supervisor, Central Bank Operator, Commercial Bank Treasury, Custodian/Notary, Issuer/Debt Office, Asset Manager/PE/Fund, Broker/Dealer, Compliance Officer, Auditor, and Mobile Approver.

SIDEBAR
Implement the role-aware sidebar structure exactly as described in docs/veritas-institutional-ledger-production-spec.md. Migrate the existing modules into logical subpages. Every visible navigation page requires a contextual What is this? drawer and a matching docs portal article.

MVP MODULES
- Institution onboarding: KYB/UBO workflow, legal entity, LEI/BIC fields, mandates, signer setup, roles and environment separation.
- Accounts and settlement instruments: balances, reservations, statements, generic instrument registry, sEURD/sUSDD sandbox tokens.
- Bond lifecycle: instrument templates, configurable terms, legal-document references, coupon schedule, maturity, calculators (clean/dirty price, accrued interest, YTM, duration, DV01), issuance proposals and governed deployment.
- Trading: asset catalogue, RFQ, bilateral trade draft, controlled DvP simulator and settlement exception management.
- Liquidity: available/reserved/blocked funds, limits, payment priority and approval-controlled sweeps.
- Custody: holdings, attestation records, proof-of-reserve evidence metadata, controlled issuance/redemption requests.
- Collateral: eligibility, haircuts, pledge, valuation snapshot and approval-controlled release/substitution.
- Compliance: cases, holds, policy decisions, immutable audit trail and governed lawful-access workflow.
- Operations: canister telemetry, versioning, cycles/memory monitoring, configuration governance, feature flags and incident logs.
- Documentation: docs portal and in-product support; create a Bond Intelligence & Verification panel that answers only using approved versioned documents with citations. It cannot give investment advice or execute actions.

OUTPUT EXPECTATIONS
- First, inspect the existing repository and produce a gap analysis against this specification.
- Then create a phased implementation plan with schemas, canister boundaries, Candid interfaces, API contracts, UI routes, permission matrix, lifecycle diagrams and test plan.
- Implement in small verifiable increments. For each increment, add tests, seed demo data clearly tagged as synthetic, update docs and provide migration notes.
- Stop and ask for clarification before implementing a real external rail, real token issuance, a named financial institution integration, SWIFT integration, custody claim, or live production deployment.
- Do not fabricate partner approvals, prices, custody proof, legal status, ISINs, BICs, LEIs, settlement finality or central-bank connections.
```

---

## 13. Next Build Order

1. Rename and visually label environments; remove unverified production claims and immediate-buy controls.
2. Implement institution onboarding, roles, mandates, WebAuthn/FIDO2, maker-checker queue and immutable audit log.
3. Build the generic settlement-instrument registry with simulated `sEURD` / `sUSDD` only.
4. Implement account partitions, reservations, transfer drafts and controlled DvP sandbox state machine.
5. Add bond instrument wizard, document registry, calculators, auction/RFQ draft flow and corporate-action simulator.
6. Add custody evidence, collateral, reconciliation and exception-management workflows.
7. Build docs portal, contextual help and bond verification side-chat.
8. Complete security hardening, test automation, monitoring, governance, independent reviews and pilot-readiness evidence.
