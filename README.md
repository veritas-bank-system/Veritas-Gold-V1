# Moneta Web3 — Veritas Gold (v0.1)
### Enterprise & Blockchain-Based Real-World Asset (RWA) Market for Central Banks and Enterprises
*A subsidiary of **ICP Moneta** • Licensed to **ICP Moneta***

---

## 🌟 Executive Summary

**Veritas Gold (v0.1)** is an institutional-grade, standalone **Rust-based** financial ledger and Real-World Asset (RWA) exchange engine architected natively for the **Internet Computer (ICP)** and sovereign decentralized networks. 

Engineered specifically for **Central Banks, Institutional Liquidity Desks, Sovereign Wealth Funds, and Enterprise Treasuries**, Veritas Gold provides a high-throughput, mathematically verifiable infrastructure to tokenize, custody, transfer, and trade real-world financial assets—including **LBMA Physical Gold, Sovereign Government Debt Bonds (US Treasuries), Noble Metals, Commercial Real Estate, and tokenized fiat settlement reserves (ckUSD, ckEUR, EUR, USD)**.

---

## 🏗️ Core Architecture & Tech Stack

Veritas Gold is written from the ground up in **100% pure Rust** with strict non-panicking code paths, exact decimal financial precision (`rust_decimal`), orthogonal stable persistence, and high-performance WebAssembly (`wasm32-unknown-unknown`) compilation for ICP canisters.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   VERITAS GOLD CANISTER SUITE                                          │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
  │                                               │                                               │
  ▼                                               ▼                                               ▼
┌────────────────────────────────┐  ┌────────────────────────────────┐  ┌────────────────────────────────┐
│      SETTLEMENT ENGINE         │  │       FINALITY AUTHORITY       │  │        POLICY ENGINE           │
│   Global UTXO & State Store    │  │  Double-Spend Notary Consensus │  │  Conservation of Value Gates  │
└────────────────────────────────┘  └────────────────────────────────┘  └────────────────────────────────┘
  │                                               │                                               │
  ▼                                               ▼                                               ▼
