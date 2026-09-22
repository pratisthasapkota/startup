'use client';

import Link from 'next/link';
import { useApp } from '@/context/AppContext';

export default function Footer() {
  const { settings } = useApp();
  const s = settings || {};

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="logo" style={{ color: '#fff' }}>
              <span className="bolt">⚡</span>{s.siteName || 'VoltMart'}
            </div>
            <p style={{ marginTop: 14, fontSize: 13.5, maxWidth: 300 }}>
              {s.tagline || 'Buy & sell electronics, hardware and books at fair prices. Tested by makers, trusted by students.'}
            </p>
            <p style={{ fontSize: 13 }}>📍 {s.address || 'Kathmandu, Nepal'}</p>
            <p style={{ fontSize: 13 }}>📞 {s.contactPhone || '—'}</p>
          </div>
          <div>
            <h4>Shop</h4>
            <Link href="/shop">All products</Link>
            <Link href="/shop?sort=newest">New arrivals</Link>
            <Link href="/sell">Become a seller</Link>
            <Link href="/cart">Your cart</Link>
          </div>
          <div>
            <h4>Account</h4>
            <Link href="/account">Dashboard</Link>
            <Link href="/account/orders">Order history</Link>
            <Link href="/login">Sign in</Link>
            <Link href="/register">Create account</Link>
          </div>
          <div>
            <h4>Buy with confidence</h4>
            <p style={{ fontSize: 13.5 }}>Cash on Delivery across Nepal · 7-day returns · Price negotiated fairly · Every item tested before dispatch.</p>
            <p style={{ fontSize: 13, marginTop: 10 }}>Questions? <a href={`mailto:${s.contactEmail || '#'}`} style={{ color: '#a5b4fc' }}>{s.contactEmail || 'support@voltmart.example'}</a></p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {s.siteName || 'VoltMart'}. All rights reserved.</span>
          <span>Built with Next.js + Express + MongoDB · Secure payments &amp; abuse monitoring</span>
        </div>
      </div>
    </footer>
  );
}