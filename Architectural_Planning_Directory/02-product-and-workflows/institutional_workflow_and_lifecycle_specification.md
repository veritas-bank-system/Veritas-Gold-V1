# 🏛️ Institutional Workflow & Multi-Persona Lifecycle Specification

> **Operational Mandate**: The platform shall offer an end-to-end, deterministic workflow tailored for large financial institutions, central banks, sovereign debt management offices, and regulated market participants. Front-office trading desks, middle-office risk controllers, back-office settlement operations, primary bond issuers, and dual-custody approval validators shall have an enshrined operational architecture where every position, legal mandate, credit limit, cash/security reservation, and atomic DvP settlement maintains exhaustive clarity, cryptographic provenance, and regulatory auditability.

---

## 📋 Comprehensive 15-Stage Institutional Transaction & Governance Lifecycle

The table below defines the authoritative operational lifecycle, delineating the business purpose, primary operators, requisite data models, system actions, state transitions, and the boundary between off-chain enterprise systems and on-chain Internet Computer (ICP) smart contracts:

| Step | Business Purpose | Main Operator(s) | Required Information | What the System Must Do | Main Output / Next State | Smart-Contract Fit |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Policy mandate** | Define what the institution is legally authorised to do | Governing board, policy committee, treasury authority | Legal basis, approved products, currencies, maximum authority, risk appetite, eligible jurisdictions, policy dates, governing documents | Create versioned mandate, enforce effective dates, map mandates to roles and portfolios, prevent unauthorised activity | Active mandate and policy rules | **No**. Keep this in an off-chain governance/policy service; store document hashes/signatures on-chain only if useful |
| **2. Approved programme** | Establish a bond/FX/repo programme under the mandate | Debt management, treasury, legal, risk | Issuer, programme cap, bond types, tenors, currencies, coupon method, issuance calendar, eligible buyers, settlement convention, legal documents | Create programme, track remaining issuance capacity, attach terms/prospectus, route for approval | Approved programme with available capacity | **Optional**: on-chain registry of programme ID, approved cap, instrument IDs, and policy version |
| **3. Instrument registry** | Create the authoritative record for every bond/security | Product control, issuer operations, legal | ISIN, issuer, currency, nominal amount, coupon, maturity, day count, payment schedule, denomination, CSD/custodian, token ID, legal docs | Validate terms, calculate cash flows, maintain version history, prevent duplicate instruments | Authoritative instrument master | **Yes**. Tokenised-bond contract can enforce supply cap and authorised minting; off-chain system remains master for legal docs and reference data |
| **4. Eligible counterparty** | Allow only approved central banks/institutions to participate | Compliance, credit, operations | Legal entity, LEI, jurisdiction, authorised signers, certificates, settlement accounts, product permissions, credit limits, agreements, sanctions/KYC status | Approve, suspend, expire, or restrict counterparties; validate signatory authority and settlement account ownership | Eligible counterparty profile | **Yes, partially**. Permissioned allowlist/identity credential can be checked in contract; compliance decisions must remain off-chain and auditable |
| **5. Order / RFQ / auction** | Receive a bilateral order or sealed yield bid | Counterparty dealer, issuer operations, market operations | Instrument, nominal amount, yield/price, bid type, value date, cash account, securities account, quote validity, counterparty signature | Timestamp, validate format, lock bids at deadline, support amend/cancel before cut-off, preserve bid confidentiality | Trade proposal, quote acceptance, or locked bid book | **Optional**: commit-reveal bids or signed bid commitments; generally keep the live bid book off-chain for confidentiality |
| **6. Independent risk controls** | Make sure the proposed transaction is within policy and operational limits | Independent risk/middle office, compliance | Issuance cap, buyer allocation cap, cash availability, security availability, FX exposure, counterparty exposure, concentration, price/yield tolerance, SSI, sanctions result | Run deterministic rule checks; block failed trades; record the policy version and evidence used | Passed / failed control report | **No for calculation; yes for enforcement**. Calculate risk off-chain; contract may enforce approved limits and a signed “controls passed” attestation |
| **7. Authorisation** | Apply four-eyes or multi-person governance | Treasury director, authorised signatories, settlement manager | Trade record, control result, amount, materiality threshold, rationale, legal docs, approver permissions | Route approvals; enforce separation of duties; expire stale approvals; record signatures and immutable event history | Approved instruction or rejected/held transaction | **Yes, partially**. Multi-signature execution or threshold approvals can be used; enterprise approval workflow stays off-chain |
| **8. Execution** | Create a binding trade or allocation | Dealer, auction engine, market operations | Executable quote, auction allocation rule, price/yield, quantity, counterparty, trade date, settlement date | Confirm trade, create trade ID, generate confirmations, calculate clean/dirty price, accrued interest, fees | Confirmed trade / allocation | **Optional**: smart contract registers final allocation or records a trade commitment; do not put sensitive RFQs/order flow on a public chain |
| **9. Confirmation and matching** | Ensure both sides agree on every settlement instruction | Both counterparties, custodians, back office | Trade economics, ISIN, nominal, cash amount, accounts, value date, DvP model, SSI, custodian/CSD route | Compare both instructions field by field; mark matched, mismatch, pending, or repaired | Matched settlement instruction | **No**. This is an operational matching and messaging process; attach signed confirmation hashes if needed |
| **10. Cash and securities reservation** | Prove that both legs can settle before release | Settlement operations, custody, treasury | Available currency balance, cash account, bond inventory, securities account, collateral/encumbrance, locks, expiry time | Lock/reserve cash and securities; stop duplicate use; record reservation IDs and expiry | Ready for DvP | **Yes—strong fit**. Escrow/lock both tokenised cash and tokenised bonds before atomic settlement |
| **11. DvP settlement** | Transfer cash and bonds simultaneously | Settlement engine, approved release officer | Approved/matched instruction, cash lock, security lock, transaction parameters, cut-off and finality policy | Release only if all gates pass; execute cash and securities legs together; record finality | Settled / failed / expired | **Yes—primary smart-contract use case**. Atomic DvP: either both legs settle or neither does. This is the core blockchain value |
| **12. Custody / ledger update** | Update ownership, positions, encumbrances, and available balances | Custody, CSD/ledger operations | Settlement event, account IDs, instrument ID, quantity, custodian/ledger reference, legal-owner data | Update positions; reduce seller availability; increase buyer position; release reservations; record location and beneficial ownership | Updated custody and position records | **Yes**. Token ledger updates are on-chain; custody, legal-title, vault, and CSD records may remain off-chain and must reconcile |
| **13. Reconciliation** | Verify that all independent records agree | Back office, reconciliation team | Auction allocations, trade blotter, payment ledger, security ledger, custodian files, contract events, CSD records, GL postings | Detect cash/security/amount/timing/account mismatches; create cases; escalate and resolve breaks | Reconciled or exception case | **No**. Reconciliation is off-chain; blockchain events are one source of evidence |
| **14. Accounting** | Record the financial effects in the ledger | Finance control, accountants | Face value, issue price, accrued interest, premium/discount, FX rate, fees, accounting policy, valuation source | Generate journal entries; accrue coupons; amortise premium/discount; post to GL; control manual adjustments | Posted journal entries and statements | **No**. Use conventional controlled accounting/GL; optionally anchor daily accounting-proof hashes on-chain |
| **15. Reporting and audit** | Produce reliable internal, regulatory, board, and counterparty evidence | Reporting, audit, management | Full lifecycle records, pricing, risk results, approvals, settlement evidence, positions, exceptions, legal documents | Produce reports and case packages; preserve data lineage; export signed audit evidence | Management/regulatory reports and audit package | **Optional**: notarise report/evidence hashes on-chain; reports and sensitive data remain off-chain |