┌────────────────────────────────┐  ┌────────────────────────────────┐  ┌────────────────────────────────┐
│         ASSET LEDGER           │  │        POSITION LEDGER         │  │       IDENTITY REGISTRY        │
│  UTXO Coin Selection & Split   │  │   Demand Deposits & Limits     │  │   Blinded Keys & KYC Profiles  │
└────────────────────────────────┘  └────────────────────────────────┘  └────────────────────────────────┘
```

### 🦀 Rust Crate Topology
1. **`crates/domain`**: Foundational value objects (`Amount`, `CurrencyCode`, `PrincipalId`, `AccountId`, `HoldingId`, `RecordPointer`), rich entities (`DemandDepositRecord`, `FungibleAssetHolding`, `DiscreteAssetHolding`, `BlindedIdentity`), and typed domain errors.
2. **`crates/policy-engine`**: Deterministic verification policies (`AssetConservationPolicy`, `AccountRuleSet`, `SignaturePolicy`, `PolicyEngine`).
3. **`crates/finality-authority`**: Atomic consensus notary preventing double-spends and issuing cryptographic SHA-256 `FinalityProof` attestations.
4. **`crates/settlement-engine`**: Authoritative record state machine with inverted participant indexing (`LocalLedgerView`).
5. **`crates/identity-registry`**: Enterprise directory for verified legal entities and zero-knowledge `BlindedIdentity` generation with ownership proofs.
6. **`crates/position-ledger`**: Multi-currency cash partitions, demand deposits, approved overdraft facilities, and daily velocity checks.
7. **`crates/asset-ledger`**: Digital asset issuance (minting), split-and-move mechanics, and automated UTXO coin selection.
8. **`crates/protocol-coordinator`**: Asynchronous multi-party state machine orchestrator for wire transfers, asset movements, and blinded identity swaps.
9. **`crates/icp-canister-suite`**: ICP Canister environment, Candid interface bindings, and high-performance JSON-RPC gateway.
10. **`crates/shared-testkit`**: Comprehensive integration and property-based test harness verifying 100% invariant preservation.

### 💻 Frontend Tech Stack
- **React 19 + TypeScript + Vite**
- **Red Broadcast Design System**: High-contrast, institutional dark/light surfaces, 9999px pill components, flat financial input borders, and responsive layouts.
- **Lucide Icons** & **Roboto / Roboto Mono** typography.

---

## ⚡ Key Platform Features

### 1. 🥇 RWA Tokenization & Buyable Asset Catalog
Directly issue, evaluate, and trade tokenized real-world assets:
- **🏆 LBMA Physical Gold (1 oz Bar)**: 99.99% pure allocated physical bars secured in Swiss vaults.
- **🏛️ Sovereign Government Debt (US Treasury 3M Bills - AA+)**: Direct sovereign yield guarantees.
- **🏢 Commercial Real Estate Equity**: Fractionalized prime commercial property equity notarized on-chain.
- **🪙 Tokenized Settlement Reserves**: Institutional cash reserves including **ckUSD**, **ckEUR**, **EUR**, and **USD**.

### 2. 🕶️ Dual-Key Institutional Privacy & Regulatory Supervision
- **Peer-to-Peer Commercial Privacy**: Market participants trade using ephemeral **`BlindedIdentity`** addresses (`ryjl3-hexae...`), protecting trade strategies, volume, and portfolio balances from competitor observation and front-running.
- **100% Central Bank & Admin Oversight**: The **Supervisory Radar** enables authorized regulatory authorities to unmask legal entity ownership, monitor concentration limits, and verify systemic solvency invariants in real time with cryptographic attestation proofs.

### 3. 🤝 Peer-to-Peer RWA Trade Book & Atomic DvP Settlement
- **Institutional Orderbook**: Create and publish custom sell offers for tokenized government bonds, physical gold, and real estate.
- **Atomic Delivery-versus-Payment (DvP)**: 1-click offer acceptance atomically debits buyer cash, credits seller cash, and transfers the RWA UTXO in a single atomic transaction with zero counterparty default risk.

### 4. ⚡ Request-for-Quote (RFQ) Trade Desk
- Request guaranteed price quotes for physical gold and bonds with a live **15-second countdown timer**.
- **Best Execution Advisory**: Institutional spread transparency and instant one-tap settlement.

### 5. 🏛️ Digital Banking Card & Wire Surface
- **Virtual Titanium Corporate Card**: Real-time spending power calculation (Settled Balance + Overdraft Facility).
- **Instant Wire Payments**: Sub-second inter-account transfers with daily velocity caps.
- **Quick Pay Contacts**: Instant settlement to pre-approved institutional counterparties.

---

## 🏛️ Two Institutional Workspaces — Complete Screen Tour

Veritas Gold's console is organized into **two workspace scopes** selected at login. Both share the same identity, compliance, custody, settlement, and audit infrastructure — the selection determines navigation, permissions, data scope, and approval rules:

- **🏛️ Central Bank Workspace** (red accent) — reserve management & monetary operations. Personas: `persona_cb_governor` (Central Bank Operator & Governor), `persona_super_admin` (Platform Super Admin & Operator), `persona_supervisory_auditor` (Supervisory & Compliance Auditor).
- **🏦 Commercial Bank / Agency Workspace** (violet accent) — institutional trading & settlement. Personas: `persona_comm_treasury` (Commercial Bank Treasury & Primary Dealer), `persona_issuer_dmo` (Sovereign Debt Issuer / DMO Lead), `persona_custodian_vault` (Qualified Custodian & Vault Notary), `persona_fund_asset_mgr` (Institutional Asset Manager / PE Fund).

### ✨ Workspace & Console Features (detail list)

- **Workspace gate** — MFA-enforced chooser with Sovereign/Wholesale tiers; each workspace scopes its own login surface, persona roster, banner text, and flagship default persona.
- **Workspace-scoped navigation** — 6 nav groups / 29 menu points for the Central Bank console, 7 nav groups / 34 menu points for the institutional console; every one of the **49 `AppSection` values is renderable** via a canonical alias resolver (legacy ids + 19 workspace policy ids map onto shared views).
- **Central Bank Executive Dashboard** — rebuilt to the institutional screen contract: institution context bar, 8 policy-bounded KPI cards (value · unit · change · policy target · status · updated · source), reserve-allocation donut, 12-week liquidity forecast chart, gold price history chart, calendar-year sovereign bond ladder 2026–2030+, risk-limit usage strip, and approvals/exceptions/exposures tables.
- **ContractKit component library** — reusable screen-contract primitives: `InstitutionContextBar`, `StatusBadge` (6 tones), `EnvironmentBadge`, `SecurityLevelBadge`, `ApprovalCounter`, `CriticalAlertCounter`, `FilterBar`, `MetricCard`, `DetailDrawer` (§27 standard sections), §28 loading/error/empty/stale states, `ApprovalDialog` (§32: 17 fields, irreversibility warning, type-EXECUTE gating), `ExportMenu`.
- **Maker-checker approval workflow** — clickable table rows open §27 detail drawers; Approve raises the §32 execution dialog with quorum, dual-control sign-off, and toast confirmation.
- **Institutional Bank Dashboard** — treasury & trading console with position cards, order-flow bars, settlement queue, and MTD P&L under the violet workspace theme.
- **Sandbox safety** — every screen runs against the `SANDBOX (sEURD)` simulated ledger; workspace policy scoping is enforced in the frontend gate (backend authorization is a separate layer).
- **Mobile surface** — the mobile prototype honors the same workspace scoping (scoped drawer banner, quick group, persona filter).

### 🖼️ Screen Captures

All 83 captures below were taken from the running sandbox build (backend `http://localhost:8080` in-memory ledger, frontend `:5175`) at 1600×1000 (desktop), the iPad device frame (tablet) and a 412×915 viewport (mobile). Each row states the **menu point** (sidebar label · section id) and the **persona** logged in when the capture was taken. Aliased menu points note the canonical view they render.

