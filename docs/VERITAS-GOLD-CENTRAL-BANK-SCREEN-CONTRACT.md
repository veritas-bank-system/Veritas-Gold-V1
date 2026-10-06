# Veritas Gold — Central Bank Line Layout and Screen Contract

## 1. Purpose

This document defines the exact line-by-line layout, fields, controls, states, and actions for the Central Bank workspace. It is intended for product design, frontend implementation, backend API contracts, QA, and Freebuff coding-agent instructions.

The interface must always identify:

- Institution.
- Legal entity.
- Active persona.
- User role.
- Environment.
- Security classification.
- Data source.
- Currency.
- Last refresh time.
- Permission scope.

No production action may be executed from a sandbox screen. Every high-value or sensitive action must use maker-checker or four-eyes approval.

## 2. Global shell

### 2.1 Global line layout

```text
LINE 01  [Security badge] [Institution] [Persona] [Level] [Environment]
LINE 02  [Node / region] [Veritas Gold] [Network / legal entity] [Global search]
LINE 03  [Workspace title] [Approvals] [Alerts] [Data Change & Transfer] [Profile]
LINE 04  [Breadcrumb] [Last refresh] [Data source] [Currency] [Permissions]
LINE 05  [Sandbox or production warning banner]
LINE 06  [Page title] [Description] [Primary actions]
LINE 07  [Filter bar] [Search] [Date] [Currency] [Status] [Export]
LINE 08+ [Cards, charts, tables, workflows, and detail panels]
```

### 2.2 Persistent header fields

```text
institution_id
institution_name
legal_entity_id
legal_entity_name
persona_id
role_id
environment
security_level
node_id
region
base_currency
last_sync_at
data_source
mfa_status
approval_count
critical_alert_count
```

### 2.3 Status colors

- Emerald: healthy, approved, settled, active.
- Amber: warning, pending, sandbox, review required.
- Coral: blocked, failed, critical, breach, emergency.
- Gold: physical gold, bullion, reserve asset.
- Blue-violet: market, quote, trade, and liquidity activity.
- Slate: neutral metadata, inactive, archived.

## 3. Executive Dashboard

### 3.1 Page header

```text
TITLE       Central Bank Executive Dashboard
SUBTITLE    Reserve, monetary, liquidity, settlement, risk, and policy overview
CONTEXT     Swiss National Bank / Reserve Desk
TIME        Last synchronized: 06 Oct 2026, 10:52 CET
ACTIONS     Review Approvals | Emergency Controls | Export Reserve Report
```

### 3.2 Warning banner

```text
SANDBOX LEDGER — SIMULATED RECORDS ONLY
No live central-bank money, RTGS, SWIFT, or production account mandates are connected.
Source: Local Sandbox API | Last response: 10:52 CET
```

### 3.3 KPI card grid

Each card must show title, primary value, unit, change, policy target, status, timestamp, and source.

```text
CARD 01  TOTAL OFFICIAL RESERVES
VALUE     [amount]
UNIT      [base currency]
CHANGE    [period change]
TARGET    [policy target]
STATUS    [Within mandate / Warning / Breach]
SOURCE    [valuation source]
UPDATED   [timestamp]

CARD 02  ALLOCATED GOLD
VALUE     [fine weight] | [market value]
DETAIL    [bar count] | [vault count]
CHANGE    [weight/value change]
STATUS    [Within mandate / Warning / Breach]

CARD 03  SOVEREIGN BONDS
VALUE     [amount]
DETAIL    [number of instruments] | [average duration]
MATURITY  [next material maturity]
STATUS    [Within mandate / Warning / Breach]

CARD 04  FX LIQUIDITY
VALUE     [amount]
DETAIL    [currency count] | [available versus reserved]
STATUS    [Healthy / Warning / Critical]

CARD 05  INTRADAY LIQUIDITY
VALUE     [available amount]
DETAIL    [settled] [reserved] [blocked] [credit facility]
CAPACITY  [transfer capacity]
STATUS    [Healthy / Warning / Critical]

CARD 06  RISK LIMIT USAGE
VALUE     [percentage]
DETAIL    [highest utilized limit]
BREACHES  [count]
STATUS    [Within limits / Review / Breach]

CARD 07  SETTLEMENT HEALTH
VALUE     [percentage settled successfully]
DETAIL    [pending] [failed] [late]
STATUS    [Healthy / Attention / Critical]

CARD 08  COMPLIANCE ALERTS
VALUE     [open alert count]
DETAIL    [critical] [high] [medium]
STATUS    [Clear / Review required / Critical]
```

