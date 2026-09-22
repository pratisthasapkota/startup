export function Spinner({ text = 'Loading…' }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
      <span style={{ fontSize: 22 }}>⟳</span>
      <div className="muted small" style={{ marginTop: 8 }}>{text}</div>
    </div>
  );
}

export function SkeletonCards({ n = 8 }) {
  return (
    <div className="grid grid-products">
      {Array.from({ length: n }).map((_, i) => (
        <div className="card" key={i} style={{ overflow: 'hidden' }}>
          <div className="sk" style={{ aspectRatio: '1/1' }} />
          <div style={{ padding: 14 }}>
            <div className="sk" style={{ height: 12, width: '50%', marginBottom: 10 }} />
            <div className="sk" style={{ height: 14, width: '90%', marginBottom: 8 }} />
            <div className="sk" style={{ height: 16, width: '40%', marginBottom: 14 }} />
            <div className="sk" style={{ height: 34, borderRadius: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon = '📦', title = 'Nothing here yet', desc = '', action = null }) {
  return (
    <div className="empty-state">
      <div className="e-ico">{icon}</div>
      <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{title}</div>
      {desc && <div className="small" style={{ maxWidth: 380, margin: '0 auto' }}>{desc}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Pagination({ page = 1, pages = 1, onChange, small = false }) {
  if (pages <= 1) return null;
  const px = small ? 'btn-xs' : 'btn-sm';
  return (
    <div className="flex" style={{ justifyContent: 'center', marginTop: 24, gap: 8 }}>
      <button className={`btn btn-outline ${px}`} disabled={page <= 1} onClick={() => onChange(page - 1)}>← Prev</button>
      {Array.from({ length: pages }).map((_, i) =>
        i === 0 || i === pages - 1 || Math.abs(i + 1 - page) <= 1 ? (
          <button
            key={i}
            className={`btn ${px} ${page === i + 1 ? '' : 'btn-outline'}`}
            onClick={() => onChange(i + 1)}
          >
            {i + 1}
          </button>
        ) : i === 1 || i === pages - 2 ? (
          <span key={i} className="muted" style={{ padding: '0 4px' }}>…</span>
        ) : null
      )}
      <button className={`btn btn-outline ${px}`} disabled={page >= pages} onClick={() => onChange(page + 1)}>Next →</button>
    </div>
  );
}

export function Stat({ k, v, d, accent }) {
  return (
    <div className="stat-card">
      <div className="k">{k}</div>
      <div className="v" style={accent ? { color: accent } : undefined}>{v}</div>
      {d && <div className="d">{d}</div>}
    </div>
  );
}

export function Modal({ open, onClose, children, title, lg = false, footer }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${lg ? 'modal-lg' : ''}`}>
        {title && (
          <div className="flex-between mb-2">
            <h3 style={{ margin: 0 }}>{title}</h3>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
          </div>
        )}
        {children}
        {footer}
      </div>
    </div>
  );
}