> 🔁 **One-command regeneration:** `npm run capture:tour` (from the repo root) re-captures every shot and rewrites `docs/screenshots/manifest.json` + `docs/index.html` — see [scripts/](scripts/).
> 🌐 **Filterable tour site:** [docs/index.html](docs/index.html) renders all captures with per-persona, per-workspace, per-surface filters (GitHub Pages / any static host).

#### Authentication & Workspace Gate

| Screenshot | Menu Point | Persona | Description |
|---|---|---|---|
| <img src="docs/screenshots/auth/00-workspace-chooser.png" width="380"/> | **Workspace Chooser** · entry gate | — (pre-login) | Sovereign vs Wholesale tier cards; selection decides nav, permissions, limits, data scope, and approval rules. |
| <img src="docs/screenshots/auth/01-central-bank-login-governor.png" width="380"/> | **Central Bank Login** · workspace-scoped auth | `persona_cb_governor` | GOLD-branded login: flagship Governor preselected, 3 admitted roles, env pills (SANDBOX/DEMO/PRODUCTION), database engine, runtime surface, and auth-protocol selectors. |
| <img src="docs/screenshots/auth/02-institutional-login-treasury.png" width="380"/> | **Institutional Login** · workspace-scoped auth | `persona_comm_treasury` | Same contract for the Commercial Bank/Agency workspace with its 4 admitted roles and Primary Dealer flagship. |
| <img src="docs/screenshots/auth/03-central-bank-persona-switcher.png" width="380"/> | **Switch Persona** · `Switch Persona` (top bar) | any CB role | Full-screen re-authentication overlay listing the 3 admitted Central Bank roles (Super Admin, Governor, Supervisory Auditor) with clearance levels and credentials. |
| <img src="docs/screenshots/auth/04-institutional-persona-switcher.png" width="380"/> | **Switch Persona** · `Switch Persona` (top bar) | any institutional role | Same overlay for the institutional workspace listing its 4 admitted roles (Treasury, Custodian, DMO, Asset Manager). |

#### 🏛️ Central Bank Workspace — captured as `persona_cb_governor` (Central Bank Operator & Governor, Swiss National Bank / CBRT Sovereign Desk)

**Group: WORKSPACE**

| Screenshot | Menu Point | Persona | Description |
|---|---|---|---|
| <img src="docs/screenshots/central-bank/01-executive-dashboard.png" width="380"/> | **Executive Dashboard** · `cb_dashboard` | Central Bank Operator & Governor | Reserve command center: €14.2B official reserves, allocated gold, sovereign bonds, FX & cash, intraday liquidity, risk-limit usage, 4/5 BFT settlement health, compliance alerts — with policy targets and sources. |
| <img src="docs/screenshots/central-bank/02-tasks-and-approvals.png" width="380"/> | **Tasks & Approvals** · `governance` | Central Bank Operator & Governor | Maker-checker approval queue: high-value wires, LBMA gold minting tokenization, 1/2 quorum signatures, Sign & Authorize dual control. |
| <img src="docs/screenshots/central-bank/03-notifications.png" width="380"/> | **Notifications** · `support` | Central Bank Operator & Governor | Support & documentation portal with system notifications. |

**Group: RESERVES & TREASURY**

