import React, { useEffect, useState } from 'react';
import { ArrowRight, CircleAlert, Shield } from 'lucide-react';
import { PulseBadge } from '../ui/motion/PulseBadge';

/** The two top-level desks of veritasbank.org. */
export type LandingDesk = 'gold' | 'full';

interface LandingSurfaceProps {
  onSelectDesk: (desk: LandingDesk) => void;
}

/** Live operational status, read from the platform's real health endpoint.
 *  The catch branch treats an unreachable endpoint as "unknown", not invented. */
interface PlatformStatus {
  checking: boolean;
  healthy: boolean | null;
  version: string | null;
}

const LandingSurfaceBase: React.FC<LandingSurfaceProps> = ({ onSelectDesk }) => {
  const [status, setStatus] = useState<PlatformStatus>({ checking: true, healthy: null, version: null });

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      // Same-origin when served by the platform binary (:8080 / reverse proxy);
      // otherwise probe the local dev backend, mirroring services/api.ts.
      const backendOrigin =
        window.location.port === '8080' || window.location.port === ''
          ? window.location.origin
          : 'http://localhost:8080';
      try {
        const res = await fetch(`${backendOrigin}/health`, { cache: 'no-store' });
        const body = (await res.json().catch(() => null)) as
          | { chain?: string; status?: string; version?: string }
          | null;
        if (cancelled) return;
        const ok = Boolean(res.ok && body && (body.status === 'healthy' || body.chain === 'icp-canister-suite'));
        setStatus({ checking: false, healthy: ok, version: body?.version ?? null });
      } catch {
        if (!cancelled) setStatus({ checking: false, healthy: null, version: null });
      }
    };
    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  const goldLive = !status.checking && status.healthy === true;
  const goldUnknown = status.checking || status.healthy === null;
  // VERITAS FULL SYSTEM is a reserved desk: a placeholder, not yet serviceable.
  const fullSystemLive = false;

  const desks: {
    desk: LandingDesk;
    title: string;
    sub: string;
    desc: string;
    cta: string;
    icon: typeof Shield;
    accent: string;
    accentSoft: string;
    border: string;
    badge: string;
    badgeVariant: 'gold' | 'green' | 'red';
    live: boolean;
    tag: string;
  }[] = [
    {
      desk: 'gold',
      title: 'VERITAS GOLD',
      sub: 'Institutional Reserve & Asset Network',
      desc: 'The live platform: reserve management, settlement, custody and policy controls backed by the running ledger.',
      cta: 'LOGIN TO VERITAS GOLD',
      icon: Shield,
      accent: 'var(--red-primary)',
      accentSoft: 'rgba(239, 68, 68, 0.14)',
      border: 'var(--border-red)',
      badge: goldLive ? 'LIVE' : goldUnknown ? 'CONNECTING' : 'OFFLINE',
      badgeVariant: goldLive ? 'green' : 'red',
      live: goldLive,
      tag: 'Reserve · Monetary · Settlement Operations',
    },
    {
      desk: 'full',
      title: 'VERITAS FULL SYSTEM',
      sub: 'Total Sovereign Banking Platform',
      desc: 'All Veritas programmes on one desk — reserve, banking, payments, markets and supervision. Reserved for a later release.',
      cta: 'COMING SOON',
      icon: CircleAlert,
      accent: '#F5C842',
      accentSoft: 'rgba(245, 200, 66, 0.12)',
      border: 'rgba(245, 200, 66, 0.4)',
      badge: 'RESERVED',
      badgeVariant: 'gold',
      live: fullSystemLive,
      tag: 'Phase II · Integration Pending',
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#060608',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Ambient glows — Veritas identity */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '20%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          right: '15%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245, 200, 66, 0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Brand header */}
      <div className="fade-in" style={{ textAlign: 'center', marginBottom: '26px', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '11px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid var(--border-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--red-primary)',
              boxShadow: '0 0 15px var(--red-glow)',
            }}
          >
            <Shield size={24} />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
            VERITAS <span style={{ color: 'var(--red-primary)', textShadow: '0 0 12px var(--red-glow)' }}>CORE</span>
          </h1>
        </div>
        <div
          style={{
            fontSize: '12.5px',
            color: 'var(--text-muted)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          veritasbank.org · Sovereign Banking Platform
        </div>
      </div>

      {/* LOGIN hero */}
      <div className="fade-in" style={{ zIndex: 10, textAlign: 'center', marginBottom: '10px' }}>
        <div
          style={{
            fontSize: '58px',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            margin: 0,
            color: '#FFFFFF',
          }}
        >
          LOGIN
        </div>
        <div style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '10px', maxWidth: '560px', lineHeight: 1.6 }}>
          Select the desk you are admitted to. Veritas Gold is live; the Full System desk is reserved.
        </div>
      </div>

      {/* Desk cards — the two rectangles */}
      <div
        className="fade-in"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 460px))',
          gap: '22px',
          zIndex: 10,
          width: '100%',
          maxWidth: '980px',
          justifyContent: 'center',
          marginTop: '30px',
        }}
      >
        {desks.map((desk) => {
          const Icon = desk.icon;
          const disabled = desk.desk === 'full';
          return (
            <button
              key={desk.desk}
              onClick={() => onSelectDesk(desk.desk)}
              disabled={disabled}
              className="card-interactive"
              style={{
                textAlign: 'left',
                backgroundColor: '#0c0a10',
                border: `1px solid ${desk.border}`,
                borderRadius: '16px',
                padding: '26px 26px 22px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                color: disabled ? 'var(--text-muted)' : '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                opacity: disabled ? 0.78 : 1,
              }}
              onMouseEnter={(e) => {
                if (disabled) return;
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = `0 24px 60px rgba(0,0,0,0.85), 0 0 24px ${desk.accentSoft}`;
              }}
              onMouseLeave={(e) => {
                if (disabled) return;
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.8)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '11px',
                    backgroundColor: desk.accentSoft,
                    border: `1px solid ${desk.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: disabled ? 'var(--text-dim)' : desk.accent,
                    boxShadow: `0 0 15px ${desk.accentSoft}`,
                  }}
                >
                  <Icon size={24} />
                </div>
                <PulseBadge label={desk.badge} variant={desk.badgeVariant} />
              </div>

              <div>
                <div
                  style={{
                    fontSize: '22px',
                    fontWeight: 900,
                    letterSpacing: '-0.01em',
                    color: disabled ? 'var(--text-muted)' : '#FFFFFF',
                  }}
                >
                  {desk.title}
                </div>
                <div style={{ fontSize: '12.5px', color: disabled ? 'var(--text-dim)' : desk.accent, fontWeight: 700, marginTop: '3px' }}>
                  {desk.sub}
                </div>
              </div>

              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>{desk.desc}</p>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', fontSize: '10.5px', color: 'var(--text-dim)', fontWeight: 600 }}>
                {desk.tag}
              </div>

              <div
                style={{
                  marginTop: '2px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: disabled ? 'rgba(245, 200, 66, 0.06)' : desk.accentSoft,
                  border: `1px solid ${disabled ? 'rgba(245, 200, 66, 0.25)' : desk.border}`,
                  color: disabled ? 'var(--text-dim)' : '#FFFFFF',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  letterSpacing: '0.02em',
                }}
              >
                {desk.cta}
                {!disabled && <ArrowRight size={16} color={desk.accent} />}
              </div>

              <div style={{ fontSize: '9.5px', color: 'var(--text-dim)', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                {desk.desk === 'full'
                  ? 'Not serviceable yet'
                  : status.checking
                    ? 'Checking backend…'
                    : status.healthy
                      ? 'Backend healthy'
                      : 'Backend unreachable'}
              </div>
            </button>
          );
        })}
      </div>

      <div
        style={{
          marginTop: '30px',
          fontSize: '11px',
          color: 'var(--text-dim)',
          zIndex: 10,
          textAlign: 'center',
          maxWidth: '640px',
          lineHeight: 1.6,
        }}
      >
        Admission is identity-scoped. Veritas Gold and the Full System desk share the same settlement, custody and audit
        fabric — access rules, approvals and data scope follow your credentials.
      </div>
    </div>
  );
};

export const LandingSurface = LandingSurfaceBase;
