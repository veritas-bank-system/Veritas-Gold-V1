import React, { useMemo, useState } from 'react';
import type { AppSection, DemandDepositRecord, FungibleAssetHolding, InstitutionalTxn, PendingApproval } from '../../types';
import { PageContextStrip } from '../smart/PageContextStrip';
import { recordSessionEvent } from '../../services/sessionAudit';
import { appendAuditEvent } from '../../services/api';
import { FileDown } from 'lucide-react';

/**
 * Statements & GL — account hierarchy, journal queue, period close per
 * docs/VERITAS-GOLD-MENU-SPECIFICATIONS.md. Every journal line is a real
 * ledger fact: institutional transactions carry their own gl_code and
 * debit_credit designation, so the journal below is the live ledger journal
 * projected into GL form — never a fabricated trial balance. Period close is
 * an honest client-side proposal state (the GL engine is a Phase 5 backlog
 * item); balances are shown exactly as the ledger reports them, per-currency.
 */

interface StatementsAndGlViewProps {
  accounts: DemandDepositRecord[];
  holdings: FungibleAssetHolding[];
  transactions: InstitutionalTxn[];
  pendingApprovals: PendingApproval[];
  personaRoleTitle: string;
  institutionName: string;
  environment: string;
  accountDataStatus: 'loading' | 'available' | 'stale' | 'unavailable';
  txnDataStatus: 'loading' | 'available' | 'stale' | 'unavailable';
  onNavigate: (section: AppSection) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

type JournalStatus = 'Posted' | 'Pending approval' | 'Rejected';

interface JournalLine {
  txnId: string;
  bookingDate: string;
  glCode: string;
  account: string;
  description: string;
  amount: string;
  currency: string;
  debitCredit: string;
  status: JournalStatus;
  finality: string;
}

/** Account status is a discriminated union on the wire; project to a label. */
function accountStatusLabel(status: DemandDepositRecord['status']): { label: string; color: string } {
  if (status === 'Active') return { label: 'Active', color: '#2BA640' };
  if (typeof status === 'string') return { label: status, color: '#F5C842' };
  const kind = Object.keys(status)[0];
  const detail = (status as Record<string, { reason?: string; by?: string }>)[kind];
  return { label: `${kind}${detail?.reason ? ` — ${detail.reason}` : ''}`, color: '#EF4444' };
}

export const StatementsAndGlView: React.FC<StatementsAndGlViewProps> = ({
  accounts,
  holdings,
  transactions,
  pendingApprovals,
  personaRoleTitle,
  institutionName,
  environment,
  accountDataStatus,
  txnDataStatus,
  onNavigate,
  onNotify,
}) => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | JournalStatus>('ALL');
  const [closeProposal, setCloseProposal] = useState<{ period: string; proposedBy: string; at: string } | null>(null);

  // Per-currency trial balance from live cash accounts only — no cross-currency
  // addition (banking-finance-rules: amounts never add across currencies).
  const balancesByCurrency = useMemo(() => {
    const map = new Map<string, { accounts: number; total: number }>();
    for (const a of accounts) {
      const cur = map.get(a.currency) ?? { accounts: 0, total: 0 };
      cur.accounts += 1;
      cur.total += parseFloat(a.balance.value_str);
      map.set(a.currency, cur);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [accounts]);

  const journal: JournalLine[] = useMemo(() => {
    const lines: JournalLine[] = transactions.map((t) => ({
      txnId: t.txn_id,
      bookingDate: t.booking_date,
      glCode: t.gl_code || '—',
      account: t.debit_credit === 'debit' ? t.sender_legal : t.recipient_legal,
      description: t.memo || `${t.txn_type} ${t.sender_legal} → ${t.recipient_legal}`,
      amount: t.amount,
      currency: t.currency,
      debitCredit: t.debit_credit,
      status: t.status === 'Finalized' ? 'Posted' : t.status === 'Failed' ? 'Rejected' : 'Pending approval',
      finality: t.finality_receipt,
    }));
    const q = query.trim().toLowerCase();
    return lines.filter((l) => {
      if (statusFilter !== 'ALL' && l.status !== statusFilter) return false;
      if (q && !`${l.txnId} ${l.glCode} ${l.account} ${l.description} ${l.amount} ${l.currency}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [transactions, query, statusFilter]);

  const counts = useMemo(() => ({
    posted: journal.filter((l) => l.status === 'Posted').length,
    pending: journal.filter((l) => l.status === 'Pending approval').length,
    rejected: journal.filter((l) => l.status === 'Rejected').length,
  }), [journal]);

  const exportGlEvidence = (): void => {
    const payload = {
      view: 'Statements & GL',
      generated_at: new Date().toISOString(),
      trial_balance: balancesByCurrency.map(([currency, b]) => ({ currency, accounts: b.accounts, total: b.total })),
      holdings: holdings.map((h) => ({ holding_id: h.holding_id, asset: h.asset_symbol, amount: h.amount.value_str, holder: h.holder, status: typeof h.status === 'string' ? h.status : Object.keys(h.status)[0] })),
      journal: journal.map((l) => ({
        txn_id: l.txnId, booking_date: l.bookingDate, gl_code: l.glCode, account: l.account,
        description: l.description, amount: `${l.amount} ${l.currency}`, debit_credit: l.debitCredit, status: l.status, finality_receipt: l.finality,
      })),
      period_close_proposal: closeProposal,
      provenance: 'Journal derived 1:1 from the live ledger transaction journal; balances from GET /api/v1/reporting/accounts. No aggregation across currencies.',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veritas-gl-evidence-${payload.generated_at.replace(/[-:T]/g, '').slice(0, 14)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    recordSessionEvent({
      actor: personaRoleTitle,
      effectiveRole: personaRoleTitle,
      institution: institutionName,
      action: 'EXPORT_EVIDENCE',
      object: `GL evidence pack (${journal.length} journal lines, ${balancesByCurrency.length} currencies)`,
      environment,
    });
    void appendAuditEvent({
      actor: personaRoleTitle,
      institution: institutionName,
      action: 'GL_EVIDENCE_EXPORT',
      object: `${journal.length} journal lines exported`,
      environment,
    }).catch(() => onNotify('Ledger unavailable — export recorded in-session only', true));
    onNotify('GL evidence pack exported');
  };

  const proposeClose = (): void => {
    // Maker step only: the close needs an independent checker (Phase 5 GL
    // engine). Proposing twice for the same period is refused.
    const period = new Date().toISOString().slice(0, 7);
    if (closeProposal?.period === period) {
      onNotify(`Period ${period} already proposed — awaiting independent checker approval`, true);
      return;
    }
    const proposal = { period, proposedBy: personaRoleTitle, at: new Date().toISOString() };
    setCloseProposal(proposal);
    recordSessionEvent({
      actor: personaRoleTitle,
      effectiveRole: personaRoleTitle,
      institution: institutionName,
      action: 'PERIOD_CLOSE_PROPOSED',
      object: `Accounting period ${period} proposed for close (maker step)`,
      environment,
    });
    void appendAuditEvent({
      actor: personaRoleTitle,
      institution: institutionName,
      action: 'PERIOD_CLOSE_PROPOSED',
      object: `Period ${period} — awaiting independent checker`,
      environment,
    }).catch(() => onNotify('Ledger unavailable — proposal recorded in-session only', true));
    onNotify(`Period ${period} close proposed — checker step pending (maker ≠ checker)`);
  };

  return (
    <div className="fade-in">
      <PageContextStrip
        pageName="Statements & GL"
        auditPrefix="CB-GL"
        personaRoleTitle={personaRoleTitle}
        institutionName={institutionName}
        environment={environment}
        permissionScope="Account hierarchy read · journal queue read · period close proposal (maker step, checker separated)"
        dataStatus={accountDataStatus === 'available' ? txnDataStatus : accountDataStatus}
        pendingApprovals={pendingApprovals.length}
        onNavigateApprovals={() => onNavigate('governance')}
        onNotify={onNotify}
      />

      {/* Account hierarchy + balance summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        {balancesByCurrency.map(([currency, b]) => (
          <div key={currency} className="card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Total {currency} balances</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
              {b.total.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>{b.accounts} cash account{b.accounts === 1 ? '' : 's'} · live ledger, no cross-currency netting</div>
          </div>
        ))}
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Asset holdings (memo inventory)</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>{holdings.filter((h) => h.status === 'Unconsumed').length}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>Unconsumed holdings · valued in Valuation & P&L</div>
        </div>
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Journal queue</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: counts.pending > 0 ? '#F5C842' : 'var(--text-main)' }}>{counts.pending}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>Awaiting approval · {counts.posted} posted · {counts.rejected} rejected</div>
        </div>
      </div>

      {/* Account register */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0, marginBottom: '12px' }}>
          Account hierarchy ({accounts.length}) — from GET /api/v1/reporting/accounts
        </h3>
        {accounts.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', padding: '14px 0', textAlign: 'center' }}>
            No cash accounts returned by the ledger. Nothing is invented here — accounts appear when the backend reports them.
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ color: 'var(--text-dim)', fontSize: '10px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Account</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Owner (masked)</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Custodian</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px' }}>Balance</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px' }}>Overdraft limit</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => {
                  const st = accountStatusLabel(a.status);
                  const ownerMasked = a.owner.length > 10 ? `${a.owner.slice(0, 8)}…` : a.owner;
                  return (
                    <tr key={a.account_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{a.account_id}</td>
                      <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }} title="Masked-first read; unmask requires authorization + audit">{ownerMasked}</td>
                      <td style={{ padding: '8px' }}>{a.custodian}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{a.balance.value_str} {a.currency}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>{a.overdraft_limit.value_str}</td>
                      <td style={{ padding: '8px', fontWeight: 700, color: st.color }}>{st.label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Period close */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>Period close</h3>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
              {closeProposal
                ? `Proposal for ${closeProposal.period} filed by ${closeProposal.proposedBy} at ${closeProposal.at} — the checker must be a different principal (GL engine is a Phase 5 backlog item).`
                : 'No close proposal this session. Proposing is the maker step; an independent checker must approve (Phase 5 GL engine).'}
            </div>
          </div>
          <button onClick={proposeClose} className="btn-secondary" style={{ fontSize: '11px', padding: '6px 10px' }}>
            Propose current-period close
          </button>
        </div>
      </div>

      {/* Journal queue */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
            GL journal ({journal.length}) — projected 1:1 from ledger transactions
          </h3>
          <button onClick={exportGlEvidence} className="btn-secondary" style={{ fontSize: '11px', padding: '6px 10px' }}>
            <FileDown size={11} style={{ verticalAlign: '-2px' }} /> Export Evidence
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="input-flat" placeholder="Search journal, GL code, account…" style={{ flex: 1, minWidth: '200px' }} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="input-flat" style={{ width: 'auto' }}>
            <option value="ALL">All statuses</option>
            <option value="Posted">Posted</option>
            <option value="Pending approval">Pending approval</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        {journal.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', padding: '16px 0', textAlign: 'center' }}>
            No journal lines match. Journal lines are projections of real ledger transactions — none are seeded.
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ color: 'var(--text-dim)', fontSize: '10px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Txn</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Booking date</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>GL code</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Account</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>D/C</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px' }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {journal.map((l) => (
                  <tr key={l.txnId} style={{ borderBottom: '1px solid var(--border-subtle)' }} title={`${l.description} · finality ${l.finality}`}>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{l.txnId}</td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{l.bookingDate}</td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{l.glCode}</td>
                    <td style={{ padding: '8px' }}>{l.account}</td>
                    <td style={{ padding: '8px', fontWeight: 700, color: l.debitCredit === 'debit' ? '#EF4444' : '#2BA640' }}>{l.debitCredit === 'debit' ? 'DR' : 'CR'}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{l.amount} {l.currency}</td>
                    <td style={{ padding: '8px', fontWeight: 700, color: l.status === 'Posted' ? '#2BA640' : l.status === 'Rejected' ? '#EF4444' : '#F5C842' }}>{l.status}</td>
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