| Screenshot | Menu Point | Persona | Description |
|---|---|---|---|
| <img src="docs/screenshots/central-bank/04-reserve-overview.png" width="380"/> | **Reserve Overview** · `portfolio` | Central Bank Operator & Governor | Official reserve accounts, virtual corporate card with spending power, instant wires, and quick-pay counterparties. |
| <img src="docs/screenshots/central-bank/05-gold-and-bullion.png" width="380"/> | **Gold & Bullion** · `vault` | Central Bank Operator & Governor | Allocated LBMA physical gold bar custody positions and holdings. |
| <img src="docs/screenshots/central-bank/06-government-bonds.png" width="380"/> | **Government Bonds** · `terminal` | Central Bank Operator & Governor | RWA Capital Markets & Trading Terminal — TradingView-style multi-chart engine for sovereign bonds, gold, FX, and RWA instruments. |
| <img src="docs/screenshots/central-bank/07-fx-and-money-markets.png" width="380"/> | **FX & Money Markets** · `interoperability` | Central Bank Operator & Governor | FX corridors and money-market operations over ISO 20022 messaging. |
| <img src="docs/screenshots/central-bank/08-portfolio-management.png" width="380"/> | **Portfolio Management** · `liquidity_pools` | Central Bank Operator & Governor | Wholesale AMM liquidity pools for reserve portfolio deployment. |
| <img src="docs/screenshots/central-bank/09-liquidity-management.png" width="380"/> | **Liquidity Management** · `sweeper` | Central Bank Operator & Governor | Automated liquidity sweeping engine across settlement accounts. |
| <img src="docs/screenshots/central-bank/10-settlement-accounts.png" width="380"/> | **Settlement Accounts** · `settlement_instruments` | Central Bank Operator & Governor | sEURD settlement token registry and account instruments. |

**Group: CUSTODY & SETTLEMENT**

| Screenshot | Menu Point | Persona | Description |
|---|---|---|---|
| <img src="docs/screenshots/central-bank/11-custody-and-vaults.png" width="380"/> | **Custody & Vaults** · `vault_telemetry` | Central Bank Operator & Governor | Proof-of-Reserve IoT vault telemetry with live attestation stream. |
| <img src="docs/screenshots/central-bank/12-settlement-monitor.png" width="380"/> | **Settlement Monitor** · `notaries` | Central Bank Operator & Governor | BFT notary consensus health and executive settlement dashboard. |
| <img src="docs/screenshots/central-bank/13-payments-and-iso-20022.png" width="380"/> | **Payments & ISO 20022** · `iso20022_bridge` (renders `interoperability`) | Central Bank Operator & Governor | pacs.008 cross-network payment bridge. |
| <img src="docs/screenshots/central-bank/14-reconciliation.png" width="380"/> | **Reconciliation** · `logs` | Central Bank Operator & Governor | camt.053 statements, general ledger, and reconciliation records. |
| <img src="docs/screenshots/central-bank/15-delivery-and-transfers.png" width="380"/> | **Delivery & Transfers** · `trade` | Central Bank Operator & Governor | Trade blotter with atomic DvP settlement legs and offer book. |

**Group: RISK & POLICY**

| Screenshot | Menu Point | Persona | Description |
|---|---|---|---|
| <img src="docs/screenshots/central-bank/16-risk-dashboard.png" width="380"/> | **Risk Dashboard** · `compliance` | Central Bank Operator & Governor | Supervisory risk radar across participants and exposures. |
| <img src="docs/screenshots/central-bank/17-exposure-and-limits.png" width="380"/> | **Exposure & Limits** · `cb_limits` (renders `compliance`) | Central Bank Operator & Governor | Policy exposure limits and utilization monitoring. |
| <img src="docs/screenshots/central-bank/18-counterparties.png" width="380"/> | **Counterparties** · `identity_admin` | Central Bank Operator & Governor | KYC registry with blinded identities and admitted legal entities. |
| <img src="docs/screenshots/central-bank/19-stress-testing.png" width="380"/> | **Stress Testing** · `cb_stress` (renders `compliance`) | Central Bank Operator & Governor | Scenario-based stress testing of reserve and settlement resilience. |
| <img src="docs/screenshots/central-bank/20-compliance-dashboard.png" width="380"/> | **Compliance Dashboard** · `cb_compliance_dash` (renders `compliance`) | Central Bank Operator & Governor | 10-yr GDPR-grade compliance dashboard. |

**Group: ACCOUNTING & REPORTING**

| Screenshot | Menu Point | Persona | Description |
|---|---|---|---|
| <img src="docs/screenshots/central-bank/21-statements-and-gl.png" width="380"/> | **Statements & GL** · `statements_gl` (renders `logs`) | Central Bank Operator & Governor | Official statements and general ledger extraction. |
| <img src="docs/screenshots/central-bank/22-valuation-and-pandl.png" width="380"/> | **Valuation & P&L** · `cb_valuation` (renders `logs`) | Central Bank Operator & Governor | Mark-to-market valuation and P&L reporting. |
| <img src="docs/screenshots/central-bank/23-regulatory-reports.png" width="380"/> | **Regulatory Reports** · `cb_reg_reports` (renders `logs`) | Central Bank Operator & Governor | Official regulatory report generation. |
| <img src="docs/screenshots/central-bank/24-audit-center.png" width="380"/> | **Audit Center** · `cb_audit` (renders `logs`) | Central Bank Operator & Governor | Immutable audit trail center. |

