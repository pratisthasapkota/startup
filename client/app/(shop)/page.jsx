'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { SkeletonCards, Spinner } from '@/components/ui';
import ProductCard from '@/components/ProductCard';
import { formatMoney } from '@/lib/format';

export default function HomePage() {
  const [featured, setFeatured] = useState(null);
  const [newArrivals, setNewArrivals] = useState(null);
  const [cats, setCats] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([
      api('/products?featured=true&limit=8'),
      api('/products?sort=newest&limit=4'),
      api('/categories', { auth: false }),
      api('/settings/public', { auth: false }),
    ])
      .then(([f, n, c, s]) => {
        setFeatured(f.data);
        setNewArrivals(n.data);
        setCats(c.data);
        setStats(s.data);
      })
      .catch(() => setFeatured([]));
  }, []);

  return (
    <div className="container">
      {/* HERO */}
      <section className="hero">
        <span className="eyebrow"><span>⚡</span> Nepal’s fair-price maker marketplace</span>
        <h1>Buy &amp; <span>sell</span> Arduinos, ESP32-CAM, sensors and books — at honest prices.</h1>
        <p>
          Every item is tested, priced fairly and shipped across Nepal with Cash on Delivery.
          From your first breadboard to your fifth robot — VoltMart has the parts and the books.
        </p>
        <div className="hero-cta">
          <Link href="/shop" className="btn btn-lg btn-accent">Browse the shop →</Link>
          <Link href="/sell" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.3)' }}>Sell your hardware</Link>
        </div>
        <div className="hero-stats">
          <div className="stat"><b>100%</b><span>Genuine products</span></div>
          <div className="stat"><b>7 days</b><span>Easy returns</span></div>
          <div className="stat"><b>COD</b><span>Across Nepal</span></div>
          <div className="stat"><b>24h</b><span>Dispatch</span></div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section">
        <div className="section-head">
          <div>
            <h2>Shop by category</h2>
            <div className="sub">From microcontrollers to maker books</div>
          </div>
          <Link href="/shop" className="btn btn-outline btn-sm">View all products</Link>
        </div>
        {cats.length === 0 ? <Spinner text="Loading categories…" /> : (
          <div className="grid grid-3">
            {cats.slice(0, 6).map((c) => (
              <Link key={c._id} href={`/shop?category=${c._id}`} className="cat-tile">
                <div className="cat-ico">{c.icon}</div>
                <div>
                  <b>{c.name}</b>
                  <span>{c.productCount} item{c.productCount === 1 ? '' : 's'}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* FEATURED */}
      <section className="section" style={{ paddingTop: 4 }}>
        <div className="section-head">
          <div>
            <h2>Featured for you</h2>
            <div className="sub">Top picks pegged at fair market prices</div>
          </div>
          <Link href="/shop?featured=true" className="btn btn-ghost btn-sm">See all →</Link>
        </div>
        {featured === null ? <SkeletonCards n={4} /> :
          featured.length ? <div className="grid grid-products">{featured.map((p) => <ProductCard key={p._id} product={p} />)}</div> : null}
      </section>

      {/* TRUST */}
      <section className="section" style={{ paddingTop: 4 }}>
        <div className="trust">
          <div className="trust-item"><span className="t-ico">🧪</span><div><b>Tested before dispatch</b><span>Every board, sensor and book is checked by hand.</span></div></div>
          <div className="trust-item"><span className="t-ico">💵</span><div><b>Cash on Delivery</b><span>Pay only when your order reaches your door.</span></div></div>
          <div className="trust-item"><span className="t-ico">🛡️</span><div><b>Safe marketplace</b><span>Verified sellers, fair pricing and 7-day returns.</span></div></div>
          <div className="trust-item"><span className="t-ico">🤝</span><div><b>Good for your pocket</b><span>Reasonable prices, always — no middleman markup.</span></div></div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="section" style={{ paddingTop: 4 }}>
        <div className="section-head">
          <div>
            <h2>New arrivals</h2>
            <div className="sub">Freshly listed — grab them while stock lasts</div>
          </div>
          <Link href="/shop?sort=newest" className="btn btn-ghost btn-sm">See all →</Link>
        </div>
        {newArrivals === null ? <SkeletonCards n={4} /> :
          newArrivals.length ? <div className="grid grid-products">{newArrivals.map((p) => <ProductCard key={p._id} product={p} />)}</div> : null}
      </section>

      {/* SELL CTA */}
      <section className="card" style={{ overflow: 'hidden', background: 'linear-gradient(120deg, #eef2ff, #fef3c7)', border: 'none', marginTop: 30 }}>
        <div className="container section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ fontSize: 26 }}>Have hardware or books collecting dust?</h2>
            <p className="muted">List them on VoltMart in minutes. Set your own price, get verified, and sell to students and makers who need exactly what you have.</p>
          </div>
          <Link href="/sell" className="btn btn-lg"><span>Start selling →</span></Link>
        </div>
      </section>
    </div>
  );
}