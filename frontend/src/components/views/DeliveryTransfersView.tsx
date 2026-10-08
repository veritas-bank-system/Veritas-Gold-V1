import React, { useMemo, useState } from 'react';
import type { AppSection, FungibleAssetHolding, InstitutionalTxn, PendingApproval } from '../../types';
import { PageContextStrip } from '../smart/PageContextStrip';
import { recordSessionEvent } from '../../services/sessionAudit';
import { appendAuditEvent } from '../../services/api';
import { FileDown, Lock } from 'lucide-react';

/**
 * Delivery & Transfers — movement of assets and ownership records per
 * docs/VERITAS-GOLD-MENU-SPECIFICATIONS.md. The movement register and
 * chain-of-custody timeline derive from the live ledger: real holdings
 * (allocated bars/USTB, holder, unconsumed state) and finalized transfers
 * with finality receipts. New transfer instructions are honest client-side
 * drafts — the physical delivery workflow is a Phase 5 backlog item — and
 * initiation vs confirmation is separated.
 */

interface DeliveryTransfersViewProps {
  holdings: FungibleAssetHolding[];
  transactions: InstitutionalTxn[];
  pendingApprovals: PendingApproval[];
  personaRoleTitle: string;
  institutionName: string;
  environment: string;
  dataStatus: 'loading' | 'available' | 'stale' | 'unavailable';
  onNavigate: (section: AppSection) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

interface TransferInstruction {
  id: string;
  asset: string;
  quantity: string;
  destination: string;
  reason: string;
  createdBy: string;
  createdAt: number;
  status: 'Awaiting custody confirmation (separate officer)' | 'Confirmed (client-side)';
}

const DRAFTS_KEY = 'veritas-transfer-instructions';

function loadDrafts(): TransferInstruction[] {
  try {
    const raw = sessionStorage.getItem(DRAFTS_KEY);
    return raw ? (JSON.parse(raw) as TransferInstruction[]) : [];
  } catch {
    return [];
  }
}

export const DeliveryTransfersView: React.FC<DeliveryTransfersViewProps> = ({
  holdings,
  transactions,
  pendingApprovals,
  personaRoleTitle,
  institutionName,
  environment,
  dataStatus,
  onNavigate,
  onNotify,
}) => {
  const [drafts, setDrafts] = useState<TransferInstruction[]>(() => loadDrafts());
  const [form, setForm] = useState({ asset: 'GOLD', quantity: '', destination: '', reason: '' });

  const movements = useMemo(
    () =>
      transactions
        .filter((t) => t.txn_type.includes('Wire') || t.txn_type.includes('Transfer') || t.debit_credit === 'Debit')
        .map((t) => ({
          id: t.txn_id,
          label: `${t.amount} ${t.currency} · ${t.sender_legal} → ${t.recipient_legal}`,
          date: t.value_date,
          status: t.status,
          custody: t.finality_receipt ? `Notarized (${t.finality_receipt.slice(0, 14)}…)` : 'pending notarization',
          hash: t.onchain_hash,
        })),
    [transactions],
  );

  const custodyInventory = useMemo(
    () =>
      holdings
        .filter((h) => h.status === 'Unconsumed')
        .map((h) => ({
          holdingId: h.holding_id,
          asset: h.asset_symbol,
          amount: h.amount.value_str,
          holder: h.holder,
          state: h.status === 'Unconsumed' ? 'Available (unconsumed)' : 'Consumed (moved)',
        })),
    [holdings],
  );

  const submitInstruction = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!form.quantity || !form.destination || !form.reason) {
      onNotify('Quantity, destination, and documented reason are required', true);
      return;
    }
    const draft: TransferInstruction = {
      id: `TRF-${Date.now().toString(36).toUpperCase()}`,
      asset: form.asset,
      quantity: form.quantity,
      destination: form.destination,
      reason: form.reason,
      createdBy: personaRoleTitle,
      createdAt: Date.now(),
      status: 'Awaiting custody confirmation (separate officer)',
    };
    const next = [draft, ...loadDrafts()];
    try {
      sessionStorage.setItem(DRAFTS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setDrafts(next);
    setForm({ asset: form.asset, quantity: '', destination: '', reason: '' });
    recordSessionEvent({
      actor: personaRoleTitle,
      effectiveRole: personaRoleTitle,
      institution: institutionName,
      action: 'TRANSFER_INSTRUCTED',
      object: `${draft.id} ${draft.asset} ${draft.quantity} → ${draft.destination}`,
      environment,
      reason: draft.reason,
    });
    onNotify(`${draft.id} instructed (client-side draft — custody confirmation is a separate officer)`);
  };

  const exportEvidence = (): void => {
    const payload = {
      view: 'Delivery & Transfers',
      generated_at: new Date().toISOString(),
      custody_inventory: custodyInventory,
      movement_register: movements,
      open_instructions: drafts,
      provenance: 'Derived from live ledger holdings (GET /api/v1/holdings) and the transaction journal.',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veritas-delivery-evidence-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    recordSessionEvent({
      actor: personaRoleTitle,
      effectiveRole: personaRoleTitle,
      institution: institutionName,
      action: 'EXPORT_EVIDENCE',
      object: `Delivery & custody evidence (${movements.length} movements, ${custodyInventory.length} holdings)`,
      environment,
    });
    void appendAuditEvent({
      actor: personaRoleTitle,
      institution: institutionName,
      action: 'DELIVERY_EVIDENCE_EXPORT',
      object: `${movements.length} movements + ${custodyInventory.length} holdings exported`,
      environment,
    }).catch(() => onNotify('Ledger unavailable — export recorded in-session only', true));
    onNotify('Delivery & custody evidence pack exported');
  };

  return (
    <div className="fade-in">
      <PageContextStrip
        pageName="Delivery & Transfers"
        auditPrefix="CB-DELIV"
        personaRoleTitle={personaRoleTitle}
        institutionName={institutionName}
        environment={environment}
        permissionScope="Movement register read · custody inventory · instruction initiation (confirmation separated)"
        dataStatus={dataStatus}
        pendingApprovals={pendingApprovals.length}
        onNavigateApprovals={() => onNavigate('governance')}
        onNotify={onNotify}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Ledger movements (finalized)</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#2BA640' }}>{movements.filter((m) => m.status === 'Finalized').length}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>Notarized with finality receipts</div>
        </div>
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Custody inventory (live)</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>{custodyInventory.length}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>Unconsumed holdings available for delivery</div>
        </div>
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Open transfer instructions</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#F5C842' }}>{drafts.filter((d) => d.status.startsWith('Awaiting')).length}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>Awaiting confirmation by a separate custody officer</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0, marginBottom: '10px' }}>
            Chain-of-custody inventory (live ledger)
          </h3>
          {custodyInventory.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>No unconsumed holdings on the ledger yet.</div>
          ) : (
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ color: 'var(--text-dim)', fontSize: '10px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>Holding</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>Asset</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px' }}>Quantity</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>Holder (masked)</th>
                  </tr>
                </thead>
                <tbody>
                  {custodyInventory.map((c) => (
                    <tr key={c.holdingId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{c.holdingId.slice(0, 14)}…</td>
                      <td style={{ padding: '8px', fontWeight: 700 }}>{c.asset}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{c.amount}</td>
                      <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }} title="Holder principals are masked-first; unmasked reveals are a supervisory action">
                        <Lock size={10} style={{ verticalAlign: '-1px', marginRight: '4px', color: 'var(--text-dim)' }} />
                        {c.holder.slice(0, 8)}…
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0, marginBottom: '10px' }}>
            Movement register (live ledger)
          </h3>
          {movements.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>No finalized movements yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '260px', overflowY: 'auto' }}>
              {movements.map((m) => (
                <div key={m.id} style={{ fontSize: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{m.id}</span>
                    <span style={{ fontWeight: 800, color: m.status === 'Finalized' ? '#2BA640' : '#F5C842' }}>{m.status}</span>
                  </div>
                  <div>{m.label}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>
                    {m.date} · custody: {m.custody} · hash {m.hash.slice(0, 12)}…
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
              New transfer instruction
            </h3>
            <button onClick={exportEvidence} className="btn-secondary" style={{ fontSize: '11px', padding: '5px 9px' }}>
              <FileDown size={11} style={{ verticalAlign: '-2px' }} /> Evidence
            </button>
          </div>
          <form onSubmit={submitInstruction} style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                Asset
                <select value={form.asset} onChange={(e) => setForm({ ...form, asset: e.target.value })} className="input-flat">
                  <option>GOLD</option>
                  <option>USTB</option>
                  <option>EURD</option>
                  <option>USDD</option>
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                Quantity
                <input value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="input-flat" inputMode="decimal" placeholder="e.g. 2.50" />
              </label>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              Destination institution / vault
              <input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} className="input-flat" placeholder="Screened destination" />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              Documented reason
              <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="input-flat" placeholder="Recorded in the audit trail" />
            </label>
            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
              Instruct transfer (client-side draft)
            </button>
            <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
              Physical delivery, bar-level evidence, and dual confirmation are Phase 5 backlog; instructions are drafts and confirmation is separated from initiation.
            </div>
          </form>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0, marginBottom: '10px' }}>
            Instruction queue — initiation ≠ confirmation
          </h3>
          {drafts.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>No transfer instructions in this session.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {drafts.map((d) => (
                <div key={d.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{d.id}</span>
                    <span style={{ fontWeight: 800, color: d.status.startsWith('Awaiting') ? '#F5C842' : '#2BA640' }}>{d.status}</span>
                  </div>
                  <div style={{ fontWeight: 700 }}>
                    {d.quantity} {d.asset} → {d.destination}
                  </div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '11px' }}>Reason: {d.reason} · initiated by {d.createdBy}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