### 3.4 Reserve allocation panel

```text
TITLE       Reserve Allocation
FILTERS     As of date | Currency | Policy portfolio | Asset class
CHART       Gold | Sovereign bonds | FX | Deposits | Other approved assets
SIDE PANEL  Target allocation | Actual allocation | Variance | Policy limit
ACTIONS     Open asset class | Create rebalance proposal | Export
```

Clicking an asset class opens:

- Holdings.
- Valuation.
- Currency.
- Country.
- Counterparty.
- Liquidity class.
- Policy limit.
- Current exposure.
- Historical trend.

### 3.5 Liquidity forecast panel

```text
TITLE       Liquidity Forecast
FILTERS     Currency | Horizon | Scenario | Account group
CHART       Opening balance | Expected inflows | Expected outflows | Closing balance
LINES       Minimum buffer | Warning threshold | Emergency threshold
TABLE       Date | Currency | Opening | Inflow | Outflow | Closing | Variance
ACTIONS     Open cash forecast | Reserve liquidity | Create transfer | Export
```

### 3.6 Gold chart panel

```text
TITLE       Gold Value & Fine Weight
FILTERS     Vault | Custodian | Currency | Date range | Allocated status
CHART       Market value line | Fine-weight line | Price line
SUMMARY     Bars | Fine weight | Gross weight | Purity range | Vault count
TABLE       Vault | Custodian | Bars | Fine weight | Value | Encumbered | Last audit
ACTIONS     Open gold registry | Request delivery | Open custody report
```

### 3.7 Bond maturity ladder

```text
TITLE       Sovereign Bond Maturity Ladder
FILTERS     Currency | Issuer | Rating | Portfolio | Time horizon
BARS        0–3 months | 3–12 months | 1–3 years | 3–5 years | 5+ years
TABLE       ISIN | Issuer | Currency | Principal | Coupon | Maturity | Yield | Duration
ACTIONS     Open bond portfolio | Create rebalance | Export maturity report
```

### 3.8 Pending approvals table

```text
TITLE       Pending Approvals
COLUMNS     Approval ID | Type | Asset | Amount | Requester | Risk | Required | Current | Deadline | Action
ROWS        Gold purchase | Bond trade | Transfer | Counterparty | Policy change
ACTIONS     Review | Approve | Reject | Request evidence | Escalate
```

### 3.9 Settlement exceptions table

```text
TITLE       Settlement Exceptions
COLUMNS     Trade ID | Cash leg | Asset leg | Counterparty | Settlement date | Severity | Owner | Action
STATUSES    Awaiting cash | Awaiting asset | Failed | Late | Investigation | Resolved
ACTIONS     Open case | Retry | Repair | Escalate | Freeze related asset
```

## 4. Tasks & Approvals

### 4.1 Page header

```text
TITLE       Tasks & Approvals
SUBTITLE    Controlled actions requiring review or authorization
ACTIONS     Create task | Bulk review | Export queue
```

### 4.2 Filter bar

```text
Search task ID, trade ID, account, counterparty, or requester
Filters: Type | Status | Risk | Institution | Amount range | Due date | Assignee
```

### 4.3 Table columns

```text
Task ID
Task type
Requested action
Institution
Requester
Asset
Amount
Currency
Risk level
Required approvals
Completed approvals
Due date
Status
Actions
```

### 4.4 Detail drawer

Show:

- Requested action.
- Full transaction details.
- Mandate and policy used.
- Price evidence.
- Counterparty evidence.
- KYC/AML result.
- Settlement plan.
- Custody plan.
- Risk assessment.
- Approval history.
- Supporting documents.
- Comments.
- Decision controls.

## 5. Reserve Overview

### 5.1 Header

```text
TITLE       Reserve Overview
SUBTITLE    Official reserve assets, policy allocation, valuation, and liquidity
ACTIONS     Create rebalance proposal | Export reserve report | Open policy
```

