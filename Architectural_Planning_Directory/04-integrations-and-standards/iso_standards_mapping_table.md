# Standards Mapping Table  
## ISO 20022, ISO 24165, OpenAPI, FIX, FpML, ACTUS for Blockchain Finance Platform  

**Version:** 1.0  
**Date:** 2026-09-01  
**Purpose:** Show, for each major function, which official standards apply and where to implement them.

---

## 1. Master Mapping Table (High-Level)

| # | Domain / Function                          | ISO 20022 Messages (examples)                     | Digital Asset Standard (ISO) | OpenAPI (REST)                    | FIX (Trading)                     | FpML (Derivatives)       | ACTUS (Cash-Flow Logic) | Where to Implement                                                                 |
|---|--------------------------------------------|---------------------------------------------------|------------------------------|-----------------------------------|-----------------------------------|--------------------------|-------------------------|------------------------------------------------------------------------------------|
| 1 | Customer payment initiation                | pain.001, pain.002                                | ISO 24165 (DTI for tokens)   | `POST /payments`                  | –                                 | –                        | –                       | API layer (ingest pain.001), on-chain payment contract, reporting (camt.*)       |
| 2 | Bank-to-bank transfer                      | pacs.008, pacs.009                                | ISO 24165                    | `POST /payments/internal`         | –                                 | –                        | –                       | API ↔ RTGS/CHIPS/SWIFT, on-chain settlement, reconciliation                      |
| 3 | Account statements & reconciliation        | camt.053, camt.052                                | ISO 24165                    | `GET /accounts/{id}/statements`   | –                                 | –                        | –                       | Reporting layer (generate camt.* from on-chain history)                          |
| 4 | Tokenized deposit / stablecoin             | (referenced in pain/pacs/camt)                    | ISO 24165 (DTI per token)    | `GET /assets/tokens`, `POST /...` | –                                 | –                        | –                       | On-chain token contract + API + ISO 20022 references                             |
| 5 | FX conversion (tokenized deposits)         | pacs.008 (with FX), camt.*                        | ISO 24165                    | `POST /fx/convert`                | –                                 | –                        | –                       | On-chain FX logic + API + ISO 20022 messages for cross-currency settlement       |
| 6 | Derivatives trade execution (swaps, etc.)  | (trade confirmation variants), coll.* for margin  | ISO 24165 (if tokenized)     | `POST /trades`                    | NewOrderSingle (D), ExecutionReport (8) | FpML for trade definition | ACTUS (if structured cash-flows) | Trading gateway (FIX), on-chain derivative contract, FpML store, ACTUS engine    |
| 7 | Derivatives lifecycle (margin, cash-flows) | coll.001, coll.002, sese.*                        | ISO 24165                    | `POST /collateral`, `GET /...`    | –                                 | FpML lifecycle           | ACTUS (payment schedule)  | Collateral contract, margin engine, reporting (ISO 20022 + FpML)                 |
| 8 | Bond issuance                              | sese.*, setr.* (securities settlement)            | ISO 24165 + ISIN             | `POST /assets/bonds`              | –                                 | –                        | ACTUS (coupon, amortization) | Bond contract, ACTUS cash-flow engine, ISO 20022 securities messages             |
| 9 | Bond secondary trading                     | sese.*, setr.*                                    | ISO 24165 + ISIN             | `POST /trades/bonds`              | NewOrderSingle, ExecutionReport   | –                        | ACTUS (ownership & cash-flow) | Trading gateway, on-chain transfer, settlement messages                          |
|10 | RWA tokenization (gold, real estate)       | (collateral & securities messages as needed)      | ISO 24165 (DTI per RWA)      | `POST /assets/rwa`                | –                                 | –                        | ACTUS (income distribution) | RWA token contract, legal wrapper, valuation API, ISO references in messages     |
|11 | Tokenized fund shares (MMF, private credit)| sese.*, camt.* (distributions)                    | ISO 24165 + ISIN (if fund)   | `POST /assets/funds`, `GET /...`  | –                                 | –                        | ACTUS (distribution rules) | Fund token contract, NAV engine, distribution logic, reporting                   |
|12 | Collateral management (generic)            | coll.001, coll.002                                | ISO 24165 (for tokenized collateral) | `POST /collateral`, `GET /...` | –                                 | –                        | –                       | Collateral contract, margin calls, ISO 20022 coll.* generation                   |
|13 | Trade & transaction reporting (regulatory) | (various reporting-related ISO 20022 schemas)     | ISO 24165                    | `GET /reporting/trades`, `...`    | –                                 | FpML (for derivatives reporting) | –                 | Reporting layer: generate regulator-specific XML/JSON from canonical events      |
|14 | Accounting export (ERP, GL)                | camt.053 (as statement source)                    | ISO 24165                    | `GET /reporting/accounting`       | –                                 | –                        | –                       | Reporting layer: JSONL/CSV/PDF + optional camt.053 as input to ERP               |

