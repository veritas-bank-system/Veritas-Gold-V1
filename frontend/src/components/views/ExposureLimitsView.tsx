import React, { useMemo, useState } from 'react';
import type { AppSection, DemandDepositRecord, FungibleAssetHolding, PendingApproval } from '../../types';
import { PageContextStrip } from '../smart/PageContextStrip';
import { recordSessionEvent } from '../../services/sessionAudit';
import { Plus } from 'lucide-react';

/**
 * Exposure & Limits — the quantitative/policy boundary registry per
 * docs/VERITAS-GOLD-MENU-SPECIFICATIONS.md. Reference sandbox limits are
 * clearly labelled simulated records; utilization is computed against real
 * ledger exposures where a live source exists, otherwise shown honestly as
 * no-source. Limit proposals are client-side drafts (the limits engine is a
 * Phase 3 backlog item) with proposer ≠ approver enforced in the UI.
 */

interface ExposureLimitsViewProps {
  accounts: DemandDepositRecord[];
  holdings: FungibleAssetHolding[];
  pendingApprovals: PendingApproval[];
  personaRoleTitle: string;
  personaId: string;
  institutionName: string;
  environment: string;
  accountDataStatus: 'loading' | 'available' | 'stale' | 'unavailable';
  accountsFetchedAt: number | null;
  onNavigate: (section: AppSection) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

interface LimitDraft {
  id: string;
  limitType: string;
  scope: string;
  currency: string;
  threshold: string;
  expiry: string;
  reason: string;
  proposedBy: string;
  proposedAt: number;
  status: 'Pending second approval' | 'Approved (client-side)';
  approvedBy: string | null;
}

const DRAFTS_KEY = 'veritas-limit-proposals';

function loadDrafts(): LimitDraft[] {
  try {
    const raw = sessionStorage.getItem(DRAFTS_KEY);
    return raw ? (JSON.parse(raw) as LimitDraft[]) : [];
  } catch {
    return [];
  }
}

function saveDrafts(drafts: LimitDraft[]): void {
  try {
    sessionStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch {
    /* storage unavailable */
  }
}

/** Reference sandbox limits — simulated records only (per the app-wide
 *  SANDBOX banner), but utilization is measured against REAL ledger exposure
 *  wherever a live figure exists. */
const REFERENCE_LIMITS = [
  { id: 'LMT-CUR-EUR', type: 'Currency · cash', scope: 'All institutions', currency: 'EUR', threshold: 10_000_000, usageSource: 'cash' as const },
  { id: 'LMT-XAU-OZ', type: 'Commodity · allocated gold', scope: 'All institutions', currency: 'XAU oz', threshold: 100, usageSource: 'gold' as const },
  { id: 'LMT-USTB', type: 'Sovereign debt · USTB', scope: 'All institutions', currency: 'USTB', threshold: 250_000, usageSource: 'ustb' as const },
  { id: 'LMT-CPTY-JPM', type: 'Counterparty concentration', scope: 'JPMorgan Chase N.A.', currency: 'EUR', threshold: 600_000_000, usageSource: null },
  { id: 'LMT-SETT-DAY', type: 'Settlement · daily gross', scope: 'Sandbox rail', currency: 'EUR', threshold: 50_000_000, usageSource: null },
];

export const ExposureLimitsView: React.FC<ExposureLimitsViewProps> = ({
  accounts,
  holdings,
  pendingApprovals,
  personaRoleTitle,
  personaId,
  institutionName,
  environment,
  accountDataStatus,
  accountsFetchedAt,
  onNavigate,
  onNotify,
}) => {
  const [drafts, setDrafts] = useState<LimitDraft[]>(() => loadDrafts());
  const [form, setForm] = useState({ limitType: 'Currency · cash', scope: '', currency: 'EUR', threshold: '', expiry: '', reason: '' });

  const usage = useMemo(() => {
    let cash = 0;
    for (const a of accounts) cash += parseFloat(a.balance.value_str);
    let gold = 0;
    let ustb = 0;
    for (const h of holdings) {
      if (h.status !== 'Unconsumed') continue;
      if (h.asset_symbol === 'GOLD') gold += parseFloat(h.amount.value_str);
      if (h.asset_symbol === 'USTB') ustb += parseFloat(h.amount.value_str);
    }
    return { cash, gold, ustb };
  }, [accounts, holdings]);

  const submitProposal = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!form.threshold || !form.expiry || !form.reason) {
      onNotify('Threshold, expiry date, and reason are required for a limit proposal', true);
      return;
    }
    const draft: LimitDraft = {
      id: `PRP-${Date.now().toString(36).toUpperCase()}`,
      limitType: form.limitType,
      scope: form.scope || institutionName,
      currency: form.currency,
      threshold: form.threshold,
      expiry: form.expiry,
      reason: form.reason,
      proposedBy: `${personaRoleTitle} (${personaId.slice(0, 8)}…)`,
      proposedAt: Date.now(),
      status: 'Pending second approval',
      approvedBy: null,
    };
    const next = [draft, ...loadDrafts()];
    saveDrafts(next);
    setDrafts(next);
    setForm({ limitType: form.limitType, scope: '', currency: form.currency, threshold: '', expiry: '', reason: '' });
    recordSessionEvent({
      actor: personaRoleTitle,
      effectiveRole: personaRoleTitle,
      institution: institutionName,
      action: 'LIMIT_PROPOSED',
      object: `${draft.id} ${draft.limitType} @ ${draft.threshold} ${draft.currency}`,
      environment,
      reason: draft.reason,
    });
    onNotify(`Limit proposal ${draft.id} routed for second approval (client-side draft)`);
  };

