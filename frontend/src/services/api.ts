import type {
  DemandDepositRecord,
  FungibleAssetHolding,
  PrincipalProfile,
  BlindedIdentity,
  MarketRate,
  FxReferenceRates,
  RwaOffer,
  SettlementTelemetry,
  SupervisionData,
  AuditEventsResponse,
  AuditChainVerification,
  InstitutionalTxn,
  CollateralPosition,
  BondAuction,
  AuctionBid,
  CorporateAction,
  PendingApproval,
  VaultSensorTelemetry,
  SweepingRule,
  BridgeRoute,
  CanisterStatusInfo,
  LiquidityPool,
} from '../types';

// Deployment override: build with VITE_API_BASE set — e.g. `VITE_API_BASE=/api/v1 npm run build`
// when a reverse proxy forwards /api/v1 to the backend on the same origin, or an absolute
// URL for a split (UI + API) deployment. Without it the default resolves to the same-origin
// /api/v1 when the UI itself is served from the backend (:8080), otherwise the local-dev
// http://localhost:8080/api/v1 — which only works for browsers running on the backend host.
const API_BASE: string = import.meta.env.VITE_API_BASE
  || (typeof window !== 'undefined' && (window.location.port === '8080' || window.location.host.includes(':8080'))
    ? '/api/v1'
    : 'http://localhost:8080/api/v1');

const FRANKFURTER_URL = 'https://api.frankfurter.dev/v1/latest?base=EUR';

export async function fetchFxReferenceRates(signal?: AbortSignal): Promise<FxReferenceRates> {
  const response = await fetch(FRANKFURTER_URL, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Reference-rate provider returned HTTP ${response.status}`);

  const payload = await response.json() as { base?: string; date?: string; rates?: Record<string, unknown> };
  const rates: Record<string, number> = {};
  for (const currency of ['USD', 'CHF', 'GBP']) {
    const rate = Number(payload.rates?.[currency]);
    if (!Number.isFinite(rate) || rate <= 0) throw new Error(`Reference-rate response is missing a valid ${currency} rate`);
    rates[currency] = rate;
  }
  if (payload.base !== 'EUR' || !payload.date) throw new Error('Reference-rate response has an unexpected base currency or no effective date');

  return {
    base: payload.base,
    date: payload.date,
    rates,
    source: 'Frankfurter API · ECB reference rates',
    sourceUrl: FRANKFURTER_URL,
    retrievedAt: Date.now(),
  };
}

export async function fetchMarketRates(): Promise<MarketRate[]> {
  try {
    const res = await fetch(`${API_BASE}/rates`);
    if (res.ok) {
      const data = await res.json();
      return data.rates;
    }
  } catch (err) {
    console.warn('Demo backend market-rate fetch unavailable:', err);
  }

  // Keep demo market products clearly fictional when the local backend is offline.
  return [
    {
      symbol: 'XAU/EUR',
      name: 'Demo gold scenario (not a market quote)',
      category: 'Static demo fixture',
      iso24165_dti: 'DTI-GOLD-9999',
      price_usd: '2912.40',
      price_eur: '2542.10',
      change_24h: '—',
      backing: 'No live gold feed or reserve verification is connected',
      liquidity_depth: 'Not available',
    },
    {
      symbol: 'sBOND/5Y',
      name: 'Demo bond scenario (not a market quote)',
      category: 'Static demo fixture',
      iso24165_dti: 'DTI-BOND-8821',
      price_usd: '108.50',
      price_eur: '100.00',
      change_24h: '—',
      backing: 'Demo data only; not an offer or market quote',
      liquidity_depth: 'Not available',
    },
  ];
}

export async function fetchAccounts(): Promise<DemandDepositRecord[]> {
  const res = await fetch(`${API_BASE}/accounts`);
  if (!res.ok) throw new Error('Failed to fetch accounts');
  return res.json();
}

export async function createAccount(payload: {
  custodian: string;
  owner: string;
  currency: string;
  overdraft_limit: string;
  daily_transfer_limit: string;
}): Promise<DemandDepositRecord> {
  const res = await fetch(`${API_BASE}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create account');
  }
  return res.json();
}

export async function transferCash(payload: {
  sender_id: string;
  recipient_id: string;
  amount: string;
  memo?: string;
  gl_code?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/accounts/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to transfer cash');
  }
  return res.json();
}

export async function fetchHoldings(): Promise<FungibleAssetHolding[]> {
  const res = await fetch(`${API_BASE}/holdings`);
  if (!res.ok) throw new Error('Failed to fetch holdings');
  return res.json();
}