### 5.2 Summary lines

```text
Total reserves
Monetary gold
Foreign-currency assets
Sovereign bonds
Deposits
Other approved assets
Liquid within 30 days
Policy variance
```

### 5.3 Holdings table

```text
Asset class | Instrument | Currency | Country | Custodian | Market value | Liquidity class | Policy status
```

### 5.4 Detail view

- Legal owner.
- Portfolio.
- Asset identifier.
- Quantity.
- Price.
- Valuation source.
- Market value.
- Accrued income.
- Currency.
- Country.
- Counterparty.
- Custodian.
- Encumbrance.
- Policy eligibility.
- Last valuation.
- Audit history.

## 6. Gold & Bullion

### 6.1 Header

```text
TITLE       Gold & Bullion
SUBTITLE    Allocated holdings, institutional trading, custody, financing, and delivery
ACTIONS     Buy Gold | Sell Gold | Request Quote | Register Transfer | Export Registry
```

### 6.2 Gold summary cards

```text
Allocated fine weight
Total market value
Bar count
Vault count
Pledged weight
Reserved weight
Available weight
Bars requiring audit
```

### 6.3 Bar registry table

```text
Bar ID | Serial number | Refinery | Origin | Gross weight | Fine weight | Purity | Vault | Custodian | Owner | Status | Last audit
```

### 6.4 Gold trade panel

```text
Trade type: Spot | Forward | Swap | Lease | Loan
Side: Buy | Sell
Quantity: [fine weight]
Price: [price/currency]
Settlement currency: [currency]
Counterparty: [approved entity]
Vault: [approved vault]
Delivery date: [date]
Price source: [source and timestamp]
Compliance result: [status]
Required approval: [rule]
```

### 6.5 Gold-detail panel

- Assay certificate.
- Ownership evidence.
- Chain of custody.
- Insurance certificate.
- Lien status.
- Pledge status.
- Physical inspection.
- Vault transfer history.
- Delivery instructions.
- Audit events.

## 7. Government Bonds

### 7.1 Header

```text
TITLE       Government Bonds
SUBTITLE    Sovereign, agency, supranational, and reserve-quality fixed income
ACTIONS     Buy | Sell | Request Quote | Submit Auction Bid | Repo | Export Holdings
```

### 7.2 Bond table

```text
ISIN | Issuer | Asset type | Currency | Coupon | Maturity | Clean price | Dirty price | Yield | Duration | Rating | Collateral status
```

### 7.3 Bond detail

- Issuer.
- Legal entity.
- ISIN.
- Currency.
- Coupon type.
- Coupon frequency.
- Next coupon date.
- Maturity.
- Principal.
- Clean price.
- Dirty price.
- Yield.
- Duration.
- Convexity.
- Rating.
- Country.
- Custodian.
- Pledged amount.
- Available amount.
- Settlement convention.

### 7.4 Auction screen

```text
Auction ID | Issuer | Instrument | Auction date | Settlement date | Amount offered | Bid deadline | Eligible participants | Status
```

Bid detail:

- Bid price or yield.
- Quantity.
- Participant.
- Competitive/non-competitive status.
- Allocation.
- Approval.
- Settlement instruction.

## 8. FX & Money Markets

### 8.1 Header

```text
TITLE       FX & Money Markets
SUBTITLE    Reserve currencies, liquidity operations, deposits, and hedging
ACTIONS     FX Quote | Currency Transfer | Place Deposit | Create Hedge | Export Exposure
```

### 8.2 Currency cards

```text
Currency
Settled balance
Reserved balance
Available balance
Incoming funds
Outgoing funds
Open forward exposure
Liquidity buffer
Policy status
```

### 8.3 FX trade ticket

```text
Product: Spot | Forward | Swap
Buy currency
Sell currency
Amount
Rate
Value date
Maturity date
Counterparty
Settlement account
Hedge designation
Compliance result
Approval requirement
```

### 8.4 Money-market table

```text
Instrument | Counterparty | Currency | Principal | Rate | Start date | Maturity | Collateral | Status
```

## 9. Portfolio Management

### 9.1 Header

