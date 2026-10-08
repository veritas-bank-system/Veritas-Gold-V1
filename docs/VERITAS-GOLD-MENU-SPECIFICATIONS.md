# Veritas Gold — Detailed Menu Specifications

## Document Purpose

This document defines the purpose, users, information model, workflows, permissions, approvals, audit requirements, and central-bank supervisory value of every Veritas Gold menu point. It is intended for product design, engineering, compliance, security, QA, and operational training.

The interface should retain the supplied Central Bank Workspace visual language: dark institutional panels, compact high-density tables, burgundy active navigation, visible operator persona, institution and node context, environment indicators, approval badges, and regulator-focused auditability.

## Common Page Contract

Every menu page should show the following context above its main content:

- Active workspace and institution.
- Active persona and effective role.
- Environment: production, sandbox, training, or disaster recovery.
- Ledger and data-source status.
- Current permission scope.
- Last data refresh and data freshness warning.
- Pending approvals relevant to the page.
- Active incidents or emergency restrictions.
- Export evidence action.
- Audit reference for sensitive records.

Every write action should record the actor, role, institution, timestamp, environment, device, session, reason, request version, approval reference, and result.

Every sensitive change should support least privilege, multi-factor authentication, segregation-of-duties checks, four-eyes approval, automatic expiry where relevant, and immutable audit history.

# Operations

## Settlement Monitor

### Purpose

Settlement Monitor is the operational control tower for tracking whether approved trades and transfers have completed correctly. It connects the trade instruction, cash movement, asset movement, counterparty, settlement account, custody location, and final confirmation.

### Main users

- Settlement officers.
- Treasury operations.
- Custody operations.
- Supervisory operators.
- Risk and compliance reviewers.
- Auditors in read-only mode.

### Main page sections

1. Settlement health summary.
2. Live settlement queue.
3. Failed and delayed settlements.
4. Settlement exceptions.
5. Settlement-rail status.
6. Counterparty settlement readiness.
7. Recent confirmations.
8. Audit and evidence panel.

### Key data

- Settlement ID.
- Trade or transfer reference.
- Buy or sell direction.
- Instrument and quantity.
- Cash amount and currency.
- Trade date and value date.
- Delivery-versus-payment state.
- Counterparty and custodian.
- Settlement account.
- Settlement rail.
- Current status.
- Failure reason.
- Exception owner.
- SLA and escalation level.
- Finality timestamp.

### Status model

- Instruction received.
- Validation pending.
- Approved.
- Awaiting cash.
- Awaiting asset.
- Matched.
- Settling.
- Completed.
- Failed.
- Held.
- Cancelled.
- Reversed.

### Primary workflows

- Investigate a failed settlement.
- Repair an eligible instruction.
- Place a settlement on hold.
- Request a settlement override.
- Escalate a late settlement.
- Confirm delivery-versus-payment.
- Release a completed settlement.
- Export a complete settlement evidence pack.

### Access and approval rules

Settlement creation, repair, release, and confirmation should be separated. High-value settlement overrides require a second authorized approver. A settlement officer must not approve their own repair or override.

### Central-bank value

The module gives supervisors immediate visibility into market infrastructure health, systemic settlement delays, failed obligations, and potential liquidity or counterparty stress.

## Payments & ISO 20022

### Purpose

This menu manages structured institutional payment messages and their full lifecycle from creation through validation, screening, release, transmission, response, and reconciliation.

### Main page sections

1. Payment-processing health.
2. Incoming and outgoing queues.
3. ISO 20022 message explorer.
4. Validation and repair queue.
5. Screening and sanctions status.
6. Payment approvals.
7. Rejected and returned messages.
8. Message audit trail.

### Supported message areas

- Customer credit transfers.
- Financial-institution transfers.
- Account reports.
- Statement messages.
- Payment status messages.
- Investigation and exception messages.

### Key data

- Message ID.
- Transaction ID.
- Message type.
- Sender and receiver.
- Debtor and creditor.
- Amount and currency.
- Value date.
- Settlement account.
- Correspondent or clearing route.
- Screening result.
- Validation result.
- Repair history.
- Delivery status.
- Response code.

### Primary workflows

