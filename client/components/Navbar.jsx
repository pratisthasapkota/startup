'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export default function Navbar() {
  const { user, booted, logout, cartCount, settings } = useApp();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);
  const acctRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (acctRef.current && !acctRef.current.contains(e.target)) setAcctOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    router.push(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : '/shop');
    setQ('');
  };

  return (
    <>
      {settings.announcement ? <div className="announce">{settings.announcement}</div> : null}
      <header className="navbar">
        <div className="container navbar-inner">
          <Link href="/" className="logo">
            <span className="bolt">⚡</span>
            {settings.siteName || 'VoltMart'}
          </Link>

          <form className="nav-search" onSubmit={submitSearch}>
            <span className="search-ico">🔍</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Arduino, ESP32-CAM, books…" />
          </form>

          <nav className="nav-links" style={{ display: menuOpen ? 'flex' : undefined }}>
            <Link href="/shop" className="nav-link">Shop</Link>
            <Link href="/shop?condition-like=" className="nav-link hidden"></Link>
            <Link href="/sell" className="nav-link">Sell</Link>
            {user?.role === 'admin' && <Link href="/admin" className="nav-link">Admin</Link>}

            <div style={{ position: 'relative' }} ref={acctRef}>
              {booted && user ? (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={() => setAcctOpen((o) => !o)}>
                    👤 {user.name.split(' ')[0]}
                  </button>
                  {acctOpen && (
                    <div className="card" style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 200, zIndex: 60, padding: 8 }}>
                      <Link className="nav-link" href="/account" onClick={() => setAcctOpen(false)}>My Dashboard</Link>
                      <Link className="nav-link" href="/account/orders" onClick={() => setAcctOpen(false)}>My Orders</Link>
                      <Link className="nav-link" href="/sell" onClick={() => setAcctOpen(false)}>Sell an item</Link>
                      {user.role === 'admin' && (
                        <>
                          <div className="divider" />
                          <Link className="nav-link" href="/admin" onClick={() => setAcctOpen(false)}>Admin Panel</Link>
                        </>
                      )}
                      <div className="divider" />
                      <button className="nav-link" style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', color: 'var(--danger)' }} onClick={() => { setAcctOpen(false); logout(); }}>
                        Sign out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                booted && (
                  <Link href="/login" className="btn btn-sm">Sign in</Link>
                )
              )}
            </div>

            <Link href="/cart" className="nav-link" aria-label="Cart">
              🛒 <span className="cart-badge">{cartCount}</span>
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}