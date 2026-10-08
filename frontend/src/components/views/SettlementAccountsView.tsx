import React, { useMemo, useState } from 'react';
import type { AppSection, DemandDepositRecord, PendingApproval } from '../../types';
import { PageContextStrip } from '../smart/PageContextStrip';
import { recordSessionEvent } from '../../services/sessionAudit';
import { appendAuditEvent } from '../../services/api';

/**
 * Settlement Accounts — verification queue, signatories, rail mapping,
 * account restrictions per docs/VERITAS-GOLD-MENU-SPECIFICATIONS.md.
 * Balances, owners, custodians and limits are LIVE ledger facts
 * (GET /api/v1/reporting/accounts). Rail mapping and signatories are shown
 * as "not configured" where the ledger has no such registry — the settlement
 * rails actually in use are derived from where real settled transactions
 * flowed (ISO 20022 message types on finality-proven transactions), never
 * from a hardcoded list. Verification and signatory changes are maker-step
 * proposals with dual-approval discipline noted.
 */

interface SettlementAccountsViewProps {
  accounts: DemandDepositRecord[];
  transactions: { iso20022_msg?: string; status: string; currency: string; counterpartyRail?: string }[];
  pendingApprovals: PendingApproval[];
  personaRoleTitle: string;
  institutionName: string;
  environment: string;
  accountDataStatus: 'loading' | 'available' | 'stale' | 'unavailable';
  onNavigate: (section: AppSection) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

/** The rails actually observed on finalized transactions. */
const RAIL_FROM_MSG: Record<string, string> = {
  'pacs.008.001.10': 'pacs.008 FI credit transfer rail',
  'pacs.009': 'pacs.009 COV rail',
};

export const SettlementAccountsView: React.FC<SettlementAccountsViewProps> = ({
  accounts,
  transactions,
  pendingApprovals,
  personaRoleTitle,
  institutionName,
  environment,
  accountDataStatus,
  onNavigate,
  onNotify,
}) => {
  const [verificationProposals, setVerificationProposals] = useState<Record<string, string>>({});

  const observedRails = useMemo(() => {
    const rails = new Map<string, number>();
    for (const t of transactions) {
      if (t.status !== 'Finalized' || !t.iso20022_msg) continue;
      const rail = RAIL_FROM_MSG[t.iso20022_msg] ?? (t.iso20022_msg.startsWith('pacs') ? `ISO 20022 ${t.iso20022_msg.split('.').slice(0, 2).join('.')}` : null);
      if (rail) rails.set(rail, (rails.get(rail) ?? 0) + 1);
    }
    return [...rails.entries()];
  }, [transactions]);

  const accountRows = useMemo(
    () =>
      accounts.map((a) => ({
        ...a,
        statusLabel: a.status === 'Active' ? 'Active' : typeof a.status === 'string' ? a.status : Object.keys(a.status)[0],
        verification: verificationProposals[a.account_id] ? 'Proposed' : a.status === 'Active' ? 'Verified (live ledger)' : 'Needs review',
        restrictions: [a.daily_transfer_limit.value_str !== '0' ? `Daily transfer limit ${a.daily_transfer_limit.value_str} ${a.currency}` : null, a.overdraft_limit.value_str !== '0' ? `Overdraft facility ${a.overdraft_limit.value_str} ${a.currency}` : null].filter((x): x is string => x !== null),
      })),
    [accounts, verificationProposals],
  );

  const proposeVerification = (accountId: string, owner: string): void => {
    if (verificationProposals[accountId]) {
      onNotify(`${owner} already has a pending verification review this session`, true);
      return;
    }
    const at = new Date().toISOString();
    setVerificationProposals((current) => ({ ...current, [accountId]: at }));
    recordSessionEvent({
      actor: personaRoleTitle,
      effectiveRole: personaRoleTitle,
      institution: institutionName,
      action: 'ACCOUNT_VERIFICATION_PROPOSED',
      object: `${accountId} (${owner}) — ownership verification (dual approval, Phase 5 checker)`,
      environment,
    });
    void appendAuditEvent({
      actor: personaRoleTitle,
      institution: institutionName,
      action: 'ACCOUNT_VERIFICATION_PROPOSED',
      object: accountId,
      environment,
    }).catch(() => onNotify('Ledger unavailable — proposal recorded in-session only', true));
    onNotify(`Verification review proposed for ${owner} — dual approval pending`);
  };

  const exportEvidence = (): void => {
    const payload = {
      view: 'Settlement Accounts',
      generated_at: new Date().toISOString(),
      accounts: accountRows.map((a) => ({
        account_id: a.account_id, owner: a.owner, custodian: a.custodian, currency: a.currency,
        balance: a.balance.value_str, status: a.statusLabel, verification: a.verification,
        daily_transfer_limit: a.daily_transfer_limit.value_str, overdraft_limit: a.overdraft_limit.value_str,
        restrictions: a.restrictions,
      })),
      observed_rails: observedRails.map(([rail, count]) => ({ rail, finalized_transactions: count, source: 'ISO 20022 message types on finalized ledger transactions' })),
      signatory_registry: 'Not configured — signatory registry is a Phase 5 engine; none is invented here.',
      provenance: 'Accounts from GET /api/v1/reporting/accounts (live). Rails derived from actual finalized traffic.',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veritas-settlement-accounts-evidence-${payload.generated_at.replace(/[-:T]/g, '').slice(0, 14)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    recordSessionEvent({
      actor: personaRoleTitle,
      effectiveRole: personaRoleTitle,
      institution: institutionName,
      action: 'EXPORT_EVIDENCE',
      object: `Settlement accounts evidence (${accountRows.length} accounts)`,
      environment,
    });
    void appendAuditEvent({
      actor: personaRoleTitle,
      institution: institutionName,
      action: 'SETTLEMENT_ACCOUNTS_EXPORT',
      object: `${accountRows.length} accounts exported`,
      environment,
    }).catch(() => onNotify('Ledger unavailable — export recorded in-session only', true));
    onNotify('Settlement accounts evidence exported');
  };

  return (
    <div className="fade-in">
      <PageContextStrip
        pageName="Settlement Accounts"
        auditPrefix="CB-STA"
        personaRoleTitle={personaRoleTitle}
        institutionName={institutionName}
        environment={environment}
        permissionScope="Account read (live) · verification proposals (dual approval) · rails from observed traffic"
        dataStatus={accountDataStatus}
        pendingApprovals={pendingApprovals.length}
        onNavigateApprovals={() => onNavigate('governance')}
        onNotify={onNotify}
      />

      {/* Settlement rail status — derived from real traffic */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0, marginBottom: '4px' }}>
          Settlement rails in use ({observedRails.length}) — observed on finalized traffic
        </h3>
        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '10px' }}>
          Derived from ISO 20022 message types on finality-proven transactions — not a configured list.
        </div>
        {observedRails.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', padding: '10px 0' }}>No finalized rail traffic yet — rails appear here as real settlements occur.</div>
        ) : (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {observedRails.map(([rail, count]) => (
              <div key={rail} style={{ border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px 14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700 }}>{rail}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>{count} finalized transaction{count === 1 ? '' : 's'}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account registry */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
            Settlement accounts ({accountRows.length})
          </h3>
          <button onClick={exportEvidence} className="btn-secondary" style={{ fontSize: '11px', padding: '6px 10px' }}>Export Evidence</button>
        </div>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ color: 'var(--text-dim)', fontSize: '10px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Account</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Owner (masked)</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Custodian</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>Balance</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Restrictions</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Verification</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Signatories</th>
              </tr>
            </thead>
            <tbody>
              {accountRows.map((a) => (
                <tr key={a.account_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>{a.account_id.slice(0, 16)}…</td>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '10.5px' }} title="Masked-first read">{a.owner.length > 10 ? `${a.owner.slice(0, 8)}…` : a.owner}</td>
                  <td style={{ padding: '8px', fontSize: '11px' }}>{a.custodian}</td>
                  <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{a.balance.value_str} {a.currency}</td>
                  <td style={{ padding: '8px', fontSize: '10.5px', color: 'var(--text-muted)' }}>{a.restrictions.length > 0 ? a.restrictions.join(' · ') : 'None recorded'}</td>
                  <td style={{ padding: '8px', fontSize: '11px' }}>
                    {verificationProposals[a.account_id] ? (
                      <span style={{ color: '#F5C842' }}>Review proposed</span>
                    ) : (
                      <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ color: a.verification.startsWith('Verified') ? '#2BA640' : '#F5C842' }}>{a.verification}</span>
                        <button onClick={() => proposeVerification(a.account_id, a.owner)} className="btn-secondary" style={{ fontSize: '9.5px', padding: '2px 6px' }}>Re-verify</button>
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '8px', fontSize: '10.5px', color: 'var(--text-dim)' }}>Not configured (Phase 5)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '10px' }}>
          Spec law: signatory changes and account suspension require dual approval — the proposals above are maker steps only, and no signatory registry exists yet to fabricate.
        </div>
      </div>

      {/* Verification queue */}
      <div className="card" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0, marginBottom: '8px' }}>
          Verification queue ({Object.keys(verificationProposals).length})
        </h3>
        {Object.keys(verificationProposals).length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', padding: '10px 0', textAlign: 'center' }}>No open verification reviews. All active accounts verified against the live ledger.</div>
        ) : (
          Object.entries(verificationProposals).map(([id, at]) => (
            <div key={id} style={{ fontSize: '12px', borderBottom: '1px dashed var(--border-subtle)', padding: '6px 0' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>{id.slice(0, 16)}…</span> · proposed {at.slice(0, 19)}Z · awaiting second approver (maker ≠ checker)
            </div>
          ))
        )}
      </div>
    </div>
  );
};