export async function issueAsset(payload: {
  issuer: string;
  holder: string;
  currency: string;
  amount: string;
}): Promise<FungibleAssetHolding> {
  const res = await fetch(`${API_BASE}/assets/issue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to issue asset');
  }
  return res.json();
}

export async function transferAsset(payload: {
  sender: string;
  recipient: string;
  currency: string;
  amount: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/assets/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to transfer asset');
  }
  return res.json();
}

export async function fetchIdentities(): Promise<PrincipalProfile[]> {
  const res = await fetch(`${API_BASE}/identities`);
  if (!res.ok) throw new Error('Failed to fetch identities');
  return res.json();
}

export async function registerIdentity(payload: {
  principal: string;
  legal_name: string;
  role: string;
}): Promise<PrincipalProfile> {
  const res = await fetch(`${API_BASE}/identities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to register identity');
  }
  return res.json();
}

export async function blindIdentity(payload: {
  well_known: string;
  anonymous: string;
}): Promise<BlindedIdentity> {
  const res = await fetch(`${API_BASE}/identities/blind`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to swap blinded identity');
  }
  return res.json();
}

export async function executeRfqTrade(payload: {
  account_id: string;
  buyer_principal: string;
  asset_symbol: string;
  asset_amount: string;
  cash_amount: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/rfq/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'RFQ Trade Execution Failed');
  }
  return res.json();
}

export async function fetchOffers(): Promise<RwaOffer[]> {
  const res = await fetch(`${API_BASE}/offers`);
  if (!res.ok) throw new Error('Failed to fetch RWA offers');
  return res.json();
}

export async function createOffer(payload: {
  seller_principal: string;
  seller_legal_name: string;
  asset_symbol: string;
  asset_name: string;
  asset_amount: string;
  price_per_unit_eur: string;
}): Promise<RwaOffer> {
  const res = await fetch(`${API_BASE}/offers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create RWA offer');
  }
  return res.json();
}

export async function acceptOffer(payload: {
  offer_id: string;
  buyer_principal: string;
  buyer_account_id: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/offers/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to accept offer');
  }
  return res.json();
}

export async function fetchSupervision(): Promise<SupervisionData> {
  const res = await fetch(`${API_BASE}/admin/supervision`);
  if (!res.ok) throw new Error('Failed to fetch supervisory data');
  return res.json();
}

/** Ledger-side, append-only hash-chained audit journal (newest first). */
export async function fetchAuditEvents(actionFilter?: string): Promise<AuditEventsResponse> {
  const qs = actionFilter ? `?action=${encodeURIComponent(actionFilter)}` : '';
  const res = await fetch(`${API_BASE}/admin/audit-events${qs}`);
  if (!res.ok) throw new Error('Failed to fetch audit events');
  return res.json();
}

/** Verify the ledger audit chain end-to-end (server-side re-hash). */
export async function verifyAuditChain(): Promise<AuditChainVerification> {
  const res = await fetch(`${API_BASE}/admin/audit-events/verify`);
  if (!res.ok) throw new Error('Failed to verify audit chain');
  return res.json();
}

/** Append a client-attested event (e.g. evidence export) onto the ledger chain. */
export async function appendAuditEvent(payload: {
  actor: string;
  effective_role?: string;
  institution?: string;
  action: string;
  object: string;
  environment?: string;
  before?: string;
  after?: string;
  correlation_id?: string;
  reason?: string;
  result?: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/audit-events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to append audit event');
}

export async function fetchTransactions(): Promise<InstitutionalTxn[]> {
  const res = await fetch(`${API_BASE}/reporting/transactions`);
  if (!res.ok) throw new Error('Failed to fetch institutional transactions');
  return res.json();
}

export async function fetchStandardsMapping(): Promise<any> {
  const res = await fetch(`${API_BASE}/standards/mapping`);
  if (!res.ok) throw new Error('Failed to fetch standards mapping');
  return res.json();
}

export async function fetchCollateralPositions(): Promise<CollateralPosition[]> {
  const res = await fetch(`${API_BASE}/collateral/positions`);
  if (!res.ok) throw new Error('Failed to fetch collateral positions');
  return res.json();
}

export async function postCollateral(payload: {
  asset_symbol: string;
  asset_name: string;
  amount: string;
  market_value_eur: string;
  haircut_percent: string;
  pledgee: string;
}): Promise<CollateralPosition> {
  const res = await fetch(`${API_BASE}/collateral/positions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to post collateral');
  }
  return res.json();
}