**Group: GOVERNANCE**

| Screenshot | Menu Point | Persona | Description |
|---|---|---|---|
| <img src="docs/screenshots/central-bank/25-institutions.png" width="380"/> | **Institutions** · `enterprise_admin` | Central Bank Operator & Governor | Institution registry with accounts and holdings. |
| <img src="docs/screenshots/central-bank/26-users-and-roles.png" width="380"/> | **Users & Roles** · `identity_admin` | Central Bank Operator & Governor | Same KYC registry view as Counterparties, opened from the governance group. |
| <img src="docs/screenshots/central-bank/27-mandates-and-policies.png" width="380"/> | **Mandates & Policies** · `cb_mandates` (renders `governance`) | Central Bank Operator & Governor | Board mandates and policy approval workflow. |
| <img src="docs/screenshots/central-bank/28-access-logs.png" width="380"/> | **Access Logs** · `secure_chat` | Central Bank Operator & Governor | Signal-grade encrypted comms and access logging. |
| <img src="docs/screenshots/central-bank/29-system-configuration.png" width="380"/> | **System Configuration** · `canister_mgmt` | Central Bank Operator & Governor | WASM canister fleet operations and upgrades. |

#### 🏦 Institutional Workspace — captured as `persona_comm_treasury` (Commercial Bank Treasury & Primary Dealer, JPMorgan Chase Bank N.A. Kinexys Desk)

**Group: WORKSPACE**

| Screenshot | Menu Point | Persona | Description |
|---|---|---|---|
| <img src="docs/screenshots/institutional/01-bank-dashboard.png" width="380"/> | **Bank Dashboard** · `inst_dashboard` | Commercial Bank Treasury & Primary Dealer | Treasury & trading console: welcome brief, position cards, order flow, settlement queue, and MTD P&L under the violet theme. |
| <img src="docs/screenshots/institutional/02-client-orders.png" width="380"/> | **Client Orders** · `trader_desk` | Commercial Bank Treasury & Primary Dealer | Client order book with RFQ and offer handling. |
| <img src="docs/screenshots/institutional/03-rfq-inbox.png" width="380"/> | **RFQ Inbox** · `trade` | Commercial Bank Treasury & Primary Dealer | Incoming RFQs and the trade blotter with atomic DvP offers. |
| <img src="docs/screenshots/institutional/04-tasks-and-approvals.png" width="380"/> | **Tasks & Approvals** · `governance` | Commercial Bank Treasury & Primary Dealer | Maker-checker approval queue for institutional operations. |
| <img src="docs/screenshots/institutional/05-notifications.png" width="380"/> | **Notifications** · `support` | Commercial Bank Treasury & Primary Dealer | Support & documentation portal. |

**Group: MARKETS**

| Screenshot | Menu Point | Persona | Description |
|---|---|---|---|
| <img src="docs/screenshots/institutional/06-gold-market.png" width="380"/> | **Gold Market** · `vault` | Commercial Bank Treasury & Primary Dealer | Gold (XAU) market positions and custody inventory. |
| <img src="docs/screenshots/institutional/07-government-bonds.png" width="380"/> | **Government Bonds** · `terminal` | Commercial Bank Treasury & Primary Dealer | RWA trading terminal for sovereign bond trading. |
| <img src="docs/screenshots/institutional/08-fx-and-money-markets.png" width="380"/> | **FX & Money Markets** · `interoperability` | Commercial Bank Treasury & Primary Dealer | FX corridors and money-market rails. |
| <img src="docs/screenshots/institutional/09-market-making.png" width="380"/> | **Market Making** · `liquidity_pools` | Commercial Bank Treasury & Primary Dealer | Wholesale AMM pool market-making positions. |
| <img src="docs/screenshots/institutional/10-auctions.png" width="380"/> | **Auctions** · `auctions` | Commercial Bank Treasury & Primary Dealer | Primary Dutch auction participation for sovereign debt issuance. |

**Group: TREASURY**

| Screenshot | Menu Point | Persona | Description |
|---|---|---|---|
| <img src="docs/screenshots/institutional/11-cash-and-liquidity.png" width="380"/> | **Cash & Liquidity** · `portfolio` | Commercial Bank Treasury & Primary Dealer | Cash accounts, cards, and payment surfaces. |
| <img src="docs/screenshots/institutional/12-inventory-and-positions.png" width="380"/> | **Inventory & Positions** · `inst_inventory` (renders `vault`) | Commercial Bank Treasury & Primary Dealer | Live asset inventory and position keeping. |
| <img src="docs/screenshots/institutional/13-settlement-accounts.png" width="380"/> | **Settlement Accounts** · `settlement_instruments` | Commercial Bank Treasury & Primary Dealer | sEURD settlement instruments. |
| <img src="docs/screenshots/institutional/14-funding.png" width="380"/> | **Funding** · `sweeper` | Commercial Bank Treasury & Primary Dealer | Funding sweeps across settlement accounts. |

