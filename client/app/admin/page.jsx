'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Stat, Spinner, EmptyState } from '@/components/ui';
import { formatMoney, formatDate } from '@/lib/format';

export default function AdminDashboard() {
  const [s, setS] = useState(null);

  useEffect(() => {
    api('/admin/stats').then(setS).catch(() => setS(false));
  }, []);

  if (s === null) return <Spinner text="Crunching numbers…" />;
  if (s === false) return <EmptyState icon="⚠️" title="Could not load stats" desc="Make sure the API is running and you are signed in as admin." />;

  const t = s.data.totals;
  const maxDay = Math.max(1, ...s.data.salesDaily.map((d) => d.revenue));

  const statCards = [
    { k: 'Revenue', v: formatMoney(t.revenue), accent: 'var(--success)' },
    { k: 'Orders', v: t.orders, d: `${t.pendingOrders} pending · ${t.deliveredOrders} delivered` },
    { k: 'Products', v: t.products, d: `${t.pendingProducts} awaiting review · ${t.lowStock} low stock` },
    { k: 'Users', v: t.users, d: `${t.sellers} sellers / admins` },
  ];

  const earnCards = [
    { k: 'Commission earned', v: formatMoney(t.commissionEarned), d: 'VoltMart keeps this share of sales' },
    { k: 'Payout owed', v: formatMoney(t.sellerPayoutPending), d: 'Pending to sellers · in hands of marketplace' },
    { k: 'Seller payouts (lifetime)', v: formatMoney(t.sellerPayout), d: 'Total paid + owed to sellers' },
  ];

  return (
    <div>
      <div className="admin-head">
        <h1>Overview</h1>
        <span className="small muted">Live snapshot from the database</span>
      </div>

      <div className="stat-cards">
        {statCards.map((c) => <Stat key={c.k} {...c} />)}
      </div>

      <div className="section-head mt-3" style={{ marginBottom: 10 }}><div><h2 style={{ fontSize: 17, margin: 0 }}>Marketplace earnings</h2></div></div>
      <div className="stat-cards">
        {earnCards.map((c) => <Stat key={c.k} {...c} />)}
      </div>

      {/* Sales chart */}
      <div className="card card-pad mt-3">
        <b>Sales — last 7 days</b>
        <div className="flex mt-2" style={{ alignItems: 'flex-end', gap: 12, height: 160 }}>
          {s.data.salesDaily.length === 0 && <span className="muted small">No orders recorded yet.</span>}
          {s.data.salesDaily.map((d) => (
            <div key={d._id} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{formatMoney(d.revenue, '')}</div>
              <div style={{ height: Math.max(6, (d.revenue / maxDay) * 110), background: 'linear-gradient(180deg,#6366f1,#4f46e5)', borderRadius: '8px 8px 3px 3px', margin: '4px auto 0', maxWidth: 46 }} />
              <div style={{ fontSize: 10, color: 'var(--muted-2)', marginTop: 4, whiteSpace: 'nowrap' }}>{new Date(d._id).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 18 }}>
        <div className="card">
          <div className="card-pad flex-between" style={{ borderBottom: '1px solid var(--line)' }}>
            <b>Recent orders</b>
            <Link href="/admin/orders" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          {s.data.recentOrders.length === 0 ? <div className="card-pad muted small">No orders yet.</div> : s.data.recentOrders.map((o) => (
            <div key={o._id} style={{ padding: '11px 16px', borderBottom: '1px solid var(--line)' }}>
              <div className="flex-between">
                <span className="order-num small">{o.orderNumber}</span>
                <span className={`badge ${o.status === 'delivered' ? 'badge-success' : o.status === 'cancelled' ? 'badge-danger' : 'badge-warn'}`}>{o.status}</span>
              </div>
              <div className="small muted mt-1">{o.buyer?.name} · {formatDate(o.createdAt)} · {formatMoney(o.total)}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-pad flex-between" style={{ borderBottom: '1px solid var(--line)' }}>
            <b>Low stock (≤ 3)</b>
            <Link href="/admin/products" className="btn btn-ghost btn-sm">Manage →</Link>
          </div>
          {s.data.lowStockProducts.length === 0 ? <div className="card-pad muted small">All products are well stocked. 🎉</div> : s.data.lowStockProducts.map((p) => (
            <div key={p._id} className="flex-between" style={{ padding: '11px 16px', borderBottom: '1px solid var(--line)' }}>
              <span className="small grow">{p.title}</span>
              <span className="badge badge-danger">stock {p.stock}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card mt-3">
        <div className="card-pad flex-between" style={{ borderBottom: '1px solid var(--line)' }}>
          <b>Top sellers (by units sold)</b>
        </div>
        {s.data.topProducts.length === 0 ? <div className="card-pad muted small">No sales yet.</div> : (
          <div className="table-wrap" style={{ border: 'none' }}>
            <table className="tbl">
              <thead><tr><th>Product</th><th>Sold</th><th>Price</th></tr></thead>
              <tbody>
                {s.data.topProducts.map((p) => (
                  <tr key={p._id}><td>{p.title}</td><td>{p.sold} sold</td><td>{formatMoney(p.price)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}