- Create or import a payment.
- Validate message structure.
- Review field-level errors.
- Repair permitted fields.
- Route for approval.
- Release payment.
- Investigate rejection.
- Resubmit a corrected message.
- Reconcile message status to ledger status.

### Access and approval rules

Message creation, repair, and release must be permission-separated. Changes to beneficiary, amount, currency, account, or value date after approval should invalidate the approval and restart the workflow.

### Central-bank value

The module supports payment-system oversight, message integrity, suspicious-payment investigation, and reliable evidence for settlement and regulatory review.

## Reconciliation

### Purpose

Reconciliation identifies differences between internal records and external statements, custodians, payment networks, settlement systems, and distributed ledgers.

### Main page sections

- Reconciliation health.
- Match-rate trend.
- Unmatched items.
- High-value breaks.
- Ageing analysis.
- Cash reconciliation.
- Asset reconciliation.
- Ledger-to-statement comparison.
- Adjustments awaiting approval.

### Key data

- Reconciliation run ID.
- Source system.
- Internal reference.
- External reference.
- Instrument.
- Quantity.
- Amount.
- Currency.
- Expected value.
- Actual value.
- Difference.
- Break category.
- Age.
- Owner.
- Due date.
- Resolution state.

### Break categories

- Timing difference.
- Missing instruction.
- Duplicate record.
- Wrong amount.
- Wrong account.
- Wrong asset quantity.
- Price difference.
- Fee difference.
- Currency difference.
- Unauthorised adjustment.
- Unknown transaction.

### Primary workflows

- Auto-match records.
- Manually match records.
- Assign a break.
- Request supporting evidence.
- Propose an adjustment.
- Approve an adjustment.
- Escalate aged breaks.
- Close a reconciliation period.

### Access and approval rules

Users who identify a break may not approve the accounting adjustment that resolves it. Adjustments must preserve the original records and reference the reason, evidence, and approver.

### Central-bank value

Reconciliation proves that institutional balances, reserve positions, transactions, and settlement records agree across systems.

## Delivery & Transfers

### Purpose

Delivery & Transfers manages the movement of assets, cash, ownership records, custody instructions, and physical bullion between approved parties and locations.

### Main page sections

- Transfer overview.
- Pending instructions.
- Physical delivery queue.
- Electronic asset transfers.
- Chain-of-custody timeline.
- Exception and hold queue.
- Delivery confirmations.
- Transfer audit evidence.

### Key data

- Transfer ID.
- Asset type.
- Quantity and unit.
- Origin institution.
- Destination institution.
- Origin and destination account.
- Custodian and vault.
- Bar identifiers.
- Delivery date.
- Insurance status.
- Instruction owner.
- Approval state.
- Confirmation document.

### Primary workflows

- Create a transfer request.
- Validate ownership and availability.
- Screen destination institution.
- Approve transfer.
- Confirm physical handover.
- Confirm electronic receipt.
- Place transfer on hold.
- Investigate a discrepancy.
- Complete chain-of-custody evidence.

### Access and approval rules

Transfer initiation, custody confirmation, and final ownership update should be performed by separate authorized users. Physical gold transfers require dual confirmation and bar-level evidence.

### Central-bank value

The module demonstrates control over reserve assets, ownership changes, physical custody, and cross-institution asset movement.

# Markets & Assets

## Gold Bullion

### Purpose

Gold Bullion is the asset-level operating screen for physical, allocated, and unallocated gold products.

### Main page sections

- Gold position overview.
- Buy and sell order area.
- Bar inventory.
- Allocation register.
- Vault distribution.
- Price and valuation panel.
- Encumbrance and lien status.
- Delivery queue.
- Reserve reconciliation.

### Key data

- Bar number.
- Refinery.
- Serial number.
- Weight.
- Fineness and purity.
- Gross and fine weight.
- Assay reference.
- Vault and compartment.
- Custodian.
- Legal owner.
- Allocation state.
- Encumbrance state.
- Insurance.
- Valuation price and timestamp.
- Buy/sell eligibility.

### Primary workflows

- Create a gold purchase request.
- Create a gold sale request.
- Allocate bars to an institution.
- Deallocate bars.
- Transfer ownership.
- Request physical delivery.
- Verify assay.
- Reconcile bar inventory.
- Freeze a bar or holding.

### Access and approval rules