**Group: FINANCING & COLLATERAL**

| Screenshot | Menu Point | Persona | Description |
|---|---|---|---|
| <img src="docs/screenshots/institutional/15-repo-and-reverse-repo.png" width="380"/> | **Repo & Reverse Repo** · `inst_repo` (renders `collateral`) | Commercial Bank Treasury & Primary Dealer | Term repo/reverse-repo financing desk. |
| <img src="docs/screenshots/institutional/16-gold-loans-and-leases.png" width="380"/> | **Gold Loans & Leases** · `inst_gold_loans` (renders `collateral`) | Commercial Bank Treasury & Primary Dealer | Gold lease and loan book. |
| <img src="docs/screenshots/institutional/17-securities-lending.png" width="380"/> | **Securities Lending** · `inst_sec_lending` (renders `collateral`) | Commercial Bank Treasury & Primary Dealer | Securities lending & borrowing (SLB) desk. |
| <img src="docs/screenshots/institutional/18-collateral-desk.png" width="380"/> | **Collateral Desk** · `collateral` | Commercial Bank Treasury & Primary Dealer | Collateral pledges and encumbrance management. |

**Group: OPERATIONS**

| Screenshot | Menu Point | Persona | Description |
|---|---|---|---|
| <img src="docs/screenshots/institutional/19-settlement-monitor.png" width="380"/> | **Settlement Monitor** · `notaries` | Commercial Bank Treasury & Primary Dealer | BFT notary consensus and settlement health. |
| <img src="docs/screenshots/institutional/20-custody.png" width="380"/> | **Custody** · `vault_telemetry` | Commercial Bank Treasury & Primary Dealer | Proof-of-Reserve vault telemetry. |
| <img src="docs/screenshots/institutional/21-payments-and-iso-20022.png" width="380"/> | **Payments & ISO 20022** · `iso20022_bridge` (renders `interoperability`) | Commercial Bank Treasury & Primary Dealer | pacs.008 payment bridge. |
| <img src="docs/screenshots/institutional/22-reconciliation.png" width="380"/> | **Reconciliation** · `logs` | Commercial Bank Treasury & Primary Dealer | camt.053 reconciliation stream. |
| <img src="docs/screenshots/institutional/23-delivery-and-transfers.png" width="380"/> | **Delivery & Transfers** · `corporate_actions` | Commercial Bank Treasury & Primary Dealer | Corporate actions and coupon payout processing. |

**Group: RISK & COMPLIANCE**

| Screenshot | Menu Point | Persona | Description |
|---|---|---|---|
| <img src="docs/screenshots/institutional/24-risk-and-limits.png" width="380"/> | **Risk & Limits** · `inst_limits` (renders `compliance`) | Commercial Bank Treasury & Primary Dealer | Desk-level risk limits monitoring. |
| <img src="docs/screenshots/institutional/25-counterparties.png" width="380"/> | **Counterparties** · `identity_admin` | Commercial Bank Treasury & Primary Dealer | KYC counterparties registry. |
| <img src="docs/screenshots/institutional/26-compliance.png" width="380"/> | **Compliance** · `compliance` | Commercial Bank Treasury & Primary Dealer | AML/KYC compliance radar. |
| <img src="docs/screenshots/institutional/27-margin-and-collateral.png" width="380"/> | **Margin & Collateral** · `inst_margin` (renders `collateral`) | Commercial Bank Treasury & Primary Dealer | Margin requirements and collateral provisioning. |
| <img src="docs/screenshots/institutional/28-surveillance.png" width="380"/> | **Surveillance** · `inst_surveillance` (renders `compliance`) | Commercial Bank Treasury & Primary Dealer | Market-abuse surveillance. |

**Group: REPORTING & ADMIN**

