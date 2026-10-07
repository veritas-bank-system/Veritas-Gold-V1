export type PrincipalId = string;
export type AccountId = string;
export type HoldingId = string;
export type CurrencyCode = string;

export type Perspective = 'trader' | 'issuer' | 'ops' | 'regulator' | 'admin';

/** Two top-level institutional workspaces, selected at login. Both share the
 *  same identity, compliance, custody, settlement, and audit infrastructure;
 *  only the navigation, permissions, and workflows differ. */
export type WorkspaceId = 'central_bank' | 'institutional';

/** Persona ids allowed in each workspace. Both workspaces share the same
 *  identity/audit infrastructure; the workspace gates which institutional
 *  roles may operate in it and which dashboard/nav they receive. */
export const WORKSPACE_PERSONA_IDS: Record<WorkspaceId, string[]> = {
  central_bank: ['persona_cb_governor', 'persona_super_admin', 'persona_supervisory_auditor'],
  institutional: ['persona_comm_treasury', 'persona_issuer_dmo', 'persona_custodian_vault', 'persona_fund_asset_mgr'],
};

/** The two top-level personas — default selection per workspace. */
export const WORKSPACE_FLAGSHIP_PERSONA: Record<WorkspaceId, string> = {
  central_bank: 'persona_cb_governor',
  institutional: 'persona_comm_treasury',
};

export const WORKSPACE_NAME: Record<WorkspaceId, string> = {
  central_bank: 'Central Bank Workspace',
  institutional: 'Institutional Workspace',
};
export type AppSection =
  | 'cb_dashboard'
  | 'inst_dashboard'
  | 'mvp_verification'
  | 'admin_overview'
  | 'workspace_dashboard'
  | 'workspace_tasks'
  | 'portfolio'
  | 'accounts_overview'
  | 'settlement_instruments'
  | 'transfers_payments'
  | 'liquidity_management'
  | 'statements_reconciliation'
  | 'terminal'
  | 'rwa_terminal'
  | 'asset_catalogue'
  | 'contract_maker'
  | 'bond_draft_instruments'
  | 'auctions'
  | 'bond_auctions'
  | 'corporate_actions'
  | 'trading_rfq'
  | 'trade'
  | 'trading_blotter_dvp'
  | 'yield_analytics'
  | 'vault'
  | 'custody_positions'
  | 'vault_telemetry'
  | 'por_attestations'
  | 'collateral'
  | 'collateral_desk'
  | 'notaries'
  | 'settlement_monitor'
  | 'interoperability'
  | 'iso20022_messages'
  | 'bridge'
  | 'approved_rail_connectors'
  | 'compliance'
  | 'compliance_dashboard'
  | 'canister_mgmt'
  | 'canister_operations'
  | 'liquidity_pools'
  | 'wholesale_liquidity'
  | 'governance'
  | 'sweeper'
  | 'logs'
  | 'support'
  | 'help_docs'
  | 'trader_desk'
  | 'identity_admin'
  | 'enterprise_admin'
  | 'secure_chat'
  // Workspace-scoped nav entries (Central Bank / Institutional). These are
  // persona-policy labels that resolve onto the shared views via SECTION_ALIASES.
  | 'cb_limits'
  | 'cb_stress'
  | 'cb_compliance_dash'
  | 'statements_gl'
  | 'cb_valuation'
  | 'cb_reg_reports'
  | 'cb_audit'
  | 'cb_mandates'
  | 'iso20022_bridge'
  | 'inst_inventory'
  | 'inst_repo'
  | 'inst_gold_loans'
  | 'inst_sec_lending'
  | 'inst_limits'
  | 'inst_margin'
  | 'inst_surveillance'
  | 'inst_pnl'
  | 'inst_client_stmts'
  | 'inst_apis';

export interface Amount {
  value_str: string;
}