---

## 2. Payments & Cash Management

### 2.1 Customer & Corporate Payments

| Function                          | ISO 20022         | ISO 24165         | OpenAPI                  | FIX  | FpML | ACTUS | Implementation Notes                                                                 |
|-----------------------------------|-------------------|-------------------|--------------------------|------|------|-------|--------------------------------------------------------------------------------------|
| Initiate credit transfer          | pain.001, pain.002| DTI for tokens    | `POST /payments`         | –    | –    | –     | Accept pain.001 XML or JSON; map to internal payment request; execute on-chain.     |
| Payment status                    | pain.002          | DTI               | `GET /payments/{id}`     | –    | –    | –     | Return status (PENDING, SETTLED, FAILED); link to on-chain tx hash.                 |
| Bank-to-bank settlement           | pacs.008, pacs.009| DTI               | `POST /payments/settle`  | –    | –    | –     | For interoperability with RTGS, SWIFT, CHIPS; on-chain as internal settlement rail. |
| Account statements                | camt.053, camt.052| DTI               | `GET /accounts/{id}/statements` | – | –    | –     | Generate camt.053 from on-chain transaction history; also offer JSON/CSV/PDF.       |
| FX conversion between tokens      | pacs.008 (FX fields), camt.* | DTI per currency token | `POST /fx/convert` | – | – | – | On-chain FX pool or oracle-based rates; reflect in statements.                     |

### 2.2 How to Create This in Your System

- **Canonical model:** Internal JSON schema for payments (see `blockchain_enterprise_finance_spec.md`).  
- **Ingress:**  
  - pain.001 XML → parse → validate → internal JSON → on-chain call.  
- **Egress:**  
  - On-chain payment event → internal JSON → generate:
    - camt.053 (XML)  
    - JSONL/CSV for accounting  
    - PDF statement (optional)

---

## 3. Derivatives

### 3.1 Trade Execution & Lifecycle

| Function                          | ISO 20022                  | ISO 24165         | OpenAPI              | FIX                            | FpML                        | ACTUS                         | Implementation Notes                                                       |
|-----------------------------------|------------------------------|-------------------|----------------------|--------------------------------|-----------------------------|-------------------------------|----------------------------------------------------------------------------|
| Trade execution (swap, option)    | (trade confirmation variants)| DTI if tokenized  | `POST /trades`       | NewOrderSingle (D), ExecReport (8) | FpML trade definition       | ACTUS (if structured cash-flows) | FIX gateway → internal order → on-chain derivative contract; store FpML XML.   |
| Trade confirmation                | (securities/trade messages)  | DTI               | `GET /trades/{id}`   | ExecutionReport (8)            | FpML confirmation           | –                             | Generate FpML from on-chain trade; send to counterparty/regulator.           |
| Margin call & collateral          | coll.001, coll.002           | DTI for collateral tokens | `POST /collateral`, `GET /collateral/{id}` | – | FpML (margin terms) | – | Margin engine calculates; coll.* messages generated; collateral posted on-chain. |
| Cash-flow payments (coupons, settlements) | sese.*, camt.*            | DTI               | `GET /trades/{id}/cashflows` | – | FpML cash-flow schedule | ACTUS payment schedule | ACTUS defines dates/amounts; on-chain contract executes payments.           |
| Trade termination / close-out     | sese.*, trade status msgs    | DTI               | `POST /trades/{id}/terminate` | – | FpML termination clause | ACTUS (final cash-flows) | On-chain close-out logic; final cash-flows; regulatory reporting.          |