  const approveProposal = (id: string): void => {
    const next = loadDrafts().map((d) => (d.id === id ? { ...d, status: 'Approved (client-side)' as const, approvedBy: `${personaRoleTitle} (${personaId.slice(0, 8)}…)` } : d));
    saveDrafts(next);
    setDrafts(next);
    recordSessionEvent({
      actor: personaRoleTitle,
      effectiveRole: personaRoleTitle,
      institution: institutionName,
      action: 'LIMIT_APPROVED',
      object: id,
      environment,
      reason: 'Second-approval four-eyes step (client-side; not ledger-backed yet)',
    });
    onNotify(`${id} second approval recorded (client-side, not ledger-backed)`);
  };

  return (
    <div className="fade-in">
      <PageContextStrip
        pageName="Exposure & Limits"
        auditPrefix="CB-LIMITS"
        personaRoleTitle={personaRoleTitle}
        institutionName={institutionName}
        environment={environment}
        permissionScope="Limit registry read · proposal initiation · second approval (non-self)"
        dataStatus={accountDataStatus}
        dataFetchedAt={accountsFetchedAt}
        pendingApprovals={pendingApprovals.length}
        onNavigateApprovals={() => onNavigate('governance')}
        onNotify={onNotify}
      />

      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0, marginBottom: '4px' }}>
          Limit registry — utilization vs live ledger exposure
        </h3>
        <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginBottom: '12px' }}>
          Reference sandbox limits are simulated records. Utilization figures marked LIVE are computed from real accounts/holdings; no limits engine exists yet (Phase 3).
        </div>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ color: 'var(--text-dim)', fontSize: '10px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Limit ID</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Type</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Scope</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>Threshold</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>Current usage</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>Available</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>Utilization</th>
              </tr>
            </thead>
            <tbody>
              {REFERENCE_LIMITS.map((lim) => {
                const live = lim.usageSource === 'cash' ? usage.cash : lim.usageSource === 'gold' ? usage.gold : lim.usageSource === 'ustb' ? usage.ustb : null;
                const unit = lim.usageSource === 'gold' ? ' oz' : lim.usageSource === 'ustb' ? '' : '';
                const pct = live !== null ? Math.min(100, (live / lim.threshold) * 100) : null;
                return (
                  <tr key={lim.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{lim.id}</td>
                    <td style={{ padding: '8px', fontWeight: 700 }}>{lim.type}</td>
                    <td style={{ padding: '8px' }}>{lim.scope}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{lim.threshold.toLocaleString('en-IE')} {lim.currency === 'XAU oz' ? 'oz' : lim.currency}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {live !== null ? `${live.toLocaleString('en-IE', { maximumFractionDigits: 2 })}${unit}` : <span style={{ color: 'var(--text-dim)' }}>no source</span>}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {live !== null ? `${Math.max(0, lim.threshold - live).toLocaleString('en-IE', { maximumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 800, color: pct === null ? 'var(--text-dim)' : pct > 75 ? '#EF4444' : pct > 50 ? '#F5C842' : '#2BA640' }}>
                      {pct === null ? '—' : `${pct.toFixed(1)}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={14} /> New limit proposal
          </h3>
          <form onSubmit={submitProposal} style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              Limit type
              <select value={form.limitType} onChange={(e) => setForm({ ...form, limitType: e.target.value })} className="input-flat">
                <option>Currency · cash</option>
                <option>Commodity · allocated gold</option>
                <option>Sovereign debt · USTB</option>
                <option>Counterparty concentration</option>
                <option>Settlement · daily gross</option>
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              Scope (institution / counterparty / rail)
              <input value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} className="input-flat" placeholder="e.g. All institutions" />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                New threshold
                <input value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} className="input-flat" inputMode="decimal" placeholder="e.g. 250000" />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                Expiry (temporary limits auto-expire)
                <input type="date" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} className="input-flat" required />
              </label>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              Reason (recorded in the audit trail)
              <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="input-flat" placeholder="Documented business justification" />
            </label>
            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
              Submit proposal → second approval
            </button>
            <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
              Drafts are client-side (limits engine is Phase 3). Proposer cannot self-approve.
            </div>
          </form>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0, marginBottom: '10px' }}>
            Proposal queue — four-eyes approval
          </h3>
          {drafts.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>No limit proposals in this session.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {drafts.map((d) => {
                const isProposer = d.proposedBy.startsWith(personaRoleTitle) && d.proposedBy.includes(personaId.slice(0, 8));
                return (
                  <div key={d.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{d.id}</span>
                      <span style={{ fontWeight: 800, color: d.status.startsWith('Pending') ? '#F5C842' : '#2BA640' }}>{d.status}</span>
                    </div>
                    <div style={{ fontWeight: 700 }}>{d.limitType} → {d.threshold} {d.currency} · scope {d.scope}</div>
                    <div style={{ color: 'var(--text-dim)' }}>Expires {d.expiry} · reason: {d.reason}</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '11px' }}>Proposer: {d.proposedBy}{d.approvedBy ? ` · Approver: ${d.approvedBy}` : ''}</div>
                    {d.status.startsWith('Pending') && (
                      isProposer ? (
                        <div style={{ fontSize: '10.5px', color: '#F5C842', fontWeight: 700 }}>Self-approval blocked — a second authorized approver must sign.</div>
                      ) : (
                        <button onClick={() => approveProposal(d.id)} className="btn-primary" style={{ alignSelf: 'flex-start', fontSize: '11px', padding: '5px 10px' }}>
                          Second approval (four-eyes)
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