export interface DemandDepositRecord {
  account_id: string;
  custodian: string;
  owner: string;
  currency: string;
  balance: Amount;
  overdraft_limit: Amount;
  daily_withdrawal_limit: Amount;
  daily_transfer_limit: Amount;
  accumulated_daily_debit: Amount;
  status: 'Active' | { Suspended: { reason: string; by: string; timestamp: number } } | { Closed: { by: string; timestamp: number } };
  updated_at: number;
}

export interface FungibleAssetHolding {
  holding_id: string;
  asset_symbol: string;
  issuer: string;
  holder: string;
  amount: Amount;
  pointer: {
    update_id: string;
    output_index: number;
  };
  status: 'Unconsumed' | { Consumed: { consuming_update_id: string; consumed_at: number } };
}

export interface PrincipalProfile {
  principal: string;
  legal_name: string;
  role: string;
  is_verified: boolean;
  registered_at: number;
}

export interface BlindedIdentity {
  anonymous_principal: string;
  well_known_principal: string;
  ownership_proof_signature: number[];
  created_at: number;
}

export interface FxReferenceRates {
  base: string;
  date: string;
  rates: Record<string, number>;
  source: string;
  sourceUrl: string;
  retrievedAt: number;
}

export interface MarketRate {
  symbol: string;
  name: string;
  category: string;
  iso24165_dti?: string;
  price_usd: string;
  price_eur: string;
  change_24h: string;
  backing: string;
  liquidity_depth: string;
}

export interface RwaOffer {
  offer_id: string;
  seller_principal: string;
  seller_legal_name: string;
  asset_symbol: string;
  asset_name: string;
  asset_amount: string;
  price_per_unit_eur: string;
  total_price_eur: string;
  status: string;
  created_at: number;
}

export interface UnmaskedFlow {
  anonymous_id: string;
  unmasked_legal_owner: string;
  net_exposure_eur: string;
  rwa_gold_holdings_oz?: string;
  rwa_bond_holdings_usd?: string;
  risk_tier: string;
}

export interface SupervisionData {
  supervision_timestamp: number;
  radar_status: string;
  double_spend_attempts_intercepted: number;
  total_active_canister_partitions: number;
  regulatory_unmasking_authority: string;
  iso20022_compliance_mode?: string;
  unmasked_active_flows: UnmaskedFlow[];
}

export interface InstitutionalTxn {
  txn_id: string;
  booking_date: string;
  value_date: string;
  gl_code: string;
  txn_type: string;
  iso20022_msg?: string;
  iso24165_dti?: string;
  actus_contract_type?: string;
  swift_on_off_ramp_code?: string;
  canister_principal_id?: string;
  sender_legal: string;
  recipient_legal: string;
  amount: string;
  currency: string;
  debit_credit: string;
  memo: string;
  onchain_hash: string;
  finality_receipt: string;
  status: string;
}

export interface CollateralPosition {
  position_id: string;
  asset_symbol: string;
  asset_name: string;
  pledged_amount: string;
  market_value_eur: string;
  haircut_percent: string;
  borrowing_capacity_eur: string;
  custodian: string;
  pledgee: string;
  status: string;
}

export interface NotaryNode {
  id: string;
  name: string;
  latency_ms: number;
  status: 'online' | 'offline';
  is_leader?: boolean;
}

export interface DoubleSpendLog {
  timestamp: string;
  stateref: string;
  requesting_party: string;
  status: 'VALIDATED' | 'REJECTED';
  signatures: string;
  reason?: string;
  operation?: string;
  detail?: string;
}

export interface SettlementEvent {
  seq: number;
  timestamp_ms: number;
  operation: string;
  stateref: string;
  requesting_party: string;
  status: 'VALIDATED' | 'REJECTED';
  reason: string;
  signatures: string;
  duration_us: number;
  detail: string;
}