### 3.2 How to Create This

- **Data model:**  
  - Canonical JSON for trade (UTI, counterparties, legs, rates, dates).  
  - FpML as the “legal/standard” representation stored off-chain (or on-chain as IPFS hash).
- **Workflow:**  
  1. FIX order or API call → create trade.  
  2. On-chain derivative contract emits `TradeExecuted`.  
  3. System generates:
     - FpML document  
     - ISO 20022 trade confirmation (if required)  
     - Internal JSON for reporting & accounting.

---

## 4. Bonds & Fixed Income

### 4.1 Issuance & Trading

| Function                          | ISO 20022             | ISO 24165         | OpenAPI                 | FIX                        | FpML | ACTUS                         | Implementation Notes                                                    |
|-----------------------------------|-----------------------|-------------------|-------------------------|----------------------------|------|-------------------------------|-------------------------------------------------------------------------|
| Bond issuance                     | sese.*, setr.*        | DTI + ISIN        | `POST /assets/bonds`    | –                          | –    | ACTUS (coupon, amortization)  | Define bond terms in ACTUS; mint tokenized bond units; report via ISO.  |
| Secondary market trade            | sese.*, setr.*        | DTI + ISIN        | `POST /trades/bonds`    | NewOrderSingle, ExecReport | –    | ACTUS (ownership & cash-flows)| FIX/API → on-chain transfer; update bond holder registry.               |
| Coupon payment                    | camt.*, sese.*        | DTI               | `GET /assets/bonds/{id}/cashflows` | – | – | ACTUS (coupon schedule)       | ACTUS engine calculates; on-chain contract distributes to holders.      |
| Principal repayment / maturity    | sese.*, camt.*        | DTI               | `POST /assets/bonds/{id}/redeem` | – | – | ACTUS (maturity logic)        | On-chain redemption; update balances; generate statements.              |
| Corporate actions (call, put)     | sese.*, corporate action msgs | DTI       | `POST /assets/bonds/{id}/actions` | – | – | ACTUS (optional redemption)   | Bond contract supports call/put; ACTUS defines conditions & cash-flows. |

### 4.2 How to Create This

- **Bond definition:**  
  - JSON schema with ISIN, DTI, coupon type, rate, frequency, day-count, etc.  
  - ACTUS JSON for cash-flow logic.
- **On-chain:**  
  - Bond token (ERC-20-like or NFT for tranches).  
  - Cash-flow module that reads ACTUS spec and schedules payments.
- **Reporting:**  
  - Generate ISO 20022 securities messages for issuance, transfers, and corporate actions.

---

## 5. Real-World Assets (RWAs) & Tokenized Funds

### 5.1 RWA Tokenization (Gold, Real Estate, Commodities)

