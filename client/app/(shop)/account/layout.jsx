'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Spinner } from '@/components/ui';

const LINKS = [
  { href: '/account', label: '📊 Dashboard' },
  { href: '/account/orders', label: '📦 My orders' },
  { href: '/account/profile', label: '👤 Profile & security' },
  { href: '/sell', label: '🏷️ Sell an item' },
];

export default function AccountLayout({ children }) {
  const { user, booted } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (booted && !user) router.push('/login?next=/account');
  }, [booted, user, router]);

  if (!booted || !user) return <Spinner text="Checking your session…" />;

  return (
    <div className="container">
      <div className="page-head"><h1 className="page-title">My account</h1></div>
      <div className="section" style={{ paddingTop: 14 }}>
        <div className="cart-wrap" style={{ gridTemplateColumns: '230px 1fr' }}>
          <aside className="card card-pad" style={{ alignSelf: 'start', padding: 12 }}>
            <div style={{ padding: '10px 12px 14px', borderBottom: '1px solid var(--line)', marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>{user.name}</div>
              <div className="small muted">{user.email}</div>
              <span className={`badge mt-1 ${user.role === 'admin' ? 'badge-warn' : user.role === 'seller' ? 'badge-primary' : 'badge-info'}`}>
                {user.role === 'admin' ? '👑 Admin' : user.role === 'seller' ? '🏪 Seller' : '🛍️ Buyer'}
              </span>
            </div>
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="nav-link" style={{ width: '100%', display: 'flex', color: pathname === l.href ? 'var(--primary-600)' : undefined, background: pathname === l.href ? 'var(--primary-50)' : undefined }}>
                {l.label}
              </Link>
            ))}
            {['seller', 'admin'].includes(user.role) && (
              <Link href="/account/earnings" className="nav-link" style={{ width: '100%', display: 'flex', color: pathname === '/account/earnings' ? 'var(--primary-600)' : undefined, background: pathname === '/account/earnings' ? 'var(--primary-50)' : undefined }}>💰 Earnings</Link>
            )}
            {user.role === 'admin' && (
              <Link href="/admin" className="nav-link" style={{ width: '100%', display: 'flex' }}>🛡️ Admin panel</Link>
            )}
          </aside>
          <div style={{ minWidth: 0 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}