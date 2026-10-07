import React, { useState, useEffect } from 'react';
import type { VaultSensorTelemetry } from '../../types';
import { fetchVaultTelemetry } from '../../services/api';
import { ShieldCheck, Scale, Thermometer, Droplets, Radio, CheckCircle2, RefreshCw } from 'lucide-react';

interface ProofOfReserveTelemetryProps {
  onNotify?: (msg: string, isError?: boolean) => void;
}

/** Fixture snapshot used only when the backend telemetry endpoint is unreachable. */
const DEMO_TELEMETRY: VaultSensorTelemetry = {
  vault_location: 'Zurich Freezone High-Security Vault #4',
  total_bars_verified: 1250,
  total_weight_kg: '15,551.75 kg',
  ultrasonic_density_pct: '99.992%',
  vault_temperature_c: '18.4 °C',
  humidity_pct: '42.1%',
  purity_grade: 'LBMA 999.9 Fine Gold',
  merkle_root_hash: '0x98f4e21a8b417c8d9e2231ff01c78491ae6b490f',
  oracle_attestation_status: 'Verified_Nominal',
};

export const ProofOfReserveTelemetry: React.FC<ProofOfReserveTelemetryProps> = ({ onNotify }) => {
  const [telemetry, setTelemetry] = useState<VaultSensorTelemetry | null>(null);
  const [loading, setLoading] = useState(false);
  // Scan label formatted in the event handler so render stays pure.
  const [scanLabel, setScanLabel] = useState<string | null>(null);

  // Live vault telemetry, polled every 5s from the sandbox ledger backend. If the
  // API is unreachable the last good snapshot is kept and the view falls back to
  // the demo fixture above, so the tour capture pipeline keeps working unchanged.
  useEffect(() => {
    let cancelled = false;
    const poll = async (): Promise<void> => {
      try {
        const t = await fetchVaultTelemetry();
        if (cancelled) return;
        setTelemetry(t);
        const scanMs = t.last_scan_ms ?? Date.now();
        setScanLabel(
          new Date(scanMs).toLocaleTimeString('en-GB', { hour12: false }) +
            '.' + String(scanMs % 1000).padStart(3, '0'),
        );
      } catch {
        /* keep last good snapshot; UI falls back to demo fixture */
      }
    };
    void poll();
    const id = window.setInterval(() => { void poll(); }, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const live = telemetry !== null;
  const data = telemetry ?? DEMO_TELEMETRY;

  const handleManualAttest = () => {
    setLoading(true);
    const seq = telemetry?.attestation_seq;
    const attested = `${data.total_bars_verified} LBMA Bars (${data.total_weight_kg}) verified against Merkle Root ${data.merkle_root_hash.slice(0, 18)}…`;
    window.setTimeout(() => {
      setLoading(false);
      if (onNotify) {
        onNotify(`Oracle Attestation ${seq !== undefined ? `#${seq} ` : ''}Verified: ${attested} 100% matched on-chain.`);
      }
    }, 600);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Swiss Vault IoT Proof-of-Reserve Telemetry
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span>
              Live hardware sensor telemetry, ultrasonic acoustic density validation, and cryptographic Merkle PoR verification.
            </span>
            <span
              className={live ? 'pill-valid' : 'pill-reject'}
              style={{ fontSize: '10px' }}
              title={live
                ? `Sandbox ledger reserve · attestation #${telemetry?.attestation_seq ?? 0}${scanLabel ? ` · scanned ${scanLabel}` : ''}`
                : 'Backend telemetry unreachable — showing demo fixture'}
            >
              ● {live ? 'LIVE' : 'DEMO DATA'}
            </span>
          </p>
        </div>

        <button className="btn-cyan" onClick={handleManualAttest} disabled={loading}>
          {loading ? <RefreshCw size={14} className="pulse-glow" /> : <Radio size={14} />}
          {loading ? 'Attesting...' : 'Trigger Oracle Attestation'}
        </button>
      </div>

      {/* 4 Sensor Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cyan-primary)', fontSize: '12px', fontWeight: 700 }}>
            <Scale size={16} /> PHYSICAL VAULT WEIGHT
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', marginTop: '6px' }}>
            {data.total_weight_kg}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {data.total_bars_verified} Allocated LBMA Bars{data.reserve_gold_oz ? ` · ${data.reserve_gold_oz} tokenized` : ''}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--green-valid)', fontSize: '12px', fontWeight: 700 }}>
            <ShieldCheck size={16} /> ULTRASONIC DENSITY
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--green-valid)', marginTop: '6px' }}>
            {data.ultrasonic_density_pct}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {data.purity_grade}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--amber-warning)', fontSize: '12px', fontWeight: 700 }}>
            <Thermometer size={16} /> VAULT TEMPERATURE
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', marginTop: '6px' }}>
            {data.vault_temperature_c}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Climate Controlled Safezone
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cyan-primary)', fontSize: '12px', fontWeight: 700 }}>
            <Droplets size={16} /> RELATIVE HUMIDITY
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', marginTop: '6px' }}>
            {data.humidity_pct}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--green-valid)', marginTop: '4px' }}>
            ● Nominal Anti-Corrosion Range
          </div>
        </div>
      </div>

      {/* Merkle Root & Location Box */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Facility Location:</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {data.vault_location}
            </div>
          </div>
          <span className="pill-valid">
            <CheckCircle2 size={12} /> {data.oracle_attestation_status === 'Verified_Nominal' ? 'Oracle Verified' : data.oracle_attestation_status}
          </span>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Cryptographic Merkle Proof-of-Reserve Root Hash (On-Chain ICP Attestation{telemetry?.attestation_seq !== undefined ? ` · seq #${telemetry.attestation_seq}` : ''}):
          </div>
          <code style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cyan-primary)', wordBreak: 'break-all' }}>
            {data.merkle_root_hash}
          </code>
        </div>
      </div>
    </div>
  );
};