| Function                          | ISO 20022                  | ISO 24165         | OpenAPI                  | FIX  | FpML | ACTUS                         | Implementation Notes                                                    |
|-----------------------------------|------------------------------|-------------------|--------------------------|------|------|-------------------------------|-------------------------------------------------------------------------|
| Token issuance (RWA)              | (securities messages as needed) | DTI per RWA       | `POST /assets/rwa`       | –    | –    | ACTUS (income distribution)   | Legal wrapper (SPV/trust) + on-chain token; DTI registered.             |
| Ownership transfer                | setr.*, sese.*              | DTI               | `POST /assets/rwa/transfer` | – | – | –                             | On-chain transfer; update cap table; generate settlement messages.      |
| Valuation update                  | (collateral & reporting msgs)| DTI               | `POST /assets/rwa/{id}/valuation` | – | – | –                             | Oracle or admin updates price; event emitted; used for margin & reporting.|
| Income distribution (rent, yield) | camt.*, sese.*              | DTI               | `POST /assets/rwa/{id}/distribute` | – | – | ACTUS (distribution rules)    | ACTUS defines distribution logic; on-chain contract pays token holders. |

### 5.2 Tokenized Funds (MMF, Private Credit, ETFs)

| Function                          | ISO 20022             | ISO 24165         | OpenAPI                   | FIX  | FpML | ACTUS                         | Implementation Notes                                                    |
|-----------------------------------|-----------------------|-------------------|---------------------------|------|------|-------------------------------|-------------------------------------------------------------------------|
| Fund share issuance / redemption  | sese.*, camt.*        | DTI + ISIN (fund) | `POST /assets/funds/subscribe`, `POST /assets/funds/redeem` | – | – | ACTUS (NAV & distribution)    | NAV calculated; shares minted/burned; distributions per ACTUS.          |
| NAV update                        | (fund reporting msgs) | DTI               | `POST /assets/funds/{id}/nav` | – | – | –                             | Daily/periodic NAV; stored on-chain; used for subscriptions/redemptions.|
| Distribution (dividend, interest) | camt.*, sese.*        | DTI               | `POST /assets/funds/{id}/distribute` | – | – | ACTUS (distribution schedule) | ACTUS defines frequency & rules; on-chain contract distributes.         |

---

## 6. Collateral Management

### 6.1 Generic Collateral & Margin

| Function                          | ISO 20022       | ISO 24165         | OpenAPI                      | FIX  | FpML            | ACTUS | Implementation Notes                                                     |
|-----------------------------------|-----------------|-------------------|------------------------------|------|-----------------|-------|--------------------------------------------------------------------------|
| Collateral request (margin call)  | coll.001        | DTI for tokens    | `POST /collateral/requests`  | –    | FpML (terms)    | –     | Margin engine calculates; coll.001 generated; request stored.            |
| Collateral posting                | coll.002        | DTI               | `POST /collateral/post`      | –    | –               | –     | Counterparty posts tokenized collateral; on-chain; status via coll.002. |
| Collateral release / substitution | coll.002        | DTI               | `POST /collateral/release`   | –    | –               | –     | Release or substitute assets; update positions; generate messages.       |
| Valuation & haircut application   | (collateral reports) | DTI        | `GET /collateral/{id}`       | –    | –               | –     | Daily valuation; haircuts applied; used for margin calculations.         |

---

## 7. Reporting, Accounting, and Audit

### 7.1 Regulatory & Internal Reporting

| Function                          | ISO 20022                  | ISO 24165         | OpenAPI                         | FIX  | FpML                  | ACTUS | Implementation Notes                                                    |
|-----------------------------------|------------------------------|-------------------|---------------------------------|------|-----------------------|-------|-------------------------------------------------------------------------|
| Trade reporting (derivatives)     | (trade reporting schemas)    | DTI               | `GET /reporting/trades`         | –    | FpML (for derivatives)| –     | Generate regulator-specific XML/JSON from canonical trade events.       |
| Securities transaction reporting  | setr.*, sese.*              | DTI + ISIN        | `GET /reporting/securities`     | –    | –                     | –     | Report bond/RWA/fund transfers to regulators.                           |
| Collateral reporting (SFTR, etc.) | coll.*, SFTR-specific schemas| DTI              | `GET /reporting/collateral`     | –    | –                     | –     | Report collateral movements, re-use, haircuts.                          |
| Accounting export (ERP/GL)        | camt.053 (as source)         | DTI               | `GET /reporting/accounting`     | –    | –                     | –     | Produce JSONL, RFC 4180 CSV, PDF; optionally camt.053 as input to ERP.  |
| Audit log                         | (internal, not ISO)          | DTI               | `GET /reporting/audit`          | –    | –                     | –     | Immutable log of all privileged actions; JSONL with hashes.             |

