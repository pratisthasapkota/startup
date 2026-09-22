'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatMoney, formatDate } from '@/lib/format';
import { Spinner, EmptyState } from '@/components/ui';

export default function AccountDashboard() {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    api('/orders/mine').then((r) => setOrders(r.data)).catch(() => setOrders([]));
  }, []);

  return (
    <div>
      <div className="card card-pad mb-2">
        <b>Welcome back! 👋</b>
        <p className="muted small mt-1" style={{ marginBottom: 14 }}>
          Manage your orders, buy fair-priced hardware and books, or list your own items for sale.
        </p>
        <div className="flex" style={{ flexWrap: 'wrap' }}>
          <Link href="/shop" className="btn">Browse the shop</Link>
          <Link href="/sell" className="btn btn-outline">Sell an item</Link>
          <Link href="/account/profile" className="btn btn-outline">Update profile</Link>
        </div>
      </div>

      <div className="section-head"><div><h2 style={{ fontSize: 19 }}>Recent orders</h2></div></div>
      {!orders ? <Spinner text="Loading orders…" /> : orders.length === 0 ? (
        <EmptyState icon="🧾" title="No orders yet" desc="When you place an order it will show up here." action={<Link href="/shop" className="btn btn-outline btn-sm">Start shopping</Link>} />
      ) : (
        <div className="card">
          {orders.slice(0, 5).map((o) => (
            <Link key={o._id} href="/account/orders" style={{ display: 'block', padding: '13px 16px', borderBottom: '1px solid var(--line)', color: 'var(--ink)' }}>
              <div className="flex-between">
                <span className="order-num small">{o.orderNumber}</span>
                <span className={`badge ${o.status === 'delivered' ? 'badge-success' : o.status === 'cancelled' ? 'badge-danger' : 'badge-warn'}`}>{o.status}</span>
              </div>
              <div className="small muted mt-1">
                {formatDate(o.createdAt)} · {o.items.length} item{o.items.length > 1 ? 's' : ''} · <b style={{ color: 'var(--ink)' }}>{formatMoney(o.total, o.currency)}</b> · {o.paymentMethod === 'cod' ? 'COD' : 'Bank transfer'}
              </div>
            </Link>
          ))}
          <div className="card-pad" style={{ textAlign: 'center' }}><Link href="/account/orders" className="btn btn-outline btn-sm">View all orders</Link></div>
        </div>
      )}
    </div>
  );
}