'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Spinner } from '@/components/ui';

const NAV = [
  { href: '/admin', label: '📊 Overview', end: true },
  { href: '/admin/products', label: '📦 Products' },
  { href: '/admin/orders', label: '🧾 Orders' },
  { href: '/admin/users', label: '👥 Users' },
  { href: '/admin/categories', label: '🏷️ Categories' },
  { href: '/admin/reviews', label: '⭐ Reviews' },
  { href: '/admin/settings', label: '⚙️ Settings' },
  { href: '/admin/security', label: '🛡️ Security & Audit' },
];

export default function AdminLayout({ children }) {
  const { user, booted, logout } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (booted && !user) router.push('/login?next=/admin');
    else if (booted && user && user.role !== 'admin') router.push('/');
  }, [booted, user, router]);

  if (!booted || !user) return <Spinner text="Verifying admin session…" />;
  if (user.role !== 'admin') return null;

  const isActive = (l) => (l.end ? pathname === l.href : pathname.startsWith(l.href));

  return (
    <div>
      <div className="navbar">
        <div className="container navbar-inner" style={{ height: 60 }}>
          <Link href="/admin" className="logo" style={{ fontSize: 18 }}>
            <span className="bolt">⚡</span> VoltMart Admin
          </Link>
          <Link href="/" className="btn btn-ghost btn-sm">← Storefront</Link>
          <div className="grow" />
          <span className="badge badge-warn">👑 {user.name}</span>
          <span className="badge badge-success">● Live monitoring</span>
          <button className="btn btn-outline btn-sm" onClick={logout}>Sign out</button>
        </div>
      </div>

      <div className="admin-shell">
        <aside className="admin-side">
          <div className="brand">Control panel</div>
          {NAV.map((l) => (
            <Link key={l.href} href={l.href} className={isActive(l) ? 'active' : ''}>{l.label}</Link>
          ))}
        </aside>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}