| Screenshot | Menu Point | Persona | Description |
|---|---|---|---|
| <img src="docs/screenshots/institutional/29-pandl-and-valuation.png" width="380"/> | **P&L and Valuation** · `inst_pnl` (renders `logs`) | Commercial Bank Treasury & Primary Dealer | Month-to-date P&L and mark-to-market valuation. |
| <img src="docs/screenshots/institutional/30-client-statements.png" width="380"/> | **Client Statements** · `inst_client_stmts` (renders `logs`) | Commercial Bank Treasury & Primary Dealer | Client statement generation. |
| <img src="docs/screenshots/institutional/31-regulatory-reports.png" width="380"/> | **Regulatory Reports** · `cb_reg_reports` (renders `logs`) | Commercial Bank Treasury & Primary Dealer | Official regulatory reporting. |
| <img src="docs/screenshots/institutional/32-audit.png" width="380"/> | **Audit** · `cb_audit` (renders `logs`) | Commercial Bank Treasury & Primary Dealer | Immutable audit trail. |
| <img src="docs/screenshots/institutional/33-users-and-roles.png" width="380"/> | **Users & Roles** · `enterprise_admin` | Commercial Bank Treasury & Primary Dealer | Account and holdings administration. |
| <img src="docs/screenshots/institutional/34-apis-and-integrations.png" width="380"/> | **APIs & Integrations** · `inst_apis` (renders `canister_mgmt`) | Commercial Bank Treasury & Primary Dealer | FIX/ISO API and integration configuration over the canister fleet. |

---

#### 👤 Persona Roster — every console identity (7 roles)

The workspace dashboards are shared per workspace; the logged-in **persona** drives the institution context bar, the INSTITUTIONAL ACTION DESK ribbon, the ACTIVE PERSONA card, permissions, and data scope. Each capture below shows a different persona authenticated into its workspace (visible in the context bar and the "Authenticated as …" toast).

| Persona (id · role · institution) | Workspace | Screenshot | Description |
|---|---|---|---|
| `persona_cb_governor` · Central Bank Operator & Governor · Swiss National Bank / CBRT Sovereign Desk | Central Bank | [central-bank/01-executive-dashboard.png](docs/screenshots/central-bank/01-executive-dashboard.png) | Flagship sovereign session (Level 5 Sovereign Root Key) over the Executive Dashboard. |
| `persona_super_admin` · Platform Super Admin & Operator · Sovereign Network Operations Center (NOC) | Central Bank | <img src="docs/screenshots/central-bank/30-persona-super-admin.png" width="380"/> | Platform-root master session: NOC identity in the context bar, master-operator clearance ribbon, full console reach. |
| `persona_supervisory_auditor` · Supervisory & Compliance Auditor · Bank for International Settlements (BIS) / ECB Radar | Central Bank | <img src="docs/screenshots/central-bank/31-persona-supervisory-auditor.png" width="380"/> | Read-only supervisory session (Level 5 Zero-Knowledge Audit) over the reserve console. |
| `persona_comm_treasury` · Commercial Bank Treasury & Primary Dealer · JPMorgan Chase Bank, N.A. (Kinexys Desk) | Institutional | [institutional/01-bank-dashboard.png](docs/screenshots/institutional/01-bank-dashboard.png) | Flagship primary-dealer session (Level 4) over the Treasury & Trading Console. |
| `persona_custodian_vault` · Qualified Custodian & Vault Notary · Zurich Swiss Bullion Custody AG | Institutional | <img src="docs/screenshots/institutional/36-persona-custodian-vault.png" width="380"/> | Physical-title custody session (Level 4): vault notary identity with PoR attestation duties. |
| `persona_issuer_dmo` · Sovereign Debt Issuer / DMO Lead · Republic Debt Management Office (DMO) | Institutional | <img src="docs/screenshots/institutional/35-persona-issuer-dmo.png" width="380"/> | Debt-placement session: bond prospectus drafting, Dutch auction scheduling, coupon authorization. |
| `persona_fund_asset_mgr` · Institutional Asset Manager / PE Fund · BlackRock / Veritas Institutional Alpha Fund | Institutional | <img src="docs/screenshots/institutional/37-persona-fund-asset-mgr.png" width="380"/> | Accredited institutional session (Level 3): bond trading, FX corridors, collateral margin desk. |

#### 📱 Mobile Surface (iPhone runtime)

The top-bar runtime switcher (`Workstation / Tablet (iPad) / Mobile (iPhone)`) renders the dedicated **VERITAS MOBILE** surface with its own workspace-scoped drawer. Two menu points exist only here — `⚡ Live MVP Verification` and `👑 Master Dashboard Radar`.

