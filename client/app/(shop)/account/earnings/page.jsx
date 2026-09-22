'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { formatMoney, formatDate } from '@/lib/format';
import { Spinner, EmptyState, Stat } from '@/components/ui';

export default function EarningsPage() {
  const router = useRouter();
  const { user, booted, settings } = useApp();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (booted && !user) { router.push('/login?next=/account/earnings'); return; }
    if (booted && user && !['seller', 'admin'].includes(user.role)) { router.push('/account'); return; }
    if (booted && user) {
      api('/orders/seller/earnings').then((r) => setData(r.data)).catch(() => setData({ totals: {}, items: [] }));
    }
  }, [booted, user, router]);

  if (!booted || !user) return <Spinner />;
  if (data === null) return <Spinner text="Calculating your earnings…" />;

  const t = data.totals || {};
  const rate = settings.commissionRate ?? 10;

  const cards = [
    { k: 'Payout received', v: formatMoney(t.paid), d: 'Paid out by VoltMart so far' },
    { k: 'Pending payout', v: formatMoney(t.pending), d: 'Awaiting payout after delivery' },
    { k: 'VoltMart commission', v: formatMoney(t.commission), d: `${rate}% commission on each sale` },
    { k: 'Items sold', v: t.sold, d: 'Across non-cancelled orders' },
  ];

  return (
    <div>
      <div className="card card-pad mb-2">
        <b>Seller earnings 🏪</b>
        <p className="muted small mt-1" style={{ marginBottom: 0 }}>
          When an item you listed sells, VoltMart keeps <b style={{ color: 'var(--ink)' }}>{rate}%</b> commission and you receive the rest.
          Payouts are processed after the order is paid and marked as paid by the admin.
        </p>
      </div>

      <div className="stat-cards">
        {cards.map((c) => <Stat key={c.k} {...c} />)}
      </div>

      <div className="section-head mt-3" style={{ marginBottom: 10 }}><div><h2 style={{ fontSize: 19 }}>Sold items</h2></div></div>
      {data.items.length === 0 ? (
        <EmptyState icon="💰" title="No sales yet" desc="When one of your listings sells, it will appear here with your payout." action={<Link href="/sell" className="btn btn-outline btn-sm">List an item</Link>} />
      ) : (
        <div className="table-wrap" style={{ border: '1px solid var(--line)' }}>
          <table className="tbl">
            <thead>
              <tr><th>Item</th><th>Order</th><th>Date</th><th>Qty</th><th>Line total</th><th>Commission</th><th>Your payout</th><th>Payout</th></tr>
            </thead>
            <tbody>
              {data.items.map((i) => (
                <tr key={`${i.orderId}-${i.product}`}>
                  <td className="small">
                    <div className="flex" style={{ gap: 10, alignItems: 'center' }}>
                      {i.image && <img src={i.image} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--line)' }} />}
                      <span>{i.title}</span>
                    </div>
                  </td>
                  <td className="small"><span className="order-num">{i.orderNumber}</span></td>
                  <td className="small muted">{formatDate(i.createdAt)}</td>
                  <td className="small">{i.quantity}</td>
                  <td className="small">{formatMoney(i.price * i.quantity)}</td>
                  <td className="small muted">{formatMoney(i.commission)}</td>
                  <td className="small"><b>{formatMoney(i.payout)}</b></td>
                  <td><span className={`badge ${i.payoutStatus === 'paid' ? 'badge-success' : 'badge-warn'}`}>{i.payoutStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}