```text
TITLE       Portfolio Management
SUBTITLE    Strategic allocation, mandates, rebalancing, and performance
ACTIONS     New Portfolio | Rebalance Proposal | Assign Mandate | Export Performance
```

### 9.2 Portfolio table

```text
Portfolio | Mandate | Manager | Base currency | NAV | Target risk | Actual risk | Benchmark | Policy status | Last valuation
```

### 9.3 Rebalancing ticket

```text
Current allocation
Target allocation
Proposed trades
Expected cost
Expected risk change
Liquidity effect
Policy effect
Approver
Execution plan
```

## 10. Liquidity Management

### 10.1 Header

```text
TITLE       Liquidity Management
SUBTITLE    Intraday liquidity, forecasts, buffers, facilities, and payment priorities
ACTIONS     Reserve Liquidity | Create Transfer | Open Stress Test | Export Forecast
```

### 10.2 Liquidity table

```text
Currency | Opening balance | Incoming | Outgoing | Reserved | Blocked | Credit | Available | Minimum buffer | Variance | Status
```

### 10.3 Payment queue

```text
Priority | Payment ID | Amount | Currency | Value date | Beneficiary | Liquidity required | Status | Action
```

### 10.4 Liquidity action drawer

- Reserve funds.
- Release funds.
- Change payment priority.
- Create transfer.
- Request facility.
- Escalate shortage.
- Start emergency protocol.
- Record approval.

## 11. Settlement Accounts

### 11.1 Header

```text
TITLE       Settlement Accounts & Liquidity
SUBTITLE    Account balances, approved facilities, transfer limits, and settlement capacity
ACTIONS     Refresh Accounts | New Transfer | Reconcile | Export Statement
```

### 11.2 Account summary

```text
Settlement currency
Number of accounts
Settled funds
Approved credit facilities
Reserved funds
Blocked funds
Indicative ceiling
Available transfer capacity
Pending incoming funds
Last successful response
```

### 11.3 Account register table

```text
Account ID | Participant | Currency | Settled balance | Approved credit | Reserved | Available capacity | Daily usage | Status | Last update | Action
```

### 11.4 Transfer ticket

```text
Source account
Destination account
Beneficiary
Currency
Amount
Value date
Purpose
Reference
Payment rail
Compliance status
Available balance after transfer
Required approvals
```

## 12. Custody & Vaults

### 12.1 Header

```text
TITLE       Custody & Vaults
SUBTITLE    Legal ownership, physical custody, securities holdings, and proof of reserves
ACTIONS     Add Vault | Register Bar | Transfer Asset | Request Inspection | Export Custody Report
```

### 12.2 Vault table

```text
Vault | Operator | Jurisdiction | Bars | Fine weight | Capacity | Insurance | Last inspection | Eligibility | Status
```

### 12.3 Custody position table

```text
Owner | Asset | Identifier | Quantity | Vault/custodian | Available | Pledged | Blocked | Encumbrance | Last confirmation
```

### 12.4 Vault transfer ticket

```text
Source vault
Destination vault
Owner
Bar list
Weight
Transport provider
Insurance
Reason
Approval status
Physical movement status
Delivery evidence
Final ownership status
```

## 13. Settlement Monitor

### 13.1 Header

```text
TITLE       Settlement Monitor
SUBTITLE    End-to-end cash, asset, payment, custody, and DvP status
ACTIONS     Refresh | Open Exceptions | Export Settlement Report
```

### 13.2 Table

```text
Trade ID | Asset | Counterparty | Cash leg | Asset leg | Payment ID | Custodian | Settlement date | Status | Exception | Owner
```

### 13.3 Settlement detail

- Trade confirmation.
- Compliance clearance.
- Cash reservation.
- Asset reservation.
- Payment message.
- Custodian instruction.
- Asset transfer.
- DvP confirmation.
- Reconciliation.
- Finality record.
- Failure or repair evidence.

## 14. Payments & ISO 20022

### 14.1 Header

```text
TITLE       Payments & ISO 20022
SUBTITLE    Payment creation, validation, messaging, status, and investigations
ACTIONS     New Payment | Validate Message | Repair Queue | Export Message Log
```

### 14.2 Message table

```text
Payment ID | Message type | Trade reference | Sender | Receiver | Amount | Currency | Value date | Compliance | Message status | Settlement status
```