| Screenshot | Menu Point | Persona | Description |
|---|---|---|---|
| <img src="docs/screenshots/mobile/central-bank-home.png" width="300"/> | **Mobile Home** · CB workspace | `persona_cb_governor` | VERITAS MOBILE home for the Central Bank workspace with scoped quick actions. |
| <img src="docs/screenshots/mobile/central-bank-drawer.png" width="300"/> | **Menu Drawer** · workspace-scoped tree | `persona_cb_governor` | Full categorized mobile menu (Workspace & Master Radar, Accounts & Cash, Markets & Asset Issuance, …) scoped to the CB workspace. |
| <img src="docs/screenshots/mobile/live-mvp-verification.png" width="300"/> | **Live MVP Verification** · `mvp_verification` (mobile-only) | `persona_cb_governor` | ⚡ 6/6 live invariant test suite: conservation of value, notary consensus, and settlement invariants. |
| <img src="docs/screenshots/mobile/master-dashboard-radar.png" width="300"/> | **Master Dashboard Radar** · `admin_overview` (mobile-only) | `persona_cb_governor` | 👑 Master radar dashboard — global participant and liquidity monitoring. |
| <img src="docs/screenshots/mobile/institutional-home.png" width="300"/> | **Mobile Home** · Institutional workspace | `persona_comm_treasury` | VERITAS MOBILE home for the Commercial Bank/Agency workspace (Treasury quick group). |
| <img src="docs/screenshots/mobile/institutional-drawer.png" width="300"/> | **Menu Drawer** · workspace-scoped tree | `persona_comm_treasury` | Institutional mobile drawer with Bank Dashboard / Client Orders / RFQ / Gold Market / Repo & Collateral quick links. |

#### 🖥️ Tablet (iPad) Runtime

The `Tablet (iPad)` top-bar switcher mounts the same **VERITAS MOBILE** surface inside a dedicated iPad device frame (`.tablet-frame`, centered on the desktop canvas) — the run-time surface between Workstation and Phone. The frame keeps the mobile persona mandate card, quick actions, colleague approval chain and bottom navigation at tablet scale; the desktop top bar (workspace, environment, runtime switcher, Switch Persona / Logout) stays visible above it.

| Screenshot | Menu Point | Persona | Description |
|---|---|---|---|
| <img src="docs/screenshots/tablet/central-bank-home.png" width="380"/> | **Home Dashboard** · `cb_dashboard` | `persona_cb_governor` | VERITAS MOBILE in the iPad frame: Central Bank workspace home — active signer mandate (FIPS 140-2 Level 5), €2.45B total cash available, Buy Gold / Bonds and Sign Chain actions. |
| <img src="docs/screenshots/tablet/central-bank-drawer.png" width="380"/> | **Menu Drawer** · workspace-scoped tree | `persona_cb_governor` | VERITAS NAVIGATION drawer on the iPad surface: Reserve & Policy Desk quick group plus the full shared-module tree (Master Radar, MVP Verification, Accounts & Cash, Markets & Asset Issuance, …). |
| <img src="docs/screenshots/tablet/institutional-home.png" width="380"/> | **Home Dashboard** · `inst_dashboard` | `persona_comm_treasury` | iPad frame for the Commercial Bank/Agency workspace: Treasury & Primary Dealer mandate card with the same Buy/Sign action pair. |
| <img src="docs/screenshots/tablet/institutional-drawer.png" width="380"/> | **Menu Drawer** · workspace-scoped tree | `persona_comm_treasury` | Institutional navigation drawer on the iPad surface: Trading & Treasury Desk quick group (Bank Dashboard, Client Orders, RFQ Inbox, Gold Market, Repo & Collateral) plus shared modules. |

---

## 🚀 Quickstart & Local Deployment

### 1. Prerequisites
- **Rust Toolchain**: `rustc >= 1.80` with target `wasm32-unknown-unknown`
- **Node.js**: `node >= 20.0` and `npm >= 10.0`

### 2. Build & Test Rust Backend
```bash
# Run full workspace unit and integration test suite
cargo test --workspace

# Verify WebAssembly target compilation for ICP canisters
cargo check --target wasm32-unknown-unknown --workspace --lib

# Run strict linter and formatting checks
cargo clippy --workspace --all-targets -- -D warnings
cargo fmt --check
```

### 3. Start Local Backend Gateway
```bash
cargo run -p icp-canister-suite
# Backend running at: http://localhost:8080
# Health Check: http://localhost:8080/health
```

### 4. Launch Frontend Web Application
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
# Frontend running at: http://localhost:5173
```

### 5. Regenerate the Screen Tour (optional)
```bash
# from the repo root (Veritas/)
npm run capture:tour
# → re-captures all 83 shots into docs/screenshots/ (needs headless google-chrome,
#   frontend on :5175 and backend on :8080) and rewrites docs/screenshots/manifest.json
cd scripts && node init-site.mjs   # rebuild docs/index.html (filterable site)
```

---

## 📜 Versioning & Legal Notice

- **System Version**: `v0.1`
- **Entity**: **Veritas Gold**, a subsidiary of **ICP Moneta**.
- **License**: Proprietary License to **ICP Moneta**. All rights reserved.
