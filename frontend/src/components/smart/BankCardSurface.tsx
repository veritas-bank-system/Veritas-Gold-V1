import React, { useMemo, useState } from 'react';
import type { DemandDepositRecord } from '../../types';
import { transferCash } from '../../services/api';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CircleHelp,
  Landmark,
  RefreshCw,
  Search,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react';

interface BankCardSurfaceProps {
  accounts: DemandDepositRecord[];
  accountDataStatus: 'loading' | 'available' | 'stale' | 'unavailable';
  accountsFetchedAt: number | null;
  sessionPersona: string;
  sessionInstitution: string;
  selectedInstitutionProfile: string;
  selectedEnvironment: string;
  onRefresh: () => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

type AccountStatus = 'Active' | 'Suspended' | 'Closed';
type StatusFilter = 'All statuses' | AccountStatus;

const asNumber = (value?: string) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getStatus = (status: DemandDepositRecord['status']): AccountStatus => {
  if (status === 'Active') return 'Active';
  if ('Suspended' in status) return 'Suspended';
  return 'Closed';
};

const formatAmount = (value: number, currency: string) => {
  const amount = new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
  return `${value < 0 ? '−' : ''}${amount} ${currency}`;
};

const shortPrincipal = (principal: string) =>
  principal.length > 18 ? `${principal.slice(0, 10)}…${principal.slice(-5)}` : principal;

const updatedLabel = (timestamp: number) => {
  // Demo genesis records use tiny placeholder timestamps, not real-world dates.
  if (timestamp < 1_000_000_000_000) return 'Demo seed record';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
};

export const BankCardSurface: React.FC<BankCardSurfaceProps> = ({
  accounts,
  accountDataStatus,
  accountsFetchedAt,
  sessionPersona,
  sessionInstitution,
  selectedInstitutionProfile,
  selectedEnvironment,
  onRefresh,
  onNotify,
}) => {
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [senderId, setSenderId] = useState(accounts[0]?.account_id || '');
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All statuses');
  const [submitting, setSubmitting] = useState(false);

  const selectedAccount = accounts.find((account) => account.account_id === senderId);
  const selectedBalance = asNumber(selectedAccount?.balance.value_str);
  const selectedCredit = asNumber(selectedAccount?.overdraft_limit.value_str);
  const selectedHeadroom = Math.max(0, selectedBalance + selectedCredit);
  const selectedDailyLimit = asNumber(selectedAccount?.daily_transfer_limit.value_str);
  const selectedDailyUsed = asNumber(selectedAccount?.accumulated_daily_debit.value_str);
  const selectedDailyRemaining = Math.max(0, selectedDailyLimit - selectedDailyUsed);
  const transferAmount = Number(amount);
  const sameAccount = senderId !== '' && senderId === recipientId;
  const exceedsHeadroom = Number.isFinite(transferAmount) && transferAmount > selectedHeadroom;
  const exceedsDailyLimit = Number.isFinite(transferAmount) && transferAmount > selectedDailyRemaining;
  const invalidTransfer = !Number.isFinite(transferAmount) || transferAmount <= 0 || sameAccount || exceedsHeadroom || exceedsDailyLimit;

  const currencySummaries = useMemo(() => {
    const grouped = new Map<string, { settled: number; credit: number; count: number }>();
    accounts.forEach((account) => {
      const current = grouped.get(account.currency) || { settled: 0, credit: 0, count: 0 };
      current.settled += asNumber(account.balance.value_str);
      current.credit += asNumber(account.overdraft_limit.value_str);
      current.count += 1;
      grouped.set(account.currency, current);
    });
    return [...grouped.entries()].map(([currency, values]) => ({ currency, ...values }));
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return accounts.filter((account) => {
      const status = getStatus(account.status);
      const matchesStatus = statusFilter === 'All statuses' || status === statusFilter;
      const matchesQuery = !query || [
        account.account_id,
        account.currency,
        account.owner,
        account.custodian,
        status,
      ].some((value) => value.toLowerCase().includes(query));
      return matchesStatus && matchesQuery;
    });
  }, [accounts, search, statusFilter]);

  const openTransfer = (accountId?: string) => {
    const initialSender = accountId || accounts.find((account) => getStatus(account.status) === 'Active')?.account_id || '';
    setSenderId(initialSender);
    setRecipientId(accounts.find((account) => account.account_id !== initialSender && getStatus(account.status) === 'Active')?.account_id || '');
    setAmount('');
    setMemo('');
    setShowTransferModal(true);
  };

  const handleTransfer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (accountDataStatus !== 'available') {
      onNotify('Account data must be available and current before recording a sandbox transfer.', true);
      return;
    }
    if (!selectedAccount || !recipientId || invalidTransfer) {
      onNotify('Check the source, destination, amount, available credit and remaining daily limit.', true);
      return;
    }
    if (getStatus(selectedAccount.status) !== 'Active') {
      onNotify('Only active accounts can initiate a sandbox transfer.', true);
      return;
    }

    setSubmitting(true);
    try {
      const result = await transferCash({
        sender_id: senderId,
        recipient_id: recipientId,
        amount: transferAmount.toFixed(2),
        memo: memo.trim() || 'Sandbox settlement transfer',
        gl_code: '1010-01',
      });
      onNotify(`Sandbox ledger transfer recorded. Reference: ${result.txn_id || result.protocol_id}`);
      setShowTransferModal(false);
      onRefresh();
    } catch (error) {
      onNotify(error instanceof Error ? error.message : 'Sandbox transfer could not be recorded.', true);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#0b0910',
    border: '1px solid var(--border-subtle)',
    borderRadius: '7px',
    color: 'var(--text-main)',
    padding: '10px 12px',
    fontSize: '12px',
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '6px' }}>
            <Landmark size={21} color="var(--red-primary)" />
            <span style={{ fontSize: '10px', letterSpacing: '0.09em', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase' }}>
              Accounts & Cash · Operator View
            </span>
          </div>
          <h1 style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Settlement Accounts & Liquidity
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Review account balances, approved credit facilities and transfer-limit headroom.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn-outline" onClick={onRefresh} disabled={accountDataStatus === 'loading'}>
            <RefreshCw size={14} /> {accountDataStatus === 'loading' ? 'Loading accounts…' : 'Refresh accounts'}
          </button>
          <button className="btn-cyan" onClick={() => openTransfer()} disabled={accountDataStatus !== 'available' || accounts.filter((account) => getStatus(account.status) === 'Active').length < 2} title={accounts.filter((account) => getStatus(account.status) === 'Active').length < 2 ? 'Requires at least two active demo accounts' : 'Create a sandbox ledger transfer'}>
            <ArrowLeftRight size={15} /> New Sandbox Transfer
          </button>
        </div>
      </div>

      <div role="note" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', border: '1px solid rgba(245,158,11,.35)', borderRadius: '8px', background: 'rgba(245,158,11,.08)' }}>
        <AlertCircle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '1px' }} />
        <div style={{ fontSize: '11.5px', lineHeight: 1.55, color: 'var(--text-muted)' }}>
          <strong style={{ color: '#fbbf24' }}>Sandbox ledger — simulated records only.</strong> This showcase has no live central-bank money, RTGS/SWIFT connection or production account mandates. Account results come from the shared demo API and are not filtered or mapped to the selected institution. Reserved, blocked and pending-settlement amounts are not supplied by the current account service.
        </div>
      </div>

