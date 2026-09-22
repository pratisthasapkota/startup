'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Stat, Spinner, Pagination, EmptyState } from '@/components/ui';
import { formatDate } from '@/lib/format';

const LEVELS = ['', 'info', 'warn', 'error', 'security'];

export default function AdminSecurity() {
  const [ov, setOv] = useState(null);
  const [logs, setLogs] = useState(null);
  const [level, setLevel] = useState('security');
  const [page, setPage] = useState(1);

  useEffect(() => {
    api('/admin/security').then(setOv).catch(() => setOv(false));
  }, []);

  useEffect(() => {
    setLogs(null);
    const p = new URLSearchParams({ page: String(page), limit: '40' });
    if (level) p.set('level', level);
    api(`/admin/audit-logs?${p.toString()}`).then(setLogs).catch(() => setLogs([]));
  }, [level, page]);

  const counts = ov?.data?.byLevel || {};
  const totalEvents = counts.info || counts.warn || counts.error || counts.security || 0;

  if (ov === null) return <Spinner text="Scanning security posture…" />;

  return (
    <div>
      <div className="admin-head">
        <h1>Security & audit</h1>
        <span className="small muted">Intrusion detection · brute-force protection · audit trail</span>
      </div>

      <div className="stat-cards">
        <Stat k="Security events (7d)" v={counts.security || 0} accent="var(--danger)" d="Attempted SQLi, XSS, NoSQL injection…" />
        <Stat k="Warnings / errors" v={(counts.warn || 0) + (counts.error || 0)} />
        <Stat k="Locked accounts" v={ov.data.totals.lockedAccounts} accent={ov.data.totals.lockedAccounts ? 'var(--warn)' : undefined} d="Brute-force locks, auto reset in 15 min" />
        <Stat k="Event level split" v={totalEvents} d={`${counts.info || 0} info · ${counts.warn || 0} warn · ${counts.error || 0} error`} />
      </div>

      {/* Threats */}
      <div className="card mt-3">
        <div className="card-pad" style={{ borderBottom: '1px solid var(--line)' }}>
          <b>Top threat signatures detected</b>
        </div>
        {!ov.data.topThreats.length ? <div className="card-pad small muted">No attack signatures hit this week — nice and clean. 🎉</div> : (
          <div className="table-wrap" style={{ border: 'none' }}>
            <table className="tbl">
              <thead><tr><th>Signature</th><th>Count</th></tr></thead>
              <tbody>
                {ov.data.topThreats.map((t) => (
                  <tr key={t._id}><td><span className="monospace">{t._id.replace('attack_', 'ATTACK · ')}</span> <span className="badge badge-danger">blocked</span></td><td>{t.count}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent security events */}
      <div className="grid mt-3" style={{ gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div className="card">
          <div className="card-pad" style={{ borderBottom: '1px solid var(--line)' }}><b>Recent security events</b></div>
          {!ov.data.recentSecurity.length ? <div className="card-pad small muted">No security events recorded yet.</div> : ov.data.recentSecurity.map((e) => (
            <div key={e._id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--line)' }}>
              <div className="flex-between">
                <span className="monospace small" style={{ color: 'var(--danger)' }}>{e.action}</span>
                <span className="small muted">{formatDate(e.createdAt)}</span>
              </div>
              <div className="small muted">{e.ip || '?'} · {e.method} {e.path}</div>
            </div>
          ))}
        </div>

        {/* Audit log */}
        <div className="card">
          <div className="card-pad flex-between" style={{ borderBottom: '1px solid var(--line)' }}>
            <b>Audit trail</b>
            <div className="seg">
              {LEVELS.map((l) => <button key={l || 'all'} className={level === l ? 'on' : ''} onClick={() => { setLevel(l); setPage(1); }}>{l || 'all'}</button>)}
            </div>
          </div>
          {!logs ? <Spinner /> : logs.data.length === 0 ? <div className="card-pad small muted">No log entries.</div> : logs.data.map((e) => (
            <div key={e._id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--line)' }}>
              <div className="flex-between">
                <span className={`badge ${e.level === 'security' ? 'badge-danger' : e.level === 'error' ? 'badge-danger' : e.level === 'warn' ? 'badge-warn' : 'badge-info'}`}>{e.level}</span>
                <b className="small">{e.action}</b>
              </div>
              <div className="small muted mt-1">{e.actorEmail || 'guest'} · {e.ip || '?'} · {e.method} {e.path}</div>
              <div className="small muted" style={{ fontSize: 11 }}>{formatDate(e.createdAt)}</div>
            </div>
          ))}
        </div>
      </div>

      {logs?.pagination && <Pagination page={logs.pagination.page} pages={logs.pagination.pages} onChange={setPage} small />}

      <div className="card card-pad mt-3">
        <b>How VoltMart protects itself</b>
        <div className="small muted mt-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <div>✓ Helmet security headers & no click-jacking</div>
          <div>✓ Rate limiting on all endpoints + strict auth limits</div>
          <div>✓ bcrypt-hashed passwords (12 rounds)</div>
          <div>✓ JWT access/refresh tokens, httpOnly refresh cookie</div>
          <div>✓ Account lockout after 5 failed logins (15 min)</div>
          <div>✓ NoSQL-injection stripping on all input</div>
          <div>✓ XSS sanitisation with xss package</div>
          <div>✓ Lightweight IDS logging SQLi/XSS/path-traversal/command-injection probes</div>
          <div>✓ CORS locked to storefront origin</div>
          <div>✓ Full audit trail of admin & user actions</div>
        </div>
      </div>
    </div>
  );
}