### 14.3 Message detail

- Original message.
- Validation result.
- Business status.
- Technical status.
- Sanctions result.
- Repair reason.
- Retry count.
- Payment route.
- Confirmation.
- Investigation history.

## 15. Reconciliation

### 15.1 Header

```text
TITLE       Reconciliation
SUBTITLE    Cash, gold, bond, custody, payment, and ledger matching
ACTIONS     Run Reconciliation | Assign Break | Approve Adjustment | Export Break Report
```

### 15.2 Break table

```text
Break ID | Reconciliation type | Internal value | External value | Difference | Age | Owner | Cause | Status | Action
```

### 15.3 Break detail

- Internal record.
- External record.
- Difference calculation.
- Source statement.
- Proposed adjustment.
- Approval requirement.
- Root cause.
- Corrective action.
- Resolution evidence.

## 16. Risk Dashboard

### 16.1 Header

```text
TITLE       Risk Dashboard
SUBTITLE    Market, credit, liquidity, settlement, custody, operational, and cyber risk
ACTIONS     Stress Test | Review Breaches | Export Risk Report
```

### 16.2 Risk cards

```text
Gold price risk
FX risk
Interest-rate risk
Credit risk
Counterparty risk
Liquidity risk
Settlement risk
Country risk
Custody risk
Operational risk
Cyber risk
```

### 16.3 Risk table

```text
Risk type | Exposure | Limit | Utilization | Stress loss | Breach | Owner | Last calculated | Action
```

## 17. Exposure & Limits

### 17.1 Header

```text
TITLE       Exposure & Limits
SUBTITLE    Mandate limits, counterparty limits, country limits, and policy breaches
ACTIONS     New Limit | Change Limit | Freeze Exposure | Export Limit Report
```

### 17.2 Table

```text
Limit ID | Limit type | Entity | Asset/currency | Approved amount | Current exposure | Utilization | Threshold | Status | Approver
```

### 17.3 Breach detail

- Breach reason.
- Time detected.
- Exposure causing breach.
- Policy reference.
- Required action.
- Temporary exception.
- Approver.
- Expiry.
- Resolution.

## 18. Counterparties

### 18.1 Header

```text
TITLE       Counterparties
SUBTITLE    Approved institutions, legal entities, licenses, limits, and settlement instructions
ACTIONS     Add Counterparty | Request Review | Suspend | Export Register
```

### 18.2 Table

```text
Counterparty | Legal entity | Jurisdiction | License | Rating | Approved products | Exposure | KYC | AML | Sanctions | Review date | Status
```

### 18.3 Detail

- Legal documents.
- Ownership structure.
- Beneficial owners.
- Licenses.
- Settlement instructions.
- Approved products.
- Limits.
- Collateral.
- Exposure.
- Screening results.
- Review history.
- Suspension history.

## 19. Stress Testing

### 19.1 Header

```text
TITLE       Stress Testing
SUBTITLE    Scenario analysis for reserve, liquidity, market, and settlement resilience
ACTIONS     New Scenario | Run Test | Compare Results | Export Report
```

### 19.2 Scenario table

```text
Scenario | Date | Portfolios | Gold shock | FX shock | Rate shock | Liquidity shock | Estimated loss | Breaches | Status
```

### 19.3 Scenario detail

- Assumptions.
- Instruments affected.
- Portfolio impact.
- Liquidity impact.
- Counterparty impact.
- Settlement impact.
- Policy breaches.
- Management action.
- Approval.
- Version.

## 20. Compliance Dashboard

### 20.1 Header

```text
TITLE       Compliance Dashboard
SUBTITLE    KYC, KYB, AML, sanctions, source-of-funds, and market-conduct control centre
ACTIONS     New Case | Review Alerts | Export Compliance Report
```

### 20.2 Compliance cards

```text
Open cases
Critical alerts
Sanctions hits
Expired documents
Pending KYC reviews
Source-of-funds exceptions
Market-abuse alerts
High-risk counterparties
```

### 20.3 Alert table

```text
Alert ID | Type | Entity | Transaction | Severity | Trigger | Assigned officer | Due date | Status | Action
```

### 20.4 Case detail

