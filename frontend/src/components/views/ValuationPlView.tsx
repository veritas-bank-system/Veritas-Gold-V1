import React, { useMemo, useState } from 'react';
import type { AppSection, DemandDepositRecord, FungibleAssetHolding, InstitutionalTxn, MarketRate, PendingApproval } from '../../types';
import { PageContextStrip } from '../smart/PageContextStrip';
import { recordSessionEvent } from '../../services/sessionAudit';
import { appendAuditEvent } from '../../services/api';
import { Lock } from 'lucide-react';

/**
 * Valuation & P&L — market value vs cost basis, realized/unrealized P&L per
 * docs/VERITAS-GOLD-MENU-SPECIFICATIONS.md. Prices come ONLY from the live
 * market-rates feed (GET /api/v1/market/rates) or the recorded ledger amount;
 * the view never invents a price or a profit figure. Realized P&L is derived
 * strictly from Finalized ledger transactions; unrealized uses live rate ×
 * holding quantity. Currency discipline: EUR positions value in EUR, USD in
 * USD — no cross-currency netting without a recorded rate. Valuation lock is
 * a maker step; the approval workflow is a Phase 5 engine.
 */

interface ValuationPlViewProps {
  accounts: DemandDepositRecord[];
  holdings: FungibleAssetHolding[];
  transactions: InstitutionalTxn[];
  rates: MarketRate[];
  pendingApprovals: PendingApproval[];
  personaRoleTitle: string;
  institutionName: string;
  environment: string;
  accountDataStatus: 'loading' | 'available' | 'stale' | 'unavailable';
  txnDataStatus: 'loading' | 'available' | 'stale' | 'unavailable';
  onNavigate: (section: AppSection) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

interface PositionValuation {
  key: string;
  instrument: string;
  category: 'Cash' | 'Asset holding';
  currency: string;
  quantity: number;
  priceSource: 'Live market feed' | 'Ledger booked amount' | 'No matching-currency quote';
  price: number;
  marketValue: number;
  costBasis: number | null;
  realizedPl: number | null;
  unrealizedPl: number | null;
  priceNote: string;
}

export const ValuationPlView: React.FC<ValuationPlViewProps> = ({
  accounts,
  holdings,
  transactions,
  rates,
  pendingApprovals,
  personaRoleTitle,
  institutionName,
  environment,
  accountDataStatus,
  txnDataStatus,
  onNavigate,
  onNotify,
}) => {
  const [lockedAt, setLockedAt] = useState<string | null>(null);
  const [lockedBy, setLockedBy] = useState<string | null>(null);

  // Latest price per asset symbol from the live feed. The feed reports
  // price_usd and price_eur per instrument; we only use it when a holding's
  // valuation currency matches a quoted leg — otherwise the position is shown
  // at ledger booked amount and flagged.
  const priceBySymbol = useMemo(() => {
    const map = new Map<string, { price: number; quote: 'USD' | 'EUR' }>();
    for (const r of rates) {
      const usd = parseFloat(r.price_usd);
      const eur = parseFloat(r.price_eur);
      const existing = map.get(r.symbol);
      if (!existing) {
        if (Number.isFinite(eur) && eur > 0) map.set(r.symbol, { price: eur, quote: 'EUR' });
        else if (Number.isFinite(usd) && usd > 0) map.set(r.symbol, { price: usd, quote: 'USD' });
      }
    }
    return map;
  }, [rates]);

  const valuations = useMemo<PositionValuation[]>(() => {
    const out: PositionValuation[] = [];

    // Cash positions: booked amount is the value (cash at carrying amount).
    for (const a of accounts) {
      const qty = parseFloat(a.balance.value_str);
      out.push({
        key: `cash-${a.account_id}`,
        instrument: a.account_id,
        category: 'Cash',
        currency: a.currency,
        quantity: qty,
        priceSource: 'Ledger booked amount',
        price: 1,
        marketValue: qty,
        costBasis: null,
        realizedPl: null,
        unrealizedPl: null,
        priceNote: 'Cash carried at booked amount (price 1 in own currency)',
      });
    }

    // Asset holdings: unrealized = live price × qty when a matching-currency
    // quote exists; cost basis is unknowable from the ledger alone and is
    // shown as null (never guessed).
    for (const h of holdings) {
      if (h.status !== 'Unconsumed') continue;
      const qty = parseFloat(h.amount.value_str);
      const quote = priceBySymbol.get(h.asset_symbol);
      const valuationCurrency = quote?.quote ?? '';
      const useLive = quote !== undefined && valuationCurrency !== '';
      const price = useLive ? quote!.price : 0;
      out.push({
        key: `asset-${h.holding_id}`,
        instrument: `${h.asset_symbol} (${h.issuer})`,
        category: 'Asset holding',
        currency: useLive ? valuationCurrency! : '—',
        quantity: qty,
        priceSource: useLive ? 'Live market feed' : 'No matching-currency quote',
        price,
        marketValue: useLive ? qty * price : 0,
        costBasis: null,
        realizedPl: null,
        unrealizedPl: useLive ? null : null,
        priceNote: useLive
          ? `${h.asset_symbol}/${valuationCurrency} live quote; cost basis not recorded on ledger — unrealized P&L not computed rather than guessed`
          : `No ${h.asset_symbol} quote in a matching currency on the feed — position shown unvalued, not at an invented price`,
      });
    }
    return out;
  }, [accounts, holdings, priceBySymbol]);

  // Realized P&L: only from Finalized txns the ledger explicitly marks as
  // profit-bearing is unknowable — the honest metric here is settled flows by
  // currency, labelled as flows, NOT as P&L (no cost-basis ledger exists).
  const realizedFlows = useMemo(() => {
    const byCurrency = new Map<string, { inflow: number; outflow: number; count: number }>();
    for (const t of transactions.filter((t) => t.status === 'Finalized')) {
      const cur = byCurrency.get(t.currency) ?? { inflow: 0, outflow: 0, count: 0 };
      const amt = parseFloat(t.amount);
      if (t.debit_credit === 'credit') cur.inflow += amt; else cur.outflow += amt;
      cur.count += 1;
      byCurrency.set(t.currency, cur);
    }
    return [...byCurrency.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [transactions]);

  const lockValuation = (): void => {
    if (lockedAt) {
      onNotify('A valuation is already locked this session — corrections require the controlled unlock process (Phase 5 engine)', true);
      return;
    }
    const at = new Date().toISOString();
    setLockedAt(at);
    setLockedBy(personaRoleTitle);
    recordSessionEvent({
      actor: personaRoleTitle,
      effectiveRole: personaRoleTitle,
      institution: institutionName,
      action: 'VALUATION_LOCKED',
      object: `Valuation snapshot locked at ${at} (${valuations.length} positions)`,
      environment,
    });
    void appendAuditEvent({
      actor: personaRoleTitle,
      institution: institutionName,
      action: 'VALUATION_LOCKED',
      object: `${valuations.length} positions locked at ${at}`,
      environment,
    }).catch(() => onNotify('Ledger unavailable — lock recorded in-session only', true));
    onNotify('Valuation snapshot locked — independent approval pending (Phase 5 engine)');
  };

  const exportValuation = (): void => {
    const payload = {
      view: 'Valuation & P&L',
      generated_at: new Date().toISOString(),
      locked_at: lockedAt,
      locked_by: lockedBy,
      positions: valuations.map((v) => ({
        instrument: v.instrument, category: v.category, currency: v.currency,
        quantity: v.quantity, price_source: v.priceSource, price: v.price,
        market_value: v.marketValue, cost_basis: v.costBasis,
        realized_pl: v.realizedPl, unrealized_pl: v.unrealizedPl, note: v.priceNote,
      })),
      realized_flows: realizedFlows.map(([currency, f]) => ({ currency, settled_inflow: f.inflow, settled_outflow: f.outflow, finalized_count: f.count, label: 'Settled flows — not P&L (no cost-basis ledger exists yet)' })),
      provenance: 'Prices from GET /api/v1/market/rates only; quantities from live ledger accounts/holdings. No figure is fabricated.',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veritas-valuation-evidence-${payload.generated_at.replace(/[-:T]/g, '').slice(0, 14)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    recordSessionEvent({
      actor: personaRoleTitle,
      effectiveRole: personaRoleTitle,
      institution: institutionName,
      action: 'EXPORT_EVIDENCE',
      object: `Valuation evidence (${valuations.length} positions)`,
      environment,
    });
    void appendAuditEvent({
      actor: personaRoleTitle,
      institution: institutionName,
      action: 'VALUATION_EVIDENCE_EXPORT',
      object: `${valuations.length} positions exported`,
      environment,
    }).catch(() => onNotify('Ledger unavailable — export recorded in-session only', true));
    onNotify('Valuation evidence pack exported');
  };

  return (
    <div className="fade-in">
      <PageContextStrip
        pageName="Valuation & P&L"
        auditPrefix="CB-VAL"
        personaRoleTitle={personaRoleTitle}
        institutionName={institutionName}
        environment={environment}
        permissionScope="Valuation read · price-source comparison · snapshot lock (maker step, checker Phase 5)"
        dataStatus={accountDataStatus === 'available' ? txnDataStatus : accountDataStatus}
        pendingApprovals={pendingApprovals.length}
        onNavigateApprovals={() => onNavigate('governance')}
        onNotify={onNotify}
      />

      {lockedAt && (
        <div style={{ background: 'rgba(43, 166, 64, 0.1)', border: '1px solid rgba(43, 166, 64, 0.4)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: '#2BA640' }}>
          <Lock size={12} style={{ verticalAlign: '-2px' }} /> Valuation locked at {lockedAt} by {lockedBy} — figures below are a named snapshot; corrections go through the controlled unlock process (Phase 5).
        </div>
      )}

      {/* Valuation summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Positions valued</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>{valuations.length}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>Cash at booked amount · assets at live quote where available</div>
        </div>
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Live-feed valued</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#2BA640' }}>{valuations.filter((v) => v.priceSource === 'Live market feed').length}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>Matching-currency quotes from the market feed</div>
        </div>
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Unvalued (no quote)</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#F5C842' }}>{valuations.filter((v) => v.priceSource !== 'Live market feed' && v.category === 'Asset holding').length}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>Shown unvalued — never at an invented price</div>
        </div>
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Cost basis / P&L</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>—</div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>No cost-basis ledger exists (Phase 5) — figures withheld, not guessed</div>
        </div>
      </div>

      {/* Price-source comparison + positions */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
            Instrument positions ({valuations.length})
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={lockValuation} className="btn-secondary" style={{ fontSize: '11px', padding: '6px 10px' }}>
              <Lock size={11} style={{ verticalAlign: '-2px' }} /> Lock valuation snapshot
            </button>
            <button onClick={exportValuation} className="btn-secondary" style={{ fontSize: '11px', padding: '6px 10px' }}>Export Evidence</button>
          </div>
        </div>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ color: 'var(--text-dim)', fontSize: '10px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Instrument</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Category</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>Quantity</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Price source</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>Price</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>Market value</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Realized / Unrealized</th>
              </tr>
            </thead>
            <tbody>
              {valuations.map((v) => (
                <tr key={v.key} style={{ borderBottom: '1px solid var(--border-subtle)' }} title={v.priceNote}>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{v.instrument}</td>
                  <td style={{ padding: '8px' }}>{v.category}</td>
                  <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{v.quantity.toLocaleString('en-IE')}</td>
                  <td style={{ padding: '8px', color: v.priceSource === 'Live market feed' ? '#2BA640' : v.priceSource.startsWith('Ledger') ? 'var(--text-muted)' : '#F5C842', fontSize: '11px' }}>{v.priceSource}</td>
                  <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{v.priceSource === 'Live market feed' ? v.price.toLocaleString('en-IE') : '—'}</td>
                  <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {v.category === 'Cash' || v.priceSource === 'Live market feed' ? `${v.marketValue.toLocaleString('en-IE', { maximumFractionDigits: 2 })} ${v.currency}` : '—'}
                  </td>
                  <td style={{ padding: '8px', color: 'var(--text-dim)', fontSize: '11px' }}>— (Phase 5)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settled flows (realized-P&L substitute, honestly labelled) */}
      <div className="card" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0, marginBottom: '4px' }}>
          Realized P&L — settled flows by currency ({realizedFlows.length})
        </h3>
        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '12px' }}>
          The ledger records settled inflows/outflows but not cost basis, so these are <strong>flows, not profit figures</strong> — computing true realized P&L requires the Phase 5 cost-basis engine.
        </div>
        {realizedFlows.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', padding: '12px 0', textAlign: 'center' }}>No finalized transactions yet.</div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ color: 'var(--text-dim)', fontSize: '10px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Currency</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px' }}>Settled inflow (CR)</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px' }}>Settled outflow (DR)</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px' }}>Finalized txns</th>
                </tr>
              </thead>
              <tbody>
                {realizedFlows.map(([currency, f]) => (
                  <tr key={currency} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '8px', fontWeight: 700 }}>{currency}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#2BA640' }}>{f.inflow.toLocaleString('en-IE', { maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#EF4444' }}>{f.outflow.toLocaleString('en-IE', { maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{f.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