export async function fetchAuctions(): Promise<BondAuction[]> {
  const res = await fetch(`${API_BASE}/auctions`);
  if (!res.ok) throw new Error('Failed to fetch bond auctions');
  return res.json();
}

export async function submitAuctionBid(payload: {
  auction_id: string;
  bidder_legal: string;
  amount_eur: string;
  bid_yield_pct: string;
}): Promise<AuctionBid> {
  const res = await fetch(`${API_BASE}/auctions/bid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to submit bid');
  }
  return res.json();
}

export async function fetchCorporateActions(): Promise<CorporateAction[]> {
  const res = await fetch(`${API_BASE}/corporate-actions`);
  if (!res.ok) throw new Error('Failed to fetch corporate actions');
  return res.json();
}

export async function executeCorporateAction(action_id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/corporate-actions/distribute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action_id }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Corporate action payout failed');
  }
  return res.json();
}

export async function fetchApprovals(): Promise<PendingApproval[]> {
  const res = await fetch(`${API_BASE}/governance/approvals`);
  if (!res.ok) throw new Error('Failed to fetch approval queue');
  return res.json();
}

export async function approveGovernanceItem(approval_id: string, checker_signer: string): Promise<any> {
  const res = await fetch(`${API_BASE}/governance/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approval_id, checker_signer }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Governance signature rejected');
  }
  return res.json();
}

export async function fetchVaultTelemetry(): Promise<VaultSensorTelemetry> {
  const res = await fetch(`${API_BASE}/vault/telemetry`);
  if (!res.ok) throw new Error('Failed to fetch vault telemetry');
  return res.json();
}

export async function fetchSettlementTelemetry(): Promise<SettlementTelemetry> {
  const res = await fetch(`${API_BASE}/settlement/telemetry`);
  if (!res.ok) throw new Error('Failed to fetch settlement telemetry');
  return res.json();
}

export async function fetchSweepingRules(): Promise<SweepingRule[]> {
  const res = await fetch(`${API_BASE}/treasury/sweeper`);
  if (!res.ok) throw new Error('Failed to fetch sweeping rules');
  return res.json();
}

export async function createSweepingRule(payload: {
  source_account: string;
  target_asset: string;
  threshold_eur: string;
  frequency: string;
}): Promise<SweepingRule> {
  const res = await fetch(`${API_BASE}/treasury/sweeper`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create sweeping rule');
  }
  return res.json();
}

export async function fetchBridgeRoutes(): Promise<BridgeRoute[]> {
  const res = await fetch(`${API_BASE}/bridge/routes`);
  if (!res.ok) throw new Error('Failed to fetch bridge routes');
  return res.json();
}

export async function executeBridgeTransfer(payload: {
  source_network: string;
  target_network: string;
  asset_symbol: string;
  amount: string;
  recipient_address: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/bridge/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Bridge transfer failed');
  }
  return res.json();
}

export async function fetchCanisters(): Promise<CanisterStatusInfo[]> {
  const res = await fetch(`${API_BASE}/canisters`);
  if (!res.ok) throw new Error('Failed to fetch canisters');
  return res.json();
}

export async function topUpCanister(canister_id: string, cycles_to_add_tc: string): Promise<any> {
  const res = await fetch(`${API_BASE}/canisters/topup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ canister_id, cycles_to_add_tc }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Top-up failed');
  }
  return res.json();
}

export async function fetchLiquidityPools(): Promise<LiquidityPool[]> {
  const res = await fetch(`${API_BASE}/liquidity/pools`);
  if (!res.ok) throw new Error('Failed to fetch liquidity pools');
  return res.json();
}

export async function fetchBondContracts(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/factory/bonds`);
  if (!res.ok) throw new Error('Failed to fetch sovereign bond contracts');
  return res.json();
}

export async function createBondContract(payload: {
  issuer_name: string;
  issuer_principal: string;
  isin_code: string;
  dti_code: string;
  currency: string;
  notional_volume_eur: string;
  coupon_rate_pct: string;
  coupon_frequency: string;
  actus_contract_type: string;
  maturity_date: string;
  auction_mechanism: string;
  collateral_backing: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/factory/bonds/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to deploy sovereign bond canister');
  }
  return res.json();
}

export const issueBlindedIdentity = blindIdentity;
export const fetchSupervisionData = fetchSupervision;

export function getCsvExportUrl(): string {
  return `${API_BASE}/reporting/export/csv`;
}

export function getJsonExportUrl(): string {
  return `${API_BASE}/reporting/export/json`;
}