- Trigger.
- Related institution.
- Related transaction.
- Screening results.
- Documents.
- Analyst notes.
- Escalations.
- Decision.
- Evidence.
- Closure reason.

## 21. Statements & General Ledger

### 21.1 Header

```text
TITLE       Statements & General Ledger
SUBTITLE    Official statements, postings, valuation, income, and accounting controls
ACTIONS     New Journal | Reconcile | Close Period | Export Statement
```

### 21.2 GL table

```text
Posting ID | Account | Transaction | Debit | Credit | Currency | Value date | Reference | Source | Approval | Status
```

### 21.3 Statement filters

- Account.
- Asset class.
- Currency.
- Date range.
- Counterparty.
- Transaction type.
- Posting status.
- Reconciliation status.

## 22. Valuation & P&L

### 22.1 Header

```text
TITLE       Valuation & P&L
SUBTITLE    Market valuation, income, gains, losses, and independent price verification
ACTIONS     Run Valuation | Approve Adjustment | Compare Sources | Export P&L
```

### 22.2 Valuation table

```text
Asset | Identifier | Quantity | Price | Price source | Currency | Market value | Accrued income | FX value | P&L | Exception
```

## 23. Regulatory Reports

### 23.1 Header

```text
TITLE       Regulatory Reports
SUBTITLE    Official reserve, liquidity, transaction, risk, settlement, and compliance reporting
ACTIONS     Create Report | Schedule | Approve | Submit | Export
```

### 23.2 Report table

```text
Report ID | Report type | Period | Recipient | Owner | Approval | Submission deadline | Status | Version
```

### 23.3 Report detail

- Scope.
- Source datasets.
- Calculation version.
- Exceptions.
- Approvals.
- Submission record.
- Acknowledgement.
- Correction history.

## 24. Audit Center

### 24.1 Header

```text
TITLE       Audit Center
SUBTITLE    Immutable activity, approvals, data changes, custody evidence, and settlement proof
ACTIONS     Search Events | Create Audit Case | Export Evidence
```

### 24.2 Event table

```text
Event ID | Timestamp | User | Institution | Action | Object | Before | After | Source | Approval | Hash/status
```

### 24.3 Evidence detail

- Event metadata.
- Original object.
- Changed object.
- User identity.
- Device or API identity.
- Approval chain.
- Supporting documents.
- Related transaction.
- Related settlement.
- Related custody event.
- Integrity verification.

## 25. Governance screens

### 25.1 Institutions

Table:

```text
Institution | Legal entity | Jurisdiction | Participant type | Products | Accounts | KYC status | Risk status | Status
```

Detail:

- Legal registration.
- Ownership.
- Mandates.
- Products.
- Accounts.
- Custodians.
- Vaults.
- Users.
- Limits.
- Documents.

### 25.2 Users & Roles

Table:

```text
User | Institution | Role | Scope | Approval limit | MFA | Last login | Status | Action
```

Detail:

- Identity.
- Role.
- Permissions.
- Institution scope.
- Asset scope.
- Approval limit.
- Delegation.
- MFA device.
- Access history.

### 25.3 Mandates & Policies

Table:

```text
Policy ID | Policy type | Owner | Version | Effective date | Expiry | Approval | Status
```

Detail:

- Policy text.
- Asset limits.
- Currency limits.
- Country limits.
- Counterparty requirements.
- Approval thresholds.
- Exception rules.
- Change history.

### 25.4 Access Logs

Table:

```text
Event ID | User | Device/API | Event type | IP/region | Timestamp | Result | Risk flag
```

### 25.5 System Configuration

- Supported currencies.
- Asset classes.
- Price feeds.
- Valuation rules.
- Settlement calendars.
- Holidays.
- Approval thresholds.
- Risk limits.
- Notification rules.
- Environment flags.
- Feature flags.

## 26. Integrations and APIs

### 26.1 Integration dashboard

```text
Integration | Type | Environment | Last message | Success rate | Latency | Certificate expiry | Status | Action
```

### 26.2 Integration detail

- Connection type.
- Endpoint.
- Authentication.
- Certificate.
- Message schema.
- Message queue.
- Retry queue.
- Error queue.
- Last successful message.
- Last failed message.
- Monitoring.
- Audit events.

### 26.3 API portal

- API key management.
- OAuth clients.
- mTLS certificates.
- IP allowlists.
- Webhooks.
- Event subscriptions.
- Rate limits.
- Sandbox keys.
- Production keys.
- API documentation.
- Schema versions.
- Replay events.
- API audit logs.

## 27. Detail drawer standard

Every table row should open the same structured detail drawer:

```text
HEADER       Object type | Object ID | Status | Security classification
SUMMARY      Key amount | Currency | Institution | Last update
IDENTITY     Legal owner | Counterparty | User | Mandate
ASSET        Identifier | Quantity | Price | Value | Custody
RISK         Exposure | Limit | Utilization | Stress result
COMPLIANCE   KYC | AML | Sanctions | Source-of-funds
SETTLEMENT   Cash leg | Asset leg | Payment | Custodian | Finality
APPROVAL     Required | Completed | Pending | Rejected
DOCUMENTS    Evidence | Certificates | Statements
TIMELINE     Created | Changed | Approved | Settled | Reconciled
ACTIONS      Open | Approve | Reject | Freeze | Export | Escalate
```

## 28. Empty, loading, and error states

### Empty state

```text
No records found for the selected scope.
Check institution, date, currency, status, or environment filters.
```

### Loading state

```text
Loading verified data...
Source: [source]
Request ID: [ID]
```

### Error state

```text
Data unavailable.
Source: [source]
Error code: [code]
Last successful response: [timestamp]
Action: Retry | Open incident | Use last verified snapshot
```

### Stale data state

```text
Data is older than the permitted freshness window.
Do not use for live approval until refreshed.
```

## 29. Responsive layouts

### Workstation

- Full left navigation.
- Multi-column cards.
- Charts and tables visible together.
- Detail drawers from the right.
- Full approval and audit controls.

### Tablet

- Collapsible navigation.
- Two-column cards.
- Charts above tables.
- Sticky action bar.
- Detail drawer becomes full-screen panel.

### Mobile

- Critical alerts first.
- Approval queue first.
- One card per row.
- Tables become stacked records.
- No high-value action without explicit confirmation.
- Read-only by default except configured approvals.

## 30. Frontend component requirements

Create reusable components:

- `InstitutionContextBar`.
- `EnvironmentBadge`.
- `SecurityLevelBadge`.
- `ApprovalCounter`.
- `CriticalAlertCounter`.
- `MetricCard`.
- `StatusBadge`.
- `ReserveAllocationChart`.
- `LiquidityForecastChart`.
- `MaturityLadder`.
- `ApprovalTable`.
- `ExceptionTable`.
- `DetailDrawer`.
- `AuditTimeline`.
- `EvidencePanel`.
- `FilterBar`.
- `ExportMenu`.
- `ApprovalDialog`.
- `EmergencyControlDialog`.

## 31. Backend object identifiers

Minimum identifiers:

```text
institution_id
legal_entity_id
user_id
persona_id
role_id
portfolio_id
account_id
bar_id
vault_id
custody_position_id
bond_position_id
counterparty_id
trade_id
quote_id
order_id
settlement_id
payment_id
approval_id
risk_case_id
compliance_case_id
audit_event_id
report_id
```

## 32. High-value action confirmation

Before approval, show:

```text
Action
Institution
Legal entity
Requester
Counterparty
Asset
Quantity
Price
Currency
Total value
Settlement date
Custody account
Payment account
Risk result
Compliance result
Required approvals
Irreversibility warning
```

The user must explicitly confirm the exact action. A changed amount, counterparty, asset, account, or settlement date requires a new approval.

## 33. Acceptance criteria

The Central Bank dashboard is complete when:

- The active institution, persona, environment, and security level are visible.
- Sandbox data cannot be confused with production data.
- Every main menu point has a page title, description, filters, cards, table, detail view, and actions.
- Asset records show legal ownership, custody, valuation, risk, compliance, and settlement status.
- High-value actions require configurable approvals.
- Every action produces an audit event.
- Failed or stale integrations are visible.
- Exported reports identify period, source, version, and approver.
- Risk, compliance, settlement, custody, and accounting states are linked to the same transaction identity.
- Frontend components are reusable across central-bank and institutional workspaces.