      <section aria-label="Account data context" className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))', gap: '14px', padding: '14px 16px' }}>
        <div><div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Session role</div><div style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 700, marginTop: '4px' }}>{sessionPersona}</div></div>
        <div><div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Persona institution</div><div style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 700, marginTop: '4px' }}>{sessionInstitution}</div></div>
        <div><div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Selected participant profile</div><div style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 700, marginTop: '4px' }}>{selectedInstitutionProfile}</div></div>
        <div><div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Selected environment</div><div style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 700, marginTop: '4px' }}>{selectedEnvironment} · API remains local sandbox</div></div>
        <div><div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Account source / scope</div><div style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 700, marginTop: '4px' }}>Shared demo API · not institution-scoped</div></div>
        <div><div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Last successful account response</div><div style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 700, marginTop: '4px' }}>{accountsFetchedAt ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(accountsFetchedAt) : 'No successful response yet'}</div></div>
      </section>

      {accountDataStatus !== 'available' && (
        <div role={accountDataStatus === 'unavailable' || accountDataStatus === 'stale' ? 'alert' : 'status'} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', padding: '11px 13px', borderRadius: '8px', border: `1px solid ${accountDataStatus === 'unavailable' || accountDataStatus === 'stale' ? 'rgba(248,113,113,.35)' : 'rgba(34,211,238,.3)'}`, background: accountDataStatus === 'unavailable' || accountDataStatus === 'stale' ? 'rgba(127,29,29,.12)' : 'rgba(8,145,178,.08)', color: 'var(--text-muted)', fontSize: '11px', lineHeight: 1.5 }}>
          {accountDataStatus === 'loading' ? <RefreshCw size={14} /> : <AlertCircle size={14} color="#f87171" />}
          <div>
            {accountDataStatus === 'loading' && 'Loading account records from the shared demo API…'}
            {accountDataStatus === 'unavailable' && <>Account records are unavailable: no successful response has been received. This is not a confirmed empty account list. <button type="button" onClick={onRefresh} style={{ color: '#fca5a5', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', cursor: 'pointer' }}>Retry</button></>}
            {accountDataStatus === 'stale' && <>The account service could not be reached. Showing the last successfully loaded response{accountsFetchedAt ? ` from ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(accountsFetchedAt)}` : ''}; values may be stale. <button type="button" onClick={onRefresh} style={{ color: '#fca5a5', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', cursor: 'pointer' }}>Retry</button></>}
          </div>
        </div>
      )}

      <section aria-label="Settlement liquidity summary" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 750, color: 'var(--text-main)' }}>Liquidity by settlement currency</h2>
          <span style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>{accountDataStatus === 'available' ? `${accounts.length} account${accounts.length === 1 ? '' : 's'}` : 'Account count unconfirmed'} · totals are not combined across currencies</span>
        </div>
        {currencySummaries.length === 0 ? (
          <div className="card" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
            {accountDataStatus === 'loading' ? 'Waiting for the account service response.' : accountDataStatus === 'unavailable' ? 'Account availability is unknown because the service has not returned a response.' : accountDataStatus === 'stale' ? 'No cached account records are available; the latest service request failed.' : 'The shared demo account API returned no account records. This does not establish that the selected institution has no accounts.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '12px' }}>
            {currencySummaries.map(({ currency, settled, credit, count }) => (
              <article key={currency} className="card" style={{ padding: '16px 18px', borderTop: '2px solid var(--red-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em' }}>Settled funds · {currency}</div>
                  <span className="pill-cyan" style={{ fontSize: '9px' }}>{count} account{count === 1 ? '' : 's'}</span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 850, color: 'var(--text-main)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>{formatAmount(settled, currency)}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid var(--border-subtle)', marginTop: '14px', paddingTop: '12px' }}>
                  <div>
                    <div style={{ fontSize: '9.5px', color: 'var(--text-dim)' }}>Approved credit facilities</div>
                    <div style={{ fontSize: '12px', color: 'var(--cyan-primary)', fontWeight: 750, marginTop: '3px' }}>{formatAmount(credit, currency)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9.5px', color: 'var(--text-dim)' }}>Indicative ceiling*</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 750, marginTop: '3px' }}>{formatAmount(settled + credit, currency)}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        <div style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <CircleHelp size={12} /> *Settled funds plus approved overdraft, before reservations or other settlement controls; not a statement of spendable cash.
        </div>
      </section>

      <section aria-label="Settlement account register" className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <Wallet size={18} color="var(--red-primary)" />
            <div>
              <h2 style={{ fontSize: '15.5px', fontWeight: 750, color: 'var(--text-main)' }}>Account register</h2>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>Balances, facility usage and daily transfer capacity</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <label style={{ position: 'relative', minWidth: '210px' }}>
              <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '11px' }} />
              <input aria-label="Search accounts" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ID, owner, currency…" style={{ ...inputStyle, paddingLeft: '31px' }} />
            </label>
            <select aria-label="Filter account status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} style={{ ...inputStyle, width: 'auto', minWidth: '138px' }}>
              <option>All statuses</option>
              <option>Active</option>
              <option>Suspended</option>
              <option>Closed</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table style={{ width: '100%', minWidth: '1080px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#09101f', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '9.5px', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Account / participant</th>
                <th style={{ padding: '12px 16px' }}>Currency</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Settled balance</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Approved credit</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Daily transfer capacity</th>
                <th style={{ padding: '12px 16px' }}>Status / record</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => {
                const status = getStatus(account.status);
                const dailyLimit = asNumber(account.daily_transfer_limit.value_str);
                const dailyUsed = asNumber(account.accumulated_daily_debit.value_str);
                const dailyRemaining = Math.max(0, dailyLimit - dailyUsed);
                const usagePercent = dailyLimit > 0 ? Math.min(100, (dailyUsed / dailyLimit) * 100) : 0;
                const balance = asNumber(account.balance.value_str);
                const credit = asNumber(account.overdraft_limit.value_str);
                const canInitiate = accountDataStatus === 'available' && status === 'Active' && accounts.some((other) => other.account_id !== account.account_id && getStatus(other.status) === 'Active');

                return (
                  <tr key={account.account_id} style={{ borderBottom: '1px solid #191521' }}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ color: 'var(--text-main)', fontWeight: 700, fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>{account.account_id}</div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '9.5px', marginTop: '4px' }}>Owner {shortPrincipal(account.owner)} · Custodian {shortPrincipal(account.custodian)}</div>
                    </td>
                    <td style={{ padding: '13px 16px' }}><span className="pill-cyan">{account.currency}</span></td>
                    <td style={{ padding: '13px 16px', textAlign: 'right', color: 'var(--text-main)', fontWeight: 750, whiteSpace: 'nowrap' }}>{formatAmount(balance, account.currency)}</td>
                    <td style={{ padding: '13px 16px', textAlign: 'right', color: 'var(--cyan-primary)', whiteSpace: 'nowrap' }}>{formatAmount(credit, account.currency)}</td>
                    <td style={{ padding: '13px 16px', minWidth: '190px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', color: 'var(--text-main)', fontWeight: 700 }}>
                        <span>{formatAmount(dailyRemaining, account.currency)} left</span>
                        <span style={{ color: 'var(--text-dim)', fontWeight: 500 }}>{usagePercent.toFixed(0)}%</span>
                      </div>
                      <div role="progressbar" aria-label={`Daily transfer limit used for ${account.account_id}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(usagePercent)} style={{ height: '4px', borderRadius: '4px', background: '#25202d', marginTop: '7px', overflow: 'hidden' }}>
                        <div style={{ width: `${usagePercent}%`, height: '100%', background: usagePercent >= 90 ? '#ef4444' : 'var(--green-valid)' }} />
                      </div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '9px', marginTop: '4px' }}>{formatAmount(dailyUsed, account.currency)} of {formatAmount(dailyLimit, account.currency)} used</div>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span className={status === 'Active' ? 'pill-valid' : 'pill-red'} style={{ display: 'inline-flex', marginBottom: '4px' }}>
                        {status === 'Active' ? <ShieldCheck size={11} /> : <AlertCircle size={11} />} {status}
                      </span>
                      <div style={{ color: 'var(--text-dim)', fontSize: '9px' }}>{updatedLabel(account.updated_at)}</div>
                    </td>
                    <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                      <button className="btn-outline" disabled={!canInitiate} onClick={() => openTransfer(account.account_id)} title={accountDataStatus !== 'available' ? 'Current account data is required' : canInitiate ? 'Create a sandbox transfer' : 'Requires a second active account'} style={{ padding: '5px 9px', fontSize: '10px', opacity: canInitiate ? 1 : 0.5 }}>
                        <ArrowUpRight size={12} /> Transfer
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredAccounts.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {accounts.length === 0 ? accountDataStatus === 'available' ? 'The shared demo API returned an empty account list; institution-level availability is unknown.' : accountDataStatus === 'loading' ? 'Loading accounts…' : accountDataStatus === 'stale' ? 'The account service is unavailable and no cached records are available.' : 'Account availability cannot be confirmed because the account service has not responded.' : 'No accounts match the current search and status filters.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-subtle)', fontSize: '9.5px', color: 'var(--text-dim)' }}>
          Daily usage reflects the ledger record returned by the demo API; it is not a bank-wide RTGS position or final reconciliation.
        </div>
      </section>

      {showTransferModal && (
        <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) setShowTransferModal(false); }}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="transfer-modal-title" style={{ width: 'min(100%, 520px)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <h2 id="transfer-modal-title" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '5px' }}>Create sandbox transfer</h2>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>This demo submits directly to the in-memory ledger. It does not create an approval request or contact a live payment rail.</p>
              </div>
              <button type="button" className="btn-outline" aria-label="Close transfer form" onClick={() => setShowTransferModal(false)} disabled={submitting} style={{ padding: '6px' }}><X size={15} /></button>
            </div>
            <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '13px', marginTop: '16px' }}>
              <label style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 700 }}>SOURCE ACCOUNT
                <select required value={senderId} onChange={(event) => { setSenderId(event.target.value); setRecipientId(''); }} style={{ ...inputStyle, marginTop: '5px' }}>
                  <option value="">Select active account</option>
                  {accounts.filter((account) => getStatus(account.status) === 'Active').map((account) => <option key={account.account_id} value={account.account_id}>{account.account_id} · {formatAmount(asNumber(account.balance.value_str), account.currency)}</option>)}
                </select>
              </label>
              <label style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 700 }}>DESTINATION ACCOUNT
                <select required value={recipientId} onChange={(event) => setRecipientId(event.target.value)} style={{ ...inputStyle, marginTop: '5px' }}>
                  <option value="">Select another active demo account</option>
                  {accounts.filter((account) => getStatus(account.status) === 'Active' && account.account_id !== senderId).map((account) => <option key={account.account_id} value={account.account_id}>{account.account_id} · {account.currency}</option>)}
                </select>
              </label>
              <label style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 700 }}>AMOUNT ({selectedAccount?.currency || 'currency'})
                <input required type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} style={{ ...inputStyle, marginTop: '5px' }} />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#0b0910', border: '1px solid var(--border-subtle)', borderRadius: '7px', padding: '11px' }}>
                <div><div style={{ fontSize: '9px', color: 'var(--text-dim)' }}>Indicative account headroom</div><div style={{ color: 'var(--text-main)', fontWeight: 700, marginTop: '3px' }}>{selectedAccount ? formatAmount(selectedHeadroom, selectedAccount.currency) : '—'}</div></div>
                <div><div style={{ fontSize: '9px', color: 'var(--text-dim)' }}>Daily transfer remaining</div><div style={{ color: 'var(--text-main)', fontWeight: 700, marginTop: '3px' }}>{selectedAccount ? formatAmount(selectedDailyRemaining, selectedAccount.currency) : '—'}</div></div>
              </div>
              {sameAccount && <div role="alert" style={{ color: '#f87171', fontSize: '11px' }}>Source and destination accounts must be different.</div>}
              {(exceedsHeadroom || exceedsDailyLimit) && transferAmount > 0 && <div role="alert" style={{ color: '#f87171', fontSize: '11px' }}>{exceedsHeadroom ? 'Amount exceeds the account balance plus approved overdraft.' : 'Amount exceeds the remaining daily transfer limit.'}</div>}
              <label style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 700 }}>PAYMENT REFERENCE (OPTIONAL)
                <input type="text" maxLength={140} value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="Purpose / internal reference" style={{ ...inputStyle, marginTop: '5px' }} />
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '9px', marginTop: '4px' }}>
                <button type="button" className="btn-outline" onClick={() => setShowTransferModal(false)} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn-cyan" disabled={submitting || invalidTransfer || !selectedAccount || !recipientId}>
                  {submitting ? 'Recording sandbox transfer…' : <><ArrowDownLeft size={14} /> Record sandbox transfer</>}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};
