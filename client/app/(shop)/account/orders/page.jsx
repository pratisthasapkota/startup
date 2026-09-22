'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, fmtError } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { formatMoney, formatDate } from '@/lib/format';
import { Spinner, EmptyState, Modal } from '@/components/ui';

export default function OrdersPage() {
  const { toast, settings } = useApp();
  const [orders, setOrders] = useState(null);
  const [open, setOpen] = useState(null);

  const load = () => api('/orders/mine').then((r) => setOrders(r.data)).catch(() => setOrders([]));
  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    try {
      await api(`/orders/${id}/cancel`, { method: 'PATCH' });
      toast('Order cancelled', 'success');
      setOpen(null);
      load();
    } catch (err) {
      toast(fmtError(err), 'error');
    }
  };

  return (
    <div>
      <div className="section-head"><div><h2 style={{ fontSize: 19 }}>My orders</h2><div className="sub">Track orders, view payment details and cancel pending ones.</div></div></div>

      {!orders ? <Spinner /> : orders.length === 0 ? (
        <EmptyState icon="🧾" title="No orders yet" action={<Link href="/shop" className="btn">Start shopping</Link>} />
      ) : (
        <div className="card">
          {orders.map((o) => (
            <div key={o._id} style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
              <div className="flex-between flex-wrap">
                <div>
                  <span className="order-num">{o.orderNumber}</span>
                  <span className="small muted"> · {formatDate(o.createdAt)}</span>
                </div>
                <div className="flex">
                  <span className={`badge ${o.status === 'delivered' ? 'badge-success' : o.status === 'cancelled' ? 'badge-danger' : 'badge-warn'}`}>{o.status}</span>
                  <span className={`badge ${o.paymentStatus === 'paid' ? 'badge-success' : o.paymentStatus === 'refunded' ? 'badge-danger' : 'badge-info'}`}>Payment: {o.paymentStatus}</span>
                  <button className="btn btn-outline btn-xs" onClick={() => setOpen(o)}>Details</button>
                </div>
              </div>
              <div className="small muted mt-1">
                {o.items.map((i) => `${i.title} × ${i.quantity}`).join(', ')} — <b style={{ color: 'var(--ink)' }}>{formatMoney(o.total, o.currency)}</b>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!open} onClose={() => setOpen(null)} title={`Order ${open?.orderNumber || ''}`} lg>
        {open && (
          <div>
            <div className="flex flex-wrap" style={{ gap: 8 }}>
              <span className={`badge ${open.status === 'delivered' ? 'badge-success' : open.status === 'cancelled' ? 'badge-danger' : 'badge-warn'}`}>Status: {open.status}</span>
              <span className={`badge ${open.paymentStatus === 'paid' ? 'badge-success' : 'badge-info'}`}>Payment: {open.paymentStatus}</span>
              <span className="badge">{open.paymentMethod === 'cod' ? '💵 Cash on Delivery' : '🏦 Bank transfer'}</span>
            </div>

            <div className="divider" />
            <b className="small" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>Items</b>
            {open.items.map((i, idx) => (
              <div key={i.product || idx} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                <span className="small grow">{i.title} <span className="muted">× {i.quantity}</span></span>
                <b className="small">{formatMoney(i.price * i.quantity, open.currency)}</b>
              </div>
            ))}
            <div className="summary-row"><span>Subtotal</span><b>{formatMoney(open.subtotal, open.currency)}</b></div>
            <div className="summary-row"><span>Shipping</span><b>{open.shippingFee === 0 ? 'FREE' : formatMoney(open.shippingFee, open.currency)}</b></div>
            <div className="summary-row total"><span>Total</span><span>{formatMoney(open.total, open.currency)}</span></div>

            <div className="divider" />
            <b className="small" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>Deliver to</b>
            <p className="small mt-1" style={{ marginBottom: 0 }}>
              {open.shippingAddress.fullName} · {open.shippingAddress.phone}<br />
              {[open.shippingAddress.line1, open.shippingAddress.line2].filter(Boolean).join(', ')}<br />
              {open.shippingAddress.city}, {open.shippingAddress.state} {open.shippingAddress.postalCode} · {open.shippingAddress.country}
            </p>
            {open.customerNote && <p className="small mt-1"><b>Note:</b> {open.customerNote}</p>}

            {open.paymentMethod === 'bank_transfer' && settings.bankDetails && (
              <div className="callout mt-2"><span>🏦</span><div style={{ whiteSpace: 'pre-wrap' }}><b>Transfer now:</b><br />{settings.bankDetails}</div></div>
            )}

            {open.statusHistory?.length > 0 && (
              <>
                <div className="divider" />
                <b className="small" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>Timeline</b>
                {open.statusHistory.map((h, i) => (
                  <div key={i} className="small" style={{ padding: '4px 0' }}>
                    • <b>{h.status}</b> — {h.note || '—'} <span className="muted">({formatDate(h.at)})</span>
                  </div>
                ))}
              </>
            )}

            {['pending', 'confirmed'].includes(open.status) && (
              <button className="btn btn-danger mt-2" onClick={() => cancel(open._id)}>Cancel order</button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}