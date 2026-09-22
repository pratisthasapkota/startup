'use client';

import { useEffect, useState } from 'react';
import { api, fmtError } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { formatDate } from '@/lib/format';
import { Spinner, EmptyState } from '@/components/ui';

export default function AdminReviews() {
  const { toast } = useApp();
  const [reviews, setReviews] = useState(null);

  const load = () => {
    api('/admin/reviews').then((r) => setReviews(r.data)).catch(() => setReviews([]));
  };
  useEffect(() => { load(); }, []);

  const update = async (r, body) => {
    try {
      await api(`/admin/reviews/${r._id}`, { method: 'PATCH', body });
      toast('Review updated', 'success');
      load();
    } catch (err) { toast(fmtError(err), 'error'); }
  };

  const reply = (r) => {
    const text = window.prompt('Admin reply (shown publicly under the review):', r.adminReply || '');
    if (text !== null) update(r, { adminReply: text });
  };

  const del = async (r) => {
    if (!window.confirm('Permanently delete this review? This cannot be undone.')) return;
    try {
      await api(`/admin/reviews/${r._id}`, { method: 'DELETE' });
      toast('Review deleted', 'success');
      load();
    } catch (err) { toast(fmtError(err), 'error'); }
  };

  return (
    <div>
      <div className="admin-head"><h1>Reviews</h1><span className="small muted">Moderate visibility and reply to customers</span></div>
      {!reviews ? <Spinner /> : reviews.length === 0 ? <EmptyState icon="⭐" title="No reviews yet" /> : (
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>User</th><th>Product</th><th>Rating</th><th>Review</th><th>Visibility</th><th>Actions</th></tr></thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r._id}>
                  <td className="small">{r.user?.name}<div className="muted">{r.user?.email}</div><div className="muted">{formatDate(r.createdAt)}</div></td>
                  <td className="small">{r.product?.title}</td>
                  <td style={{ color: 'var(--accent)' }}>{'⭐'.repeat(r.rating)}</td>
                  <td style={{ maxWidth: 340 }}>
                    {r.title && <b className="small">{r.title}</b>}
                    <div className="small muted">{r.comment}</div>
                    {r.adminReply && <div className="small" style={{ color: 'var(--primary-600)', marginTop: 4 }}>Admin: {r.adminReply}</div>}
                  </td>
                  <td><span className={`badge ${r.isVisible ? 'badge-success' : 'badge-danger'}`}>{r.isVisible ? 'visible' : 'hidden'}</span></td>
                  <td>
                    <div className="flex" style={{ flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                      <button className="btn btn-outline btn-xs" onClick={() => reply(r)}>↩ Reply</button>
                      <button className={`btn btn-xs ${r.isVisible ? 'btn-danger' : 'btn-success'}`} onClick={() => update(r, { isVisible: !r.isVisible })}>
                        {r.isVisible ? 'Hide' : 'Show'}
                      </button>
                      <button className="btn btn-outline btn-xs" onClick={() => del(r)}>🗑 Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}