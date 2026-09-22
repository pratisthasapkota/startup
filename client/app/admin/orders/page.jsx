'use client';

import { useEffect, useState } from 'react';
import { api, fmtError } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { formatMoney, formatDate } from '@/lib/format';
import { Spinner, Pagination, Modal } from '@/components/ui';

const STATUSES = ['', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const { toast } = useApp();
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const [nextStatus, setNextStatus] = useState('');
  const [nextPayment, setNextPayment] = useState('');
  const [note, setNote] = useState('');
  const [address, setAddress] = useState(null);
  const [customerNote, setCustomerNote] = useState('');
  const [adminNote, setAdminNote] = useState('');

  const load = () => {
    const p = new URLSearchParams({ page: String(page), limit: '15' });
    if (filter) p.set('status', filter);
    api(`/admin/orders?${p.toString()}`).then(setData).catch(() => setData([]));
  };

  useEffect(() => { load(); }, [filter, page]);

  const update = async () => {
    const body = {
      status: nextStatus || open.status,
      paymentStatus: nextPayment || open.paymentStatus,
      shippingAddress: address,
      customerNote,
      adminNote,
    };
    if (nextStatus !== open.status) body.note = note || `Marked ${nextStatus}`;
    try {
      await api(`/admin/orders/${open._id}`, {
        method: 'PATCH',
        body,
      });
      toast('Order updated', 'success');
      setOpen(null);
      setNote('');
      load();
    } catch (err) { toast(fmtError(err), 'error'); }
  };

  const togglePayout = async (item) => {
    const next = item.payoutStatus === 'paid' ? 'pending' : 'paid';
    try {
      const r = await api(`/orders/${open._id}/payout`, { method: 'PATCH', body: { items: [{ product: item.product, payoutStatus: next }] } });
      const updated = r.data;
      toast(`Payout marked ${next}`, 'success');
      setOpen(updated);
      load();
    } catch (err) { toast(fmtError(err), 'error'); }
  };

  const del = async () => {
    if (!window.confirm(`Permanently delete order ${open?.orderNumber}? This cannot be undone.`)) return;
    try {
      await api(`/admin/orders/${open._id}`, { method: 'DELETE' });
      toast('Order deleted', 'success');
      setOpen(null);
      load();
    } catch (err) { toast(fmtError(err), 'error'); }
  };

  return (
    <div>
      <div className="admin-head">
        <h1>Orders</h1>
        <div className="seg">
          {STATUSES.map((s) => (
            <button key={s || 'all'} className={filter === s ? 'on' : ''} onClick={() => { setFilter(s); setPage(1); }}>{s || 'all'}</button>
          ))}
        </div>
      </div>

      {!data ? <Spinner /> : (
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>Order</th><th>Buyer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Placed</th><th></th></tr></thead>
            <tbody>
              {data.data.map((o) => (
                <tr key={o._id}>
                  <td><span className="order-num small">{o.orderNumber}</span></td>
                  <td className="small">{o.buyer?.name}<div className="muted">{o.buyer?.phone}</div></td>
                  <td className="small">{o.items.reduce((s, i) => s + i.quantity, 0)} item(s)</td>
                  <td><b>{formatMoney(o.total, o.currency)}</b></td>
                  <td><span className={`badge ${o.paymentStatus === 'paid' ? 'badge-success' : o.paymentStatus === 'refunded' ? 'badge-danger' : 'badge-info'}`}>{o.paymentStatus}</span></td>
                  <td><span className={`badge ${o.status === 'delivered' ? 'badge-success' : o.status === 'cancelled' ? 'badge-danger' : 'badge-warn'}`}>{o.status}</span></td>
                  <td className="small muted">{formatDate(o.createdAt)}</td>
                  <td><button className="btn btn-outline btn-xs" onClick={() => { setOpen(o); setNextStatus(o.status); setNextPayment(o.paymentStatus); setAddress({ ...o.shippingAddress }); setCustomerNote(o.customerNote || ''); setAdminNote(o.adminNote || ''); }}>Manage</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.pagination && <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={setPage} small />}

      <Modal open={!!open} onClose={() => setOpen(null)} title={`Order ${open?.orderNumber || ''}`} lg>
        {open && (
          <div>
            <div className="small muted mb-1">Buyer: <b style={{ color: 'var(--ink)' }}>{open.buyer?.name}</b> ({open.buyer?.phone})</div>
            {open.items.map((i, idx) => (
              <div key={i.product || idx} style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                <div className="flex-between">
                  <span className="small grow">{i.title} <span className="muted">× {i.quantity}</span></span>
                  <b className="small">{formatMoney(i.price * i.quantity, open.currency)}</b>
                </div>
                <div className="flex-between mt-1" style={{ alignItems: 'center' }}>
                  <span className="small muted">
                    {i.seller
                      ? <>VoltMart commission <b style={{ color: 'var(--success)' }}>{formatMoney(i.commission || 0, open.currency)}</b> · seller payout <b style={{ color: 'var(--ink)' }}>{formatMoney(i.payout || 0, open.currency)}</b></>
                      : 'Marketplace stock (100% VoltMart commission)'}
                  </span>
                  {i.seller && (i.payout || 0) > 0 && i.payoutStatus && (
                    <button
                      type="button"
                      className={`btn ${i.payoutStatus === 'paid' ? 'btn-ghost' : 'btn-outline'} btn-xs`}
                      onClick={() => togglePayout(i)}
                      title="Toggle whether the seller has been paid"
                    >
                      {i.payoutStatus === 'paid' ? '✓ Payout paid' : 'Mark payout paid'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div className="summary-row"><span>Shipping to</span><span className="small">{open.shippingAddress.city}, {open.shippingAddress.line1}</span></div>
            <div className="summary-row total"><span>Total</span><span>{formatMoney(open.total, open.currency)}</span></div>
            {open.customerNote && <div className="small muted">Buyer note: {open.customerNote}</div>}

            <div className="form-grid mt-2">
              <div className="field"><label>Order status</label>
                <select className="select" value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
                  {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="field"><label>Payment status</label>
                <select className="select" value={nextPayment} onChange={(e) => setNextPayment(e.target.value)}>
                  {['unpaid', 'paid', 'refunded'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}><label>Note (timeline)</label><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal note shown in order timeline" /></div>
            </div>

            <h4 className="mt-3">Shipping address &amp; notes</h4>
            <div className="form-grid">
              <div className="field"><label>Recipient name</label><input className="input" value={address?.fullName || ''} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} /></div>
              <div className="field"><label>Phone</label><input className="input" value={address?.phone || ''} onChange={(e) => setAddress({ ...address, phone: e.target.value })} /></div>
              <div className="field" style={{ gridColumn: '1 / -1' }}><label>Address line 1</label><input className="input" value={address?.line1 || ''} onChange={(e) => setAddress({ ...address, line1: e.target.value })} /></div>
              <div className="field" style={{ gridColumn: '1 / -1' }}><label>Address line 2</label><input className="input" value={address?.line2 || ''} onChange={(e) => setAddress({ ...address, line2: e.target.value })} /></div>
              <div className="field"><label>City</label><input className="input" value={address?.city || ''} onChange={(e) => setAddress({ ...address, city: e.target.value })} /></div>
              <div className="field"><label>State</label><input className="input" value={address?.state || ''} onChange={(e) => setAddress({ ...address, state: e.target.value })} /></div>
              <div className="field"><label>Postal code</label><input className="input" value={address?.postalCode || ''} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} /></div>
              <div className="field"><label>Country</label><input className="input" value={address?.country || ''} onChange={(e) => setAddress({ ...address, country: e.target.value })} /></div>
              <div className="field" style={{ gridColumn: '1 / -1' }}><label>Customer note</label><textarea className="textarea" rows={2} maxLength={500} value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} /></div>
              <div className="field" style={{ gridColumn: '1 / -1' }}><label>Admin note</label><textarea className="textarea" rows={2} maxLength={500} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} /></div>
            </div>
            <button className="btn btn-block" onClick={update}>Save changes</button>
            {nextStatus === 'cancelled' && <div className="callout callout-danger mt-2"><span>⚠️</span><div>Cancelling restocks inventory automatically.</div></div>}
          </div>
        )}
      </Modal>
    </div>
  );
}