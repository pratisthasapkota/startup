'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import { SkeletonCards, Pagination, Spinner, EmptyState } from '@/components/ui';

const SORTS = [
  { v: 'featured', l: 'Featured' },
  { v: 'newest', l: 'Newest' },
  { v: 'price-asc', l: 'Price: Low → High' },
  { v: 'price-desc', l: 'Price: High → Low' },
  { v: 'popular', l: 'Most popular' },
  { v: 'rating', l: 'Top rated' },
];

const CONDITIONS = ['new', 'like-new', 'used', 'refurbished', 'for-parts'];

function ShopInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [cats, setCats] = useState([]);
  const [data, setData] = useState(null);

  const q = sp.get('q') || '';
  const category = sp.get('category') || '';
  const condition = sp.get('condition') || '';
  const minPrice = sp.get('minPrice') || '';
  const maxPrice = sp.get('maxPrice') || '';
  const sort = sp.get('sort') || 'featured';
  const page = Number(sp.get('page') || 1);
  const featured = sp.get('featured') === 'true' ? 'true' : '';

  useEffect(() => {
    api('/categories', { auth: false }).then((r) => setCats(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setData(null);
    const params = new URLSearchParams({ limit: '12', sort });
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (condition) params.set('condition', condition);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (featured) params.set('featured', featured);
    if (sort === 'featured') {
      params.set('featured', 'true');
      params.set('sort', 'newest');
    }
    params.set('page', String(page));
    api(`/products?${params.toString()}`, { auth: false }).then(setData).catch(() => setData([]));
  }, [q, category, condition, minPrice, maxPrice, sort, page, featured]);

  const push = (patch) => {
    const p = new URLSearchParams();
    p.set('sort', sort);
    if (q) p.set('q', q);
    if (category) p.set('category', category);
    if (condition) p.set('condition', condition);
    if (minPrice) p.set('minPrice', minPrice);
    if (maxPrice) p.set('maxPrice', maxPrice);
    if (featured) p.set('featured', featured);
    Object.entries(patch).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    router.push(`/shop?${p.toString()}`);
  };

  const activeCat = cats.find((c) => c._id === category);

  return (
    <div className="container">
      <div className="page-head">
        <h1 className="page-title">{activeCat ? `${activeCat.icon} ${activeCat.name}` : q ? `Results for “${q}”` : 'Shop all products'}</h1>
        <div className="breadcrumb">
          <a href="/">Home</a> / <a href="/shop">Shop</a>
          {activeCat ? ` / ${activeCat.name}` : ''}
        </div>
      </div>

      {/* Sidebar-style filters */}
      <div className="section" style={{ paddingTop: 16 }}>
        <div className="cart-wrap" style={{ gridTemplateColumns: '230px 1fr', gap: 24 }}>
          {/* Filters */}
          <aside>
            <div className="card card-pad">
              <b className="small" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>Categories</b>
              <div className="mt-1" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button className="nav-link" style={{ justifyContent: 'space-between', width: '100%' }} onClick={() => push({ category: '' })}>
                  All <span className="muted small">( {cats.reduce((s, c) => s + c.productCount, 0)} )</span>
                </button>
                {cats.map((c) => (
                  <button key={c._id} className="nav-link" style={{ justifyContent: 'space-between', width: '100%' }} onClick={() => push({ category: c._id })}>
                    {c.icon} {c.name} <span className="muted small">({c.productCount})</span>
                  </button>
                ))}
              </div>

              <div className="divider" />

              <b className="small" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>Condition</b>
              <div className="mt-1 flex" style={{ flexWrap: 'wrap' }}>
                {CONDITIONS.map((c) => (
                  <button key={c} className="chip" style={{ borderColor: condition === c ? 'var(--primary)' : undefined, color: condition === c ? 'var(--primary-600)' : undefined, background: condition === c ? 'var(--primary-50)' : undefined }} onClick={() => push({ condition: condition === c ? '' : c })}>
                    {c}
                  </button>
                ))}
              </div>

              <div className="divider" />

              <b className="small" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>Price (NPR)</b>
              <div className="mt-1 flex">
                <input className="input" placeholder="Min" type="number" value={minPrice} onChange={(e) => push({ minPrice: e.target.value, page: '' })} />
                <span className="muted">–</span>
                <input className="input" placeholder="Max" type="number" value={maxPrice} onChange={(e) => push({ maxPrice: e.target.value, page: '' })} />
              </div>
            </div>
          </aside>

          {/* Results */}
          <div>
            <div className="flex-between mb-2">
              <span className="muted small">{data ? `${data.pagination.total} product${data.pagination.total === 1 ? '' : 's'}` : ' '}</span>
              <select className="select" value={sort} onChange={(e) => push({ sort: e.target.value })}>
                {SORTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
              </select>
            </div>

            {!data ? <SkeletonCards n={12} /> : data.data.length === 0 ? (
              <EmptyState icon="🔍" title="No products found" desc="Try adjusting your filters or search terms." action={<a href="/shop" className="btn btn-outline">Clear filters</a>} />
            ) : (
              <div className="grid grid-products">{data.data.map((p) => <ProductCard key={p._id} product={p} />)}</div>
            )}

            {data?.pagination && (
              <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={(p) => push({ page: String(p) })} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<Spinner text="Loading shop…" />}>
      <ShopInner />
    </Suspense>
  );
}