---

## 8. How to Use This Table to Design Your System

### 8.1 Step 1 – Define Canonical JSON Models

For each domain (payments, trades, bonds, RWAs, collateral):

- Create a **canonical JSON schema** that captures all fields needed for:
  - On-chain state  
  - ISO 20022 mapping  
  - FIX/FpML/ACTUS mapping  
  - Reporting & accounting

Example: `Payment`, `DerivativeTrade`, `BondInstrument`, `RwaToken`, `CollateralPosition`.

### 8.2 Step 2 – Map to Standards

For each canonical model:

- Define transformations to:
  - ISO 20022 XML (pain.*, pacs.*, camt.*, coll.*, sese.*, setr.*)  
  - FIX messages (for trades)  
  - FpML (for derivatives)  
  - ACTUS JSON (for cash-flow logic)  
- Store these mappings as:
  - Code (serializer/deserializer modules)  
  - Configuration (field mappings, code lists)

### 8.3 Step 3 – Define OpenAPI Surface

For each function in the table:

- Create OpenAPI paths:
  - `POST /payments`  
  - `POST /trades`  
  - `POST /assets/bonds`  
  - `POST /collateral`  
  - `GET /reporting/*`
- Use the canonical JSON schemas as request/response bodies.
- Document:
  - Which ISO/FIX/FpML/ACTUS standards are involved in the description.

### 8.4 Step 4 – Implement On-Chain Contracts

For each asset class:

- Define smart contract state that mirrors the canonical JSON (minus fields that are off-chain only).  
- Emit events that can be transformed into:
  - ISO 20022 messages  
  - FIX execution reports  
  - FpML lifecycle events  
  - Accounting entries

### 8.5 Step 5 – Build Reporting Pipelines

- Index on-chain events into a reporting DB.  
- For each report type:
  - Query events → build canonical JSON → generate:
    - ISO 20022 XML  
    - FIX/FpML (if needed)  
    - JSONL/CSV/PDF for accounting & audit

---

## 9. Minimal “Starter Set” for Implementation

If you want a pragmatic starting point:

1. **Payments**  
   - ISO 20022: pain.001, pacs.008, camt.053  
   - ISO 24165: DTI for your main token(s)  
   - OpenAPI: `/payments`, `/accounts/{id}/statements`  

2. **Derivatives (one product, e.g., IRS)**  
   - ISO 20022: coll.001, coll.002, trade confirmation variants  
   - FpML: one swap template  
   - FIX: NewOrderSingle, ExecutionReport  
   - OpenAPI: `/trades`, `/collateral`  

3. **Bonds (fixed-rate)**  
   - ISO 20022: sese.*, setr.*, camt.* for coupons  
   - ISIN + ISO 24165 DTI  
   - ACTUS: fixed-rate bond template  
   - OpenAPI: `/assets/bonds`, `/trades/bonds`  

4. **Reporting**  
   - camt.053 as canonical statement format  
   - JSONL + CSV for accounting  
   - Audit log in JSONL  

Once these are in place, you can extend to RWAs, funds, more complex derivatives, and additional regulatory reports.

---

**End of Document**

You can now use this table as a **checklist and design matrix**:

- For each feature you plan, pick the relevant row(s).  
- Implement the canonical model, on-chain logic, API, and reporting according to the listed standards.  

If you want, next step can be:  
- Generate an OpenAPI YAML skeleton from this table.  
- Define canonical JSON schemas for Payments, Derivatives, Bonds, and Collateral.