Orders must respect product, institution, counterparty, risk, and jurisdiction limits. A trader may initiate an order, but independent operations and compliance users must validate settlement and eligibility.

### Central-bank value

Gold Bullion provides proof of reserve existence, ownership, allocation, custody, valuation, and transferability.

## Government Bonds

### Purpose

Government Bonds manages sovereign and government-backed fixed-income instruments used for reserves, liquidity, collateral, and institutional investment.

### Main page sections

- Bond catalogue.
- Yield and price view.
- Holdings.
- Maturity ladder.
- Coupon calendar.
- Duration and sensitivity.
- Buy/sell workflow.
- Settlement status.
- Regulatory eligibility.

### Key data

- Issuer.
- ISIN.
- Country and currency.
- Maturity date.
- Coupon rate.
- Coupon frequency.
- Yield.
- Clean and dirty price.
- Duration.
- Credit rating.
- Position quantity.
- Market value.
- Custodian.
- Settlement convention.
- Eligibility status.

### Primary workflows

- Review instrument.
- Request a buy or sell.
- Validate mandate and limit.
- Approve trade.
- Monitor settlement.
- Review maturity or coupon.
- Calculate valuation.
- Generate regulatory report.

### Access and approval rules

Bond-trading permission should be separate from bond-configuration permission. Changes to pricing, settlement conventions, or eligibility require configuration approval and regression testing.

### Central-bank value

The module supports reserve management, liquidity operations, collateral oversight, and sovereign-market supervision.

## FX & Money Markets

### Purpose

FX & Money Markets manages currency trading, short-term funding, liquidity instruments, and money-market exposure.

### Main page sections

- Market overview.
- Currency-pair quotes.
- Trade blotter.
- Money-market instruments.
- Liquidity-provider panel.
- Exposure and limits.
- Settlement readiness.
- Counterparty status.

### Key data

- Currency pair.
- Bid and offer.
- Quote timestamp.
- Notional.
- Trade direction.
- Value date.
- Counterparty.
- Liquidity source.
- Limit utilization.
- Funding rate.
- Maturity.
- Settlement route.
- Approval status.

### Primary workflows

- Review market data.
- Initiate FX or money-market transaction.
- Validate limit and mandate.
- Approve transaction.
- Monitor liquidity.
- Manage funding maturity.
- Suspend a liquidity provider.
- Investigate settlement exposure.

### Access and approval rules

Market-data access, trade initiation, limit approval, and settlement confirmation should be separated. A liquidity-provider change requires counterparty and risk review.

### Central-bank value

The module supports liquidity supervision, foreign-exchange operations, funding stability, and emergency market intervention.

## Custody & Vaults

### Purpose

Custody & Vaults manages locations, custodians, physical holdings, allocated assets, vault controls, and evidence of possession.

### Main page sections

- Vault map or vault list.
- Inventory totals.
- Allocated and unallocated holdings.
- Bar-level inventory.
- Custodian dashboard.
- Insurance and access status.
- Physical audit schedule.
- Movement and delivery queue.

### Key data

- Vault ID.
- Location and jurisdiction.
- Custodian.
- Compartment.
- Bar number.
- Weight and purity.
- Owner.
- Allocation state.
- Insurance value.
- Access log.
- Last physical audit.
- Encumbrance.
- Transfer restrictions.

### Primary workflows

- Add a vault.
- Register inventory.
- Allocate or deallocate gold.
- Approve custody movement.
- Confirm physical audit.
- Freeze a compartment.
- Investigate missing or mismatched assets.
- Export custody evidence.

### Access and approval rules

Vault administration, asset movement, and audit verification must be separate responsibilities. Any discrepancy requires incident escalation and preservation of evidence.

### Central-bank value

This module supports reserve integrity and physical proof of assets backing institutional obligations.

## Portfolio Management

### Purpose

Portfolio Management consolidates holdings, mandates, objectives, risk, liquidity, valuation, and compliance for an institution or supervisory scope.

### Main page sections

- Portfolio overview.
- Mandate and policy status.
- Asset allocation.
- Performance and P&L.
- Risk and liquidity.
- Concentration.
- Compliance breaches.
- Cash and collateral.
- Rebalancing requests.

### Key data

- Portfolio ID.
- Institution.
- Mandate.
- Base currency.
- Asset allocation.
- Market value.
- Cost basis.
- Realized and unrealized P&L.
- Benchmark.
- Liquidity bucket.
- Risk score.
- Limit utilization.
- Compliance state.

### Primary workflows

- Review portfolio.
- Compare against mandate.
- Identify allocation breach.
- Request rebalance.
- Approve rebalance.
- Review performance.
- Export portfolio report.

### Access and approval rules

Portfolio managers may propose changes, but compliance and risk controls must validate mandate adherence before execution.

### Central-bank value

The module enables institution-wide oversight instead of isolated product monitoring.

## Reserve Overview

### Purpose

Reserve Overview presents the composition, valuation, availability, encumbrance, and coverage of institutional reserves.

### Main page sections

- Reserve composition.
- Gold reserves.
- Cash and deposits.
- Government bonds.
- Liquidity reserves.
- Encumbered versus available assets.
- Coverage ratio.
- Reserve movements.
- Reconciliation and audit status.

### Key data

- Reserve category.
- Asset quantity.
- Market value.
- Valuation time.
- Currency.
- Custodian.
- Availability.
- Encumbrance.
- Coverage ratio.
- Required reserve level.
- Variance.
- Audit status.

### Primary workflows

- Review reserve coverage.
- Investigate reserve variance.
- Reconcile reserve assets.
- Approve reserve report.
- Freeze disputed assets.
- Export reserve evidence.

### Access and approval rules

Reserve reports require independent review. Changes to reserve classification or availability must be versioned and approved.

### Central-bank value

This is the high-level reserve and backing view for governors, supervisors, auditors, and authorized financial operators.

# Risk & Policy

## Risk Dashboard

### Purpose

Risk Dashboard consolidates market, credit, liquidity, operational, compliance, settlement, and concentration risk.

### Main page sections

- Risk summary.
- Exposure by institution.
- Exposure by product.
- Limit utilization.
- Breaches and near-breaches.
- Liquidity risk.
- Counterparty risk.
- Stress-test results.
- Open mitigations.

### Key data

- Risk type.
- Exposure.
- Limit.
- Utilization.
- Threshold.
- Breach time.
- Owner.
- Severity.
- Mitigation.
- Escalation state.
- Approval reference.

### Primary workflows

- Review a risk event.
- Approve mitigation.
- Propose a limit change.
- Freeze a product or institution.
- Escalate to supervisory authority.
- Export risk evidence.

### Access and approval rules

Risk users may recommend restrictions but should not silently alter operational permissions without approved workflow.

### Central-bank value

The dashboard provides early warning of concentration, liquidity, market, and institutional risk.

## Exposure & Limits

### Purpose

Exposure & Limits defines the quantitative and policy boundaries within which trading, settlement, custody, and transfers may operate.

### Main page sections

- Limit hierarchy.
- Product limits.
- Institution limits.
- Counterparty limits.
- Currency limits.
- Settlement limits.
- Limit utilization.
- Temporary exceptions.
- Breach history.

### Key data

- Limit ID.
- Limit type.
- Owner.
- Scope.
- Currency.
- Threshold.
- Current usage.
- Available capacity.
- Start and expiry date.
- Approval state.
- Exception reason.

### Primary workflows

- Create limit proposal.
- Review utilization.
- Increase or reduce limit.
- Add temporary exception.
- Suspend limit.
- Approve limit change.
- Review historical versions.

### Access and approval rules

A limit proposer must not be the final approver. Expired temporary limits must stop applying automatically.

### Central-bank value

The module turns policy limits into enforceable operational controls.

## Counterparties

### Purpose

Counterparties stores legal, regulatory, operational, credit, sanctions, KYC, and settlement information for external institutions.

### Main page sections

- Counterparty registry.
- Onboarding queue.
- KYC and AML status.
- Sanctions screening.
- Credit and risk profile.
- Approved products.
- Settlement accounts.
- Document expiry.
- Relationship history.

### Key data

- Legal name.
- LEI.
- Jurisdiction.
- Regulator.
- Beneficial ownership.
- KYC status.
- AML status.
- Sanctions status.
- Credit rating.
- Approved limit.
- Settlement account.
- Documentation expiry.
- Compliance owner.

### Primary workflows

- Create onboarding case.
- Collect evidence.
- Screen entity and owners.
- Approve eligibility.
- Assign limits.
- Suspend trading.
- Renew documents.
- Review relationship history.

### Access and approval rules

Counterparty approval requires independent compliance review and cannot be granted by the relationship owner alone.

### Central-bank value

This module provides the institutional identity and risk foundation for every transaction.

## Stress Testing

### Purpose

Stress Testing models adverse scenarios and determines whether portfolios, reserves, liquidity, limits, and settlement systems remain resilient.

### Main page sections

- Scenario library.
- Scenario builder.
- Model assumptions.
- Affected institutions.
- Projected impact.
- Limit breaches.
- Liquidity impact.
- Recovery actions.
- Approval and publication status.

### Key data

- Scenario ID.
- Scenario type.
- Assumptions.
- Market shock.
- Liquidity shock.
- Counterparty default.
- Loss projection.
- Reserve impact.
- Recovery time.
- Mitigation owner.
- Review state.

### Primary workflows

- Create scenario.
- Run model.
- Compare scenarios.
- Review breaches.
- Assign mitigation.
- Approve publication.
- Export results.

### Access and approval rules

Model assumptions and final published results should have separate ownership and approval.

### Central-bank value

The module supports resilience planning and supervisory scenario analysis.

## Compliance Dashboard

### Purpose

Compliance Dashboard is the supervisory control center for product launch, trading permissions, institutional compliance, team access, privileged activity, approvals, exceptions, and evidence.

### Main page sections

1. Workspace and operator context.
2. Compliance posture KPIs.
3. Market-launch initiative.
4. Buy/sell product register.
5. Team Access & Authority Control.
6. Four-eyes approval strip.
7. Critical compliance alerts.
8. Privileged Access Activity.
9. Regulatory Oversight & Audit.
10. Evidence and emergency controls.

### Core KPIs

- Market Launch Readiness.
- Critical Compliance Controls.
- Approved Products.
- KYC/AML Coverage.
- Privileged Access Risk.
- Approval Integrity.
- Sanctions-screening coverage.
- Settlement readiness.

### Launch gates

- Product definition.
- Regulatory classification.
- Legal and policy review.
- KYC/AML validation.
- Sanctions validation.
- Risk-limit approval.
- Liquidity-provider approval.
- Counterparty approval.
- Custody and vault readiness.
- Settlement-account readiness.
- Accounting and valuation readiness.
- Operational resilience.
- Incident and recovery plan.
- Final dual approval.

### Buy/sell register

The table should distinguish buy permission, sell permission, order creation, order amendment, order approval, settlement, limit changes, and control overrides.

### Team access panel

Show active users, privileged users, overdue reviews, dormant accounts, temporary grants, SoD conflicts, external users, break-glass accounts, active privileged sessions, and pending requests.

### Approval rules

The requester cannot approve their own request. High-risk approval requires re-authentication. Any material change invalidates prior approval. Approval records must include actor, role, timestamp, device, session, version, and evidence hash.

### Emergency actions

Support controlled suspension of buy activity, sell activity, products, counterparties, jurisdictions, settlement rails, privileged sessions, and compromised users. Every emergency action requires scope, reason, duration, incident reference, notification list, review deadline, and audit record.

### Central-bank value

This is the supervisory summary layer connecting the rest of the platform.

# Accounting & Reporting

## Statements & GL

### Purpose

Statements & GL manages institutional accounts, journal entries, postings, accounting periods, balances, and statement production.

### Main page sections

- Account hierarchy.
- Balance summary.
- Journal queue.
- Pending postings.
- Period close.
- Reconciliation state.
- Adjustment approvals.
- Statement exports.

### Key data

- Account number.
- Account name.
- Entity.
- Currency.
- Opening balance.
- Closing balance.
- Debit and credit.
- Journal reference.
- Posting date.
- Accounting period.
- Approval status.
- Reconciliation status.

### Primary workflows

- Create journal proposal.
- Review posting.
- Approve entry.
- Reverse eligible entry.
- Close accounting period.
- Generate statement.
- Export accounting evidence.

### Access and approval rules

The journal creator, approver, and period closer should be separate roles for material entries.

### Central-bank value

This module connects operational activity to official books and financial reporting.

## Valuation & P&L

### Purpose

Valuation & P&L calculates market value, accounting value, realized P&L, unrealized P&L, and valuation confidence for products and portfolios.

### Main page sections

- Valuation summary.
- Price-source comparison.
- Instrument positions.
- Realized P&L.
- Unrealized P&L.
- Valuation adjustments.
- Exceptions.
- Approval history.

### Key data

- Instrument.
- Quantity.
- Price source.
- Price timestamp.
- Currency.
- Market value.
- Cost basis.
- Realized P&L.
- Unrealized P&L.
- Price confidence.
- Adjustment reason.
- Reviewer.

### Primary workflows

- Run valuation.
- Compare price sources.
- Investigate outlier.
- Propose adjustment.
- Approve adjustment.
- Lock valuation.
- Generate P&L report.

### Access and approval rules

Price-source configuration and valuation approval should be separate. Locked valuations require a controlled correction process.

### Central-bank value

The module supports accurate reserves, financial statements, capital analysis, and supervisory reporting.

## Regulatory Reports

### Purpose

Regulatory Reports produces, validates, approves, submits, and preserves official regulatory filings.

### Main page sections

- Reporting calendar.
- Draft reports.
- Validation errors.
- Review queue.
- Approval queue.
- Submission status.
- Corrections.
- Evidence archive.

### Key data

- Report ID.
- Report type.
- Authority.
- Period.
- Deadline.
- Data cut-off.
- Validation state.
- Reviewer.
- Approval state.
- Submission reference.
- Correction history.

### Primary workflows

- Generate report.
- Validate report.
- Resolve data error.
- Approve report.
- Submit report.
- Record authority response.
- Create correction.
- Export filing package.

### Access and approval rules

Report preparation, validation, approval, and submission should be separated for high-impact filings.

### Central-bank value

The module creates a defensible, versioned, traceable regulatory record.

## Audit Center

### Purpose

Audit Center provides deep investigation and evidence management for system, user, market, compliance, settlement, and governance events.

### Main page sections

- Global event search.
- Timeline view.
- Entity history.
- Approval history.
- Privileged activity.
- Evidence validation.
- Incidents.
- Export builder.

### Key data

- UTC and local timestamp.
- Actor.
- Effective role.
- Institution.
- Object.
- Action.
- Previous value.
- New value.
- Reason.
- Approval reference.
- Session ID.
- Device ID.
- Network zone.
- Result.
- Evidence hash.
- Retention class.

### Primary workflows

- Search an event.
- Reconstruct a timeline.
- Compare versions.
- Validate evidence.
- Link event to incident.
- Produce auditor export.
- Place evidence under legal hold.

### Access and approval rules

Audit administrators must not be able to erase the records they investigate. Exports should be controlled, watermarked, versioned, and logged.

### Central-bank value

The module allows the institution to prove what happened, who acted, under what authority, and with which evidence.

# Governance

## Institutions

### Purpose

Institutions manages legal entities, regulated organizations, central-bank departments, custodians, counterparties, and supervisory scopes.

### Main page sections

- Institution registry.
- Onboarding queue.
- Legal identity.
- Jurisdiction and regulator.
- Access scope.
- Product permissions.
- Risk profile.
- Settlement relationships.
- Documentation.

### Key data

- Legal name.
- Registration identifier.
- LEI.
- Institution type.
- Jurisdiction.
- Regulator.
- Risk tier.
- Parent entity.
- Approved products.
- Settlement accounts.
- Custody relationships.
- Access state.

### Primary workflows

- Create institution profile.
- Verify legal identity.
- Approve onboarding.
- Assign supervisory scope.
- Enable products.
- Suspend institution.
- Review institutional history.
- Export profile.

### Access and approval rules

Institution scope must be explicit. Users should not see or act on institutions outside their assigned authority.

### Central-bank value

The module is the legal and organizational foundation for all platform activity.

## Users & Roles

### Purpose

Users & Roles controls identity, team access, role assignment, permissions, approval authority, recertification, and access suspension.

### Main page sections

- Access posture.
- User registry.
- Role matrix.
- Access-request queue.
- Privileged users.
- Temporary access.
- SoD conflicts.
- Recertification queue.
- Active sessions.

### Key data

- User identity.
- Institution.
- Department.
- Employment state.
- Roles.
- Permissions.
- Jurisdiction.
- Device trust.
- MFA state.
- Last login.
- Last access review.
- Temporary grants.
- Privileged status.
- Conflicts.

### Primary workflows

- Create user.
- Assign role.
- Request access.
- Approve access.
- Revoke access.
- Suspend user.
- Grant temporary privilege.
- Review session.
- Resolve SoD conflict.
- Complete recertification.

### Required roles

Central Bank Governor, Supervisory Operator, Compliance Officer, Risk Officer, Treasury Trader, Settlement Officer, Custody Officer, Auditor, Security Administrator, System Administrator, and External Reviewer.

### Access and approval rules

No shared privileged credentials. The requester cannot approve their own access. Temporary access must expire automatically. High-risk role assignment requires a second approver and strong re-authentication.

### Central-bank value

This module provides direct control over who may view, initiate, approve, administer, or override institutional operations.

## Mandates & Policies

### Purpose

Mandates & Policies defines the rules that govern product activity, institution permissions, limits, settlement, compliance, emergency action, and access review.

### Main page sections

- Policy catalogue.
- Mandate register.
- Draft changes.
- Approval queue.
- Published policies.
- Exceptions.
- Expiry calendar.
- Version comparison.

### Key data

- Policy ID.
- Policy name.
- Version.
- Scope.
- Owner.
- Effective date.
- Expiry date.
- Affected institutions.
- Affected products.
- Required approvals.
- Exceptions.
- Change history.

### Primary workflows

- Create policy.
- Draft amendment.
- Review impact.
- Approve policy.
- Publish policy.
- Create exception.
- Review exception.
- Retire policy.
- Compare versions.

### Access and approval rules

Policy editors should not independently approve publication. Exceptions must have expiry, owner, justification, and compensating controls.

### Central-bank value

The module turns institutional policy into explicit, reviewable, version-controlled rules.

## Access Logs

### Purpose

Access Logs records authentication, authorization, account changes, privilege elevation, sensitive actions, and access failures.

### Main page sections

- Authentication events.
- Authorization decisions.
- Account lifecycle.
- Role changes.
- Privilege elevation.
- Failed access attempts.
- Session history.
- Export controls.

### Key data

- Timestamp.
- User.
- Effective role.
- Institution.
- Action.
- Object.
- Environment.
- Device.
- Network zone.
- Session ID.
- Result.
- Reason.
- Approval reference.
- Evidence hash.

### Primary workflows

- Search events.
- Filter by user, institution, object, or time.
- Investigate a session.
- Review privilege elevation.
- Detect suspicious access.
- Link event to incident.
- Export evidence.

### Access and approval rules

Log viewers may investigate but may not modify records. Log administrators must be separate from system administrators and privileged operators.

### Central-bank value

The module proves identity, access decision, authority, and system response for every sensitive interaction.

# Settlement & Configuration

## Settlement Accounts

### Purpose

Settlement Accounts manages cash and asset accounts used to complete approved transactions.

### Main page sections

- Account registry.
- Verification queue.
- Signatory list.
- Currency coverage.
- Settlement-rail mapping.
- Account restrictions.
- Balance and activity.
- Change history.

### Key data

- Account ID.
- Owner.
- Bank or custodian.
- Currency.
- Account type.
- Settlement purpose.
- Rail.
- Status.
- Verification state.
- Signatories.
- Balance.
- Restrictions.
- Last review.

### Primary workflows

- Add account.
- Verify ownership.
- Assign settlement purpose.
- Add or remove signatory.
- Change rail.
- Suspend account.
- Review transactions.
- Export verification evidence.

### Access and approval rules

Account changes require independent verification. Signatory changes, account suspension, and settlement-purpose changes require dual approval.

### Central-bank value

The module prevents misdirected payments, unauthorized account use, and settlement fraud.

## System Configuration — Bonds

### Purpose

System Configuration — Bonds controls the reference-data and rules engine used for bond pricing, valuation, settlement, classification, and reporting.

### Main page sections

- Bond instrument master.
- Issuer master.
- Coupon schedules.
- Calendars.
- Day-count rules.
- Settlement conventions.
- Pricing sources.
- Eligibility rules.
- Configuration releases.
- Change approvals.

### Key data

- Instrument ID.
- ISIN.
- Issuer.
- Currency.
- Coupon.
- Coupon frequency.
- Maturity.
- Calendar.
- Day-count convention.
- Settlement convention.
- Pricing source.
- Eligibility.
- Version.
- Effective date.

### Primary workflows

- Add instrument.
- Correct reference data.
- Change pricing source.
- Change settlement convention.
- Test configuration.
- Approve release.
- Roll back configuration.
- Export change evidence.

### Access and approval rules

Configuration changes must be versioned, tested, peer-reviewed, and approved before release. Developers should not directly promote unapproved changes into production.

### Central-bank value

The module protects the accuracy of valuation, settlement, regulatory classification, and bond-market reporting.

# Cross-Menu Team Access Model

## Role principles

Access should be based on responsibility, scope, need-to-know, and time—not only seniority.

| Role | View | Initiate | Approve | Restriction |
|---|---|---|---|---|
| Central Bank Governor | All supervisory data | Emergency directives | Final sovereign actions | No shared credentials |
| Supervisory Operator | Oversight and reports | Supervisory reviews | Assigned workflows | Cannot approve own request |
| Compliance Officer | KYC, AML, sanctions | Compliance findings | Compliance gates | Cannot change settlement balances |
| Risk Officer | Risk, limits, stress tests | Limit proposals | Risk gates | Cannot approve own limit change |
| Treasury Trader | Market data and positions | Buy/sell requests | Limited or none | Cannot approve own trade |
| Settlement Officer | Payment and settlement | Settlement actions | Settlement confirmation | Cannot change product policy |
| Custody Officer | Vault and allocated assets | Custody actions | Custody confirmation | Cannot amend market orders |
| Auditor | Read-only evidence | Audit queries | None | Cannot modify operations |
| Security Administrator | IAM and security logs | Access requests | Security changes | Cannot approve own access |
| System Administrator | Technical configuration | Maintenance actions | None | Cannot modify audit history |
| External Reviewer | Assigned evidence only | Review comments | Assigned reviews | Cannot access unrelated institutions |

## Segregation-of-duties conflicts

The system should detect and block or escalate combinations such as:

- Trader plus final trade approver.
- Product creator plus product approver.
- Compliance-policy editor plus compliance auditor.
- Security administrator plus audit-log administrator.
- Settlement initiator plus settlement confirmer.
- Developer plus production deployment approver.
- System administrator plus evidence deletion authority.
- User-access administrator plus independent access reviewer.

## Access-request lifecycle

1. Request submitted.
2. Business need confirmed.
3. Scope and institution checked.
4. SoD analysis performed.
5. Risk assessed.
6. First approval completed.
7. Second approval completed where required.
8. Access provisioned.
9. User notified.
10. Expiry enforced.
11. Access logged.
12. Periodic recertification completed.

# Recommended Sidebar

```text
OPERATIONS
Settlement Monitor
Payments & ISO 20022
Reconciliation
Delivery & Transfers

MARKETS & ASSETS
Gold Bullion
Government Bonds
FX & Money Markets
Custody & Vaults
Portfolio Management
Reserve Overview

RISK & POLICY
Risk Dashboard
Exposure & Limits
Counterparties
Stress Testing
Compliance Dashboard

ACCOUNTING & REPORTING
Statements & GL
Valuation & P&L
Regulatory Reports
Audit Center

SETTLEMENT
Settlement Accounts

GOVERNANCE
Institutions
Users & Roles
Mandates & Policies
Access Logs

CONFIGURATION
System Configuration — Bonds
```

# Central-Bank Acceptance Criteria

The platform should not be considered production-ready until it can demonstrate:

- Clear operator identity and effective authority.
- Clear institution, jurisdiction, environment, and ledger status.
- Separate buy and sell permissions.
- Product-level launch gates.
- Named owner for every unresolved issue.
- Enforced four-eyes approval.
- No self-approval.
- Automatic SoD detection.
- Time-limited privileged access.
- Automatic expiry of temporary access.
- Protected audit logging.
- Immediate user and session revocation.
- Emergency suspension with incident history.
- Versioned evidence export.
- Periodic access recertification.
- Clear distinction between operational alerts and governance exceptions.

The essential design rule is: every sensitive action must have a defined actor, authority, scope, approval path, expiry rule, evidence record, and recovery or reversal path.
