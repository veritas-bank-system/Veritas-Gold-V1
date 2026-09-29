import React, { useMemo, useState } from 'react';
import type { FxReferenceRates, MarketRate } from '../../types';
import { ArrowLeftRight, RefreshCw, TriangleAlert } from 'lucide-react';

interface GoldFxExchangeProps {
  rates: MarketRate[];
  referenceRates: FxReferenceRates | null;
  referenceStatus: 'loading' | 'available' | 'stale' | 'unavailable';
  referenceError: string | null;
  onRefresh: () => void;
}

type Currency = 'EUR' | 'USD' | 'CHF' | 'GBP';
const CURRENCIES: Currency[] = ['EUR', 'USD', 'CHF', 'GBP'];
const currencySymbol: Record<Currency, string> = { EUR: '€', USD: '$', CHF: 'CHF ', GBP: '£' };

export const GoldFxExchange: React.FC<GoldFxExchangeProps> = ({ rates, referenceRates, referenceStatus, referenceError, onRefresh }) => {
  const [amount, setAmount] = useState('1000');
  const [fromAsset, setFromAsset] = useState<Currency>('EUR');
  const [toAsset, setToAsset] = useState<Currency>('USD');

  const fxRates = referenceRates?.rates;
  const availableCurrencies = CURRENCIES;
  const converted = useMemo(() => {
    const value = Number(amount);
    if (!Number.isFinite(value) || (fromAsset !== 'EUR' && !fxRates) || (toAsset !== 'EUR' && !fxRates)) return null;
    const fromPerEur = fromAsset === 'EUR' ? 1 : fxRates?.[fromAsset];
    const toPerEur = toAsset === 'EUR' ? 1 : fxRates?.[toAsset];
    if (!fromPerEur || !toPerEur) return null;
    return value / fromPerEur * toPerEur;
  }, [amount, fromAsset, toAsset, fxRates]);
  const goldDemoRate = rates.find((rate) => rate.symbol === 'XAU/EUR');

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <span className="pill-valid">PUBLIC REFERENCE DATA</span>
          <h1 style={{ fontSize: '25px', fontWeight: 800, color: 'var(--text-main)', marginTop: '8px' }}>FX Reference Rates & Demo Converter</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>Public EUR reference rates for demonstration and arithmetic only—not executable prices, liquidity, or payment instructions.</p>
        </div>
        <button className="btn-outline" type="button" onClick={onRefresh} disabled={referenceStatus === 'loading'}><RefreshCw size={14} /> {referenceStatus === 'loading' ? 'Refreshing…' : 'Refresh rates'}</button>
      </div>

      <section aria-label="Reference-rate source and status" className="card" style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))', gap: '12px' }}>
        <div><div className="eyebrow">Connection</div><div className="context">{referenceStatus === 'available' ? 'Connected · latest public response' : referenceStatus === 'stale' ? 'Provider unavailable · showing last successful response' : referenceStatus === 'loading' ? 'Loading public rates…' : 'Unavailable · no successful response'}</div></div>
        <div><div className="eyebrow">Provider / basis</div><div className="context">Frankfurter API · ECB reference-rate data</div></div>
        <div><div className="eyebrow">Effective date</div><div className="context">{referenceRates?.date || 'Not available'}</div></div>
        <div><div className="eyebrow">Retrieved</div><div className="context">{referenceRates ? new Date(referenceRates.retrievedAt).toLocaleString() : 'Not available'}</div></div>
        {referenceRates && <a href="https://api.frankfurter.dev/" target="_blank" rel="noreferrer" style={{ color: 'var(--cyan-primary)', fontSize: '10px', alignSelf: 'end' }}>Source: frankfurter.dev (ECB reference data) ↗</a>}
      </section>

      {(referenceStatus === 'unavailable' || referenceStatus === 'stale') && <div role="alert" style={{ display: 'flex', gap: '8px', padding: '11px 13px', background: 'rgba(127,29,29,.12)', border: '1px solid rgba(248,113,113,.3)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '11px' }}><TriangleAlert size={15} color="#f87171" />{referenceStatus === 'stale' ? `Showing the last successful public rates${referenceError ? `; latest refresh failed: ${referenceError}` : '.'}` : `Public reference rates are unavailable${referenceError ? `: ${referenceError}` : '.'} Retry when connectivity is restored.`}</div>}
      {referenceStatus === 'loading' && !referenceRates && <div role="status" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Fetching dated EUR reference rates from the public provider…</div>}

      {fxRates && (
        <section className="card" aria-label="Latest ECB reference rates">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}><h2 style={{ color: 'var(--text-main)', fontSize: '15px' }}>EUR reference rates · {referenceRates.date}</h2><span style={{ color: 'var(--text-dim)', fontSize: '10px' }}>1 EUR = quoted currency units</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '9px' }}>
            {Object.entries(fxRates).map(([currency, rate]) => <div key={currency} style={{ padding: '12px', borderRadius: '8px', background: '#100d14', border: '1px solid var(--border-subtle)' }}><div className="eyebrow">EUR / {currency}</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', marginTop: '5px' }}>{rate.toFixed(4)}</div></div>)}
          </div>
        </section>
      )}

      <section className="card" style={{ maxWidth: '720px', width: '100%', margin: '0 auto' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 750, color: 'var(--text-main)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}><ArrowLeftRight size={17} color="var(--red-primary)" /> Indicative currency converter</h2>
        <p style={{ color: 'var(--text-dim)', fontSize: '10px', marginBottom: '14px' }}>No spread, fee, execution, or settlement is included. Reference values may be delayed and are not a bank quote.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(110px, 1fr)', gap: '10px' }}>
          <label style={{ color: 'var(--text-dim)', fontSize: '10px' }}>AMOUNT<input type="number" min="0" step="any" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} className="input-dark" style={{ marginTop: '4px', width: '100%' }} /></label>
          <label style={{ color: 'var(--text-dim)', fontSize: '10px' }}>FROM<select value={fromAsset} onChange={(event) => setFromAsset(event.target.value as Currency)} className="input-dark" style={{ marginTop: '4px', width: '100%' }}>{availableCurrencies.map((currency) => <option key={currency} disabled={currency !== 'EUR' && !fxRates}>{currency}{currency !== 'EUR' && !fxRates ? ' · rates unavailable' : ''}</option>)}</select></label>
          <label style={{ color: 'var(--text-dim)', fontSize: '10px' }}>INDICATIVE CONVERSION<div aria-live="polite" style={{ background: '#0b0910', padding: '10px 12px', marginTop: '4px', minHeight: '42px', borderRadius: '6px', color: 'var(--text-main)', fontSize: '17px', fontWeight: 800 }}>{converted === null ? 'Reference data unavailable' : `${currencySymbol[toAsset]}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${toAsset}`}</div></label>
          <label style={{ color: 'var(--text-dim)', fontSize: '10px' }}>TO<select value={toAsset} onChange={(event) => setToAsset(event.target.value as Currency)} className="input-dark" style={{ marginTop: '4px', width: '100%' }}>{availableCurrencies.map((currency) => <option key={currency} disabled={currency !== 'EUR' && !fxRates}>{currency}{currency !== 'EUR' && !fxRates ? ' · rates unavailable' : ''}</option>)}</select></label>
        </div>
      </section>

      <section className="card" style={{ borderColor: 'rgba(245,158,11,.3)' }}>
        <h2 style={{ fontSize: '14px', color: 'var(--text-main)', marginBottom: '6px' }}>Gold / market data is not connected</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '11px', lineHeight: 1.55 }}>{goldDemoRate ? `${goldDemoRate.name}: €${goldDemoRate.price_eur} EUR / $${goldDemoRate.price_usd} USD. ` : ''}This value is a local demo fixture, not a live gold quote. No gold market API, vault attestation, backing verification, or trade execution is connected here.</p>
      </section>

      <style>{`.eyebrow{font-size:9px;color:var(--text-dim);text-transform:uppercase;letter-spacing:.06em}.context{font-size:11px;color:var(--text-main);font-weight:700;margin-top:4px}`}</style>
    </div>
  );
};