export interface SettlementTelemetry {
  server_time_ms: number;
  started_at_ms: number;
  uptime_s: number;
  subnet: { notaries: number; quorum: number; algorithm: string; leader: string };
  nodes: NotaryNode[];
  metrics: {
    ops_total: number;
    validated: number;
    rejected: number;
    tps_60s: number;
    last_finality_us: number;
    p99_finality_us: number;
    pending_staterefs: number;
    avg_latency_ms: number;
  };
  events: SettlementEvent[];
}

export interface ProtocolLog {
  id: string;
  type: 'CashTransfer' | 'AssetTransfer' | 'BlindedSwap' | 'AssetIssue' | 'AtomicDvPTrade' | 'AtomicP2POfferExecution';
  sender: string;
  recipient: string;
  amount: string;
  currency: string;
  status: 'Finalized' | 'InputsLocked' | 'Validating' | 'Failed';
  step: string;
  timestamp: string;
}

export interface BondAuction {
  auction_id: string;
  bond_symbol: string;
  bond_name: string;
  issuer_legal: string;
  total_issuance_eur: string;
  min_bid_eur: string;
  target_yield_pct: string;
  cutoff_yield_pct: string;
  bids_count: number;
  status: string;
  maturity_date: string;
}

export interface AuctionBid {
  bid_id: string;
  auction_id: string;
  bidder_legal: string;
  amount_eur: string;
  bid_yield_pct: string;
  status: string;
}

export interface CorporateAction {
  action_id: string;
  asset_symbol: string;
  asset_name: string;
  action_type: string;
  actus_contract: string;
  rate_or_amount_per_unit: string;
  record_date: string;
  payment_date: string;
  total_distributed_eur: string;
  status: string;
}

export interface PendingApproval {
  approval_id: string;
  maker_principal: string;
  maker_legal: string;
  action_type: string;
  amount_eur: string;
  details: string;
  required_signatures: number;
  current_signatures: number;
  signers: string[];
  status: string;
  created_at: string;
}

export interface VaultSensorTelemetry {
  vault_location: string;
  total_bars_verified: number;
  total_weight_kg: string;
  ultrasonic_density_pct: string;
  vault_temperature_c: string;
  humidity_pct: string;
  purity_grade: string;
  merkle_root_hash: string;
  oracle_attestation_status: string;
  /** Notary sequence the attestation root was computed over (live backend only). */
  attestation_seq?: number;
  /** Server timestamp (ms) of this sensor scan (live backend only). */
  last_scan_ms?: number;
  /** Total tokenized gold reserve in troy oz (live backend only). */
  reserve_gold_oz?: string;
}

export interface SweepingRule {
  rule_id: string;
  source_account: string;
  target_asset: string;
  threshold_eur: string;
  frequency: string;
  is_active: boolean;
  total_swept_eur: string;
}

export interface SweepingRuleDraft {
  draft_id: string;
  source_account: string;
  currency: string;
  reserve_floor: string;
  trigger_threshold: string;
  sweep_cap: string;
  target_asset: string;
  frequency: string;
  created_at: number;
  creator_persona_id: string;
  creator_persona_name: string;
  institution_name: string;
  reviewed_at?: number;
  reviewed_by?: string;
}

export interface BridgeRoute {
  route_id: string;
  source_network: string;
  target_network: string;
  asset_symbol: string;
  estimated_time_sec: number;
  gas_fee_eur: string;
  threshold_ecdsa_notary: string;
  status: string;
}

export interface CanisterStatusInfo {
  canister_id: string;
  canister_name: string;
  wasm_module_hash: string;
  cycles_balance_tc: string;
  memory_used_mb: string;
  subnet: string;
  status: string;
}

export interface LiquidityPool {
  pool_id: string;
  pair_name: string;
  token_a_symbol: string;
  token_b_symbol: string;
  reserve_a: string;
  reserve_b: string;
  total_liquidity_eur: string;
  fee_tier_pct: string;
  volume_24h_eur: string;
  apy_pct: string;
}

export interface SovereignBondContract {
  contract_id: string;
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
  canister_principal_id: string;
  status: string;
  created_at: number;
}