---

## 🏛️ Persona-to-Stage Workflow Matrix

To guarantee institutional segregation of duties (SoD), each operational role accesses dedicated views and cryptographic permissions:

1. **Policy Committee & Treasury Authority**:
   - Authorized for **Steps 1 & 2** (Mandates & Programmes).
   - Invariant: Sets global caps, approved currency corridors (sEURD, sUSDD, sCHF, XAU), and eligible counterparty jurisdictions.
2. **Product Control & Sovereign DMO**:
   - Authorized for **Steps 2 & 3** (Approved Programmes & ACTUS Instrument Registry).
   - Invariant: Deploys sovereign smart contract templates, verifies ISIN / DTI attributes, and provisions primary Dutch auctions.
3. **Compliance & Onboarding Officers**:
   - Authorized for **Step 4** (Eligible Counterparties).
   - Invariant: Verifies LEI, validates blinded KYC hashes (`[u8; 32]`), and updates on-chain permissioned access control lists.
4. **Front-Office Dealers & Market Operators**:
   - Authorized for **Steps 5 & 8** (Order / RFQ / Auction & Trade Execution).
   - Invariant: Submits sealed yield bids, executes bilateral RFQ orders, and calculates clean/dirty prices.
5. **Middle-Office Risk Controllers**:
   - Authorized for **Step 6** (Independent Risk Controls).
   - Invariant: Validates limits against real-time positions; issues signed risk clearance tokens prior to four-eyes routing.
6. **Executive Approvers (Four-Eyes / Quorum)**:
   - Authorized for **Step 7** (Authorisation).
   - Invariant: Biometric YubiKey / WebAuthn threshold sign-off via desktop workstation or dedicated mobile surface.
7. **Back-Office Settlement Officers**:
   - Authorized for **Steps 9, 10, 11 & 12** (Matching, Reservation, Atomic DvP, & Ledger Updates).
   - Invariant: Enforces sub-second atomic DvP finality where escrowed cash and tokenized bond legs settle simultaneously or roll back cleanly.
8. **Finance Controllers & Auditors**:
   - Authorized for **Steps 13, 14 & 15** (Reconciliation, GL Accounting, & Regulatory Reporting).
   - Invariant: Generates ISO 20022 `camt.053` statements, accrues daily interest, and anchors cryptographic state proofs for FINMA / supervisory review.
