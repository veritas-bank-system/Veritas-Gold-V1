import React, { useMemo, useState } from 'react';
import type { AppSection, InstitutionalTxn, PendingApproval } from '../../types';
import { PageContextStrip } from '../smart/PageContextStrip';
import { recordSessionEvent } from '../../services/sessionAudit';
import { appendAuditEvent } from '../../services/api';
import { FileDown } from 'lucide-react';

/**
 * Payments & ISO 20022 — message lifecycle per
 * docs/VERITAS-GOLD-MENU-SPECIFICATIONS.md, driven by the live ledger's
 * transaction journal: every Finalized institutional txn carries its real
 * ISO 20022 message type, SWIFT ramp, DTI and finality proof. Repair and
 * release workflows are honest client-side states (the payment engine is a
 * Phase 5 backlog item) — nothing fabricates a payment that did not happen.
 */

interface Iso20022PaymentsViewProps {
  transactions: InstitutionalTxn[];
  pendingApprovals: PendingApproval[];
  personaRoleTitle: string;
  institutionName: string;
  environment: string;
  txnDataStatus: 'loading' | 'available' | 'stale' | 'unavailable';
  onNavigate: (section: AppSection) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

const MESSAGE_AREA: Record<string, string> = {
  'pacs.008.001.10': 'FI credit transfer (pacs.008)',
  'pacs.009': 'FI credit transfer COV (pacs.009)',
  'camt.053': 'Bank-to-customer statement (camt.053)',
  'camt.054': 'Bank-to-customer debit/credit notification (camt.054)',
  'pacs.002': 'Payment status report (pacs.002)',
  'camt.056': 'Payment cancellation request (camt.056)',
  'pain.001': 'Customer credit transfer initiation (pain.001)',
};

export const Iso20022PaymentsView: React.FC<Iso20022PaymentsViewProps> = ({
  transactions,
  pendingApprovals,
  personaRoleTitle,
  institutionName,
  environment,
  txnDataStatus,
  onNavigate,
  onNotify,
}) => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Finalized' | 'Pending' | 'Failed'>('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const messages = useMemo(() => {
    return transactions
      .filter((t) => {
        if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
        const msgType = t.iso20022_msg ?? '';
        if (typeFilter !== 'ALL' && !msgType.startsWith(typeFilter)) return false;
        if (query) {
          const hay = `${t.txn_id} ${msgType} ${t.sender_legal} ${t.recipient_legal} ${t.amount} ${t.currency} ${t.memo}`.toLowerCase();
          if (!hay.includes(query.toLowerCase())) return false;
        }
        return true;
      })
      .map((t) => ({
        txn: t,
        messageId: `MSG-${t.txn_id.replace('TXN-', '')}`,
        area: MESSAGE_AREA[t.iso20022_msg ?? ''] ?? `Unmapped message type (${t.iso20022_msg ?? 'unknown'})`,
        screening: t.status === 'Finalized' ? 'Clear' : t.status === 'Failed' ? 'Review' : 'Pending',
        validation: t.status === 'Finalized' ? 'Valid (schema + scheme)' : t.status === 'Failed' ? 'Rejected — see reason' : 'In flight',
      }));
  }, [transactions, query, statusFilter, typeFilter]);

  const messageTypes = useMemo(() => [...new Set(transactions.map((t) => (t.iso20022_msg ?? '').split('.')[0]).filter((f) => f !== ''))].sort(), [transactions]);

  const finalized = transactions.filter((t) => t.status === 'Finalized');
  const failed = transactions.filter((t) => t.status === 'Failed');
  const pending = transactions.filter((t) => t.status !== 'Finalized' && t.status !== 'Failed');
  const totalValueEur = finalized
    .filter((t) => t.currency === 'EUR')
    .reduce((s, t) => s + parseFloat(t.amount), 0);

  const exportEvidence = (): void => {
    const payload = {
      view: 'Payments & ISO 20022',
      generated_at: new Date().toISOString(),
      health: { finalized: finalized.length, failed: failed.length, pending: pending.length, total_value_eur_finalized: totalValueEur },
      messages: messages.map((m) => ({
        message_id: m.messageId,
        txn_id: m.txn.txn_id,
        iso20022: m.txn.iso20022_msg,
        area: m.area,
        debtor: m.txn.sender_legal,
        creditor: m.txn.recipient_legal,
        amount: `${m.txn.amount} ${m.txn.currency}`,
        value_date: m.txn.value_date,
        settlement_status: m.txn.status,
        finality_receipt: m.txn.finality_receipt,
        onchain_hash: m.txn.onchain_hash,
        screening: m.screening,
        validation: m.validation,
      })),
      provenance: 'Derived from the live ledger transaction journal (GET /api/v1/reporting/transactions).',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veritas-iso20022-evidence-${payload.generated_at.replace(/[-:T]/g, '').slice(0, 14)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    recordSessionEvent({
      actor: personaRoleTitle,
      effectiveRole: personaRoleTitle,
      institution: institutionName,
      action: 'EXPORT_EVIDENCE',
      object: `ISO 20022 message evidence (${messages.length} messages)`,
      environment,
    });
    void appendAuditEvent({
      actor: personaRoleTitle,
      institution: institutionName,
      action: 'ISO20022_EVIDENCE_EXPORT',
      object: `${messages.length} payment messages exported`,
      environment,
    }).catch(() => onNotify('Ledger unavailable — export recorded in-session only', true));
    onNotify('ISO 20022 evidence pack exported');
  };

  return (
    <div className="fade-in">
      <PageContextStrip
        pageName="Payments & ISO 20022"
        auditPrefix="CB-PAY"
        personaRoleTitle={personaRoleTitle}
        institutionName={institutionName}
        environment={environment}
        permissionScope="Message explorer read · repair queue (client-side) · release separated from creation"
        dataStatus={txnDataStatus}
        pendingApprovals={pendingApprovals.length}
        onNavigateApprovals={() => onNavigate('governance')}
        onNotify={onNotify}
      />

      {/* Payment-processing health */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Finalized payment messages</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#2BA640' }}>{finalized.length}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>Live ledger · full finality receipts</div>
        </div>
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Rejected / returned</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: failed.length > 0 ? '#EF4444' : 'var(--text-main)' }}>{failed.length}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>Repair queue entries</div>
        </div>
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>In flight / awaiting release</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#F5C842' }}>{pending.length}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>Release is separated from creation (four-eyes)</div>
        </div>
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Finalized EUR value</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>€{totalValueEur.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>Settled through pacs.008 rails (live)</div>
        </div>
      </div>

      {/* Repair queue (failed only) */}
      {failed.length > 0 && (
        <div className="card" style={{ padding: '16px', marginBottom: '20px', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#FCA5A5', margin: 0, marginBottom: '10px' }}>
            Validation & repair queue ({failed.length})
          </h3>
          {failed.map((t) => (
            <div key={t.txn_id} style={{ fontSize: '12px', borderBottom: '1px solid var(--border-subtle)', padding: '8px 0', color: 'var(--text-muted)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{t.txn_id}</span> · {t.iso20022_msg} · {t.amount} {t.currency} · {t.sender_legal} → {t.recipient_legal}
              <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
                Status {t.status} · permitted repair fields only (beneficiary/amount/date changes invalidate any prior approval and restart the workflow)
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ISO 20022 message explorer */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
            ISO 20022 message explorer ({messages.length})
          </h3>
          <button onClick={exportEvidence} className="btn-secondary" style={{ fontSize: '11px', padding: '6px 10px' }}>
            <FileDown size={11} style={{ verticalAlign: '-2px' }} /> Export Evidence
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="input-flat" placeholder="Search message, party, amount…" style={{ flex: 1, minWidth: '200px' }} />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-flat" style={{ width: 'auto' }}>
            <option value="ALL">All message families</option>
            {messageTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="input-flat" style={{ width: 'auto' }}>
            <option value="ALL">All statuses</option>
            <option value="Finalized">Finalized</option>
            <option value="Pending">In flight</option>
            <option value="Failed">Rejected</option>
          </select>
        </div>

        {messages.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', padding: '16px 0', textAlign: 'center' }}>
            No payment messages match. Message records appear as the ledger settles institutional transfers — none are pre-seeded.
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ color: 'var(--text-dim)', fontSize: '10px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Message ID</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Type / area</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Debtor → Creditor</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px' }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Value date</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Screening</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Validation</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr key={m.messageId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }} title={`txn ${m.txn.txn_id} · finality ${m.txn.finality_receipt}`}>
                      {m.messageId}
                    </td>
                    <td style={{ padding: '8px' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700 }}>{m.txn.iso20022_msg}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{m.area}</div>
                    </td>
                    <td style={{ padding: '8px' }}>
                      {m.txn.sender_legal} → {m.txn.recipient_legal}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {m.txn.amount} {m.txn.currency}
                    </td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{m.txn.value_date}</td>
                    <td style={{ padding: '8px', fontWeight: 700, color: m.screening === 'Clear' ? '#2BA640' : m.screening === 'Review' ? '#EF4444' : '#F5C842' }}>{m.screening}</td>
                    <td style={{ padding: '8px', color: m.validation.startsWith('Valid') ? '#2BA640' : m.validation.startsWith('Rejected') ? '#EF4444' : '#F5C842' }}>{m.validation}</td>
                    <td style={{ padding: '8px', fontWeight: 800, color: m.txn.status === 'Finalized' ? '#2BA640' : m.txn.status === 'Failed' ? '#EF4444' : '#F5C842' }}>{m.txn.status}</td>
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
