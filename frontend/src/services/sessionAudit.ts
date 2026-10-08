/**
 * In-session client audit trail for the Common Page Contract.
 *
 * Scope and honesty rules:
 * - Records ONLY events that genuinely happened in this browser session
 *   (sign-in, persona switch, evidence export, unmask audit attempts).
 * - Every record carries a SHA-256 evidence hash over its canonical fields,
 *   so tampering with persisted copies is detectable.
 * - This is NOT the server audit trail (P3 backlog): views built on it must
 *   label it as in-session client evidence, never as ledger-side history.
 */

export interface SessionAuditEvent {
  seq: number;
  timestamp: number;
  actor: string;
  effectiveRole: string;
  institution: string;
  action: string;
  object: string;
  environment: string;
  device: string;
  sessionId: string;
  result: 'Success' | 'Failure';
  reason: string | null;
  approvalReference: string | null;
  evidenceHash: string;
}

const STORAGE_KEY = 'veritas-session-audit';
const SESSION_ID_KEY = 'veritas-session-id';
const MAX_EVENTS = 200;

function ensureSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;
    const id = `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(SESSION_ID_KEY, id);
    return id;
  } catch {
    return 'sess-unavailable';
  }
}

export function currentSessionId(): string {
  return ensureSessionId();
}

function deviceClass(): string {
  const w = window.innerWidth;
  const cls = w < 768 ? 'Mobile' : w < 1200 ? 'Tablet' : 'Workstation';
  const ua = navigator.userAgent;
  const brand = /Firefox/i.test(ua) ? 'Firefox' : /Edg/i.test(ua) ? 'Edge' : /Chrome/i.test(ua) ? 'Chromium' : /Safari/i.test(ua) ? 'WebKit' : 'Browser';
  return `${cls} · ${brand}`;
}

async function sha256Hex(input: string): Promise<string> {
  try {
    const bytes = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // WebCrypto unavailable (e.g. insecure context): the record stays but the
    // hash field must not pretend to be a digest.
    return 'UNHASHED-CLIENT-RECORD';
  }
}

function readEvents(): SessionAuditEvent[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SessionAuditEvent[]) : [];
  } catch {
    return [];
  }
}

function writeEvents(events: SessionAuditEvent[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(0, MAX_EVENTS)));
  } catch {
    /* storage unavailable — events stay in memory for this render only */
  }
}

export interface SessionAuditInput {
  actor: string;
  effectiveRole: string;
  institution: string;
  action: string;
  object: string;
  environment: string;
  result?: 'Success' | 'Failure';
  reason?: string | null;
  approvalReference?: string | null;
}

/** Record one genuine in-session event. Fire-and-forget safe: the hash is
 *  computed asynchronously and the persisted list is rewritten once ready. */
export function recordSessionEvent(input: SessionAuditInput): void {
  const events = readEvents();
  const seq = events.length > 0 ? events[0].seq + 1 : 1;
  const event: SessionAuditEvent = {
    seq,
    timestamp: Date.now(),
    actor: input.actor,
    effectiveRole: input.effectiveRole,
    institution: input.institution,
    action: input.action,
    object: input.object,
    environment: input.environment,
    device: deviceClass(),
    sessionId: ensureSessionId(),
    result: input.result ?? 'Success',
    reason: input.reason ?? null,
    approvalReference: input.approvalReference ?? null,
    evidenceHash: '',
  };

  const canonical = JSON.stringify({
    seq: event.seq,
    timestamp: event.timestamp,
    actor: event.actor,
    effectiveRole: event.effectiveRole,
    institution: event.institution,
    action: event.action,
    object: event.object,
    environment: event.environment,
    device: event.device,
    sessionId: event.sessionId,
    result: event.result,
    reason: event.reason,
    approvalReference: event.approvalReference,
  });

  void sha256Hex(canonical).then((hash) => {
    const withHash: SessionAuditEvent = { ...event, evidenceHash: hash };
    const current = readEvents().filter((e) => !(e.seq === withHash.seq && e.timestamp === withHash.timestamp));
    writeEvents([withHash, ...current]);
  });
}

export function getSessionEvents(): SessionAuditEvent[] {
  return readEvents();
}
