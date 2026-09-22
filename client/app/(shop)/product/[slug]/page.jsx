'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import ProductCard from '@/components/ProductCard';
import { Spinner, EmptyState } from '@/components/ui';
import { formatMoney, stars, titleCase, formatDate } from '@/lib/format';
import { fmtError } from '@/lib/api';

export default function ProductPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user, addToCart, toast } = useApp();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [notFound, setNotFound] = useState(false);

  const fetchData = () => {
    api(`/products/${slug}`, { auth: false })
      .then(async (res) => {
        setProduct(res.data);
        const [rel, rev] = await Promise.all([
          api(`/products/${res.data._id}/related`, { auth: false }).catch(() => ({ data: [] })),
          api(`/products/${res.data._id}/reviews`, { auth: false }).catch(() => ({ data: [] })),
        ]);
        setRelated(rel.data);
        setReviews(rev.data);
      })
      .catch(() => setNotFound(true));
  };

  useEffect(fetchData, [slug]);

  if (notFound) return <EmptyState icon="⚠️" title="Product not found" desc="The product may have been removed or is awaiting approval." action={<Link href="/shop" className="btn btn-outline">Back to shop</Link>} />;
  if (!product) return <Spinner text="Loading product…" />;

  const images = product.images?.length ? product.images : [null];
  const inStock = product.stock > 0;
  const old = product.compareAtPrice > product.price ? product.compareAtPrice : 0;

  const buyNow = () => {
    addToCart(product, qty);
    router.push('/checkout');
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast('Sign in to write a review', 'warn');
      router.push(`/login?next=/product/${slug}`);
      return;
    }
    setBusy(true);
    try {
      await api('/products/reviews', { method: 'POST', body: { product: product._id, ...reviewForm } });
      toast('Review submitted, thank you!', 'success');
      fetchData();
      setReviewForm({ rating: 5, title: '', comment: '' });
    } catch (err) {
      toast(fmtError(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container">
      <div className="page-head">
        <div className="breadcrumb">
          <a href="/">Home</a> / <a href="/shop">Shop</a>
          {product.category ? ` / ${product.category.name}` : ''} / {product.title}
        </div>
      </div>

      <div className="section pd-grid" style={{ paddingTop: 18 }}>
        {/* Gallery */}
        <div className="pd-gallery">
          <div className="pd-main-img">
            {images[activeImg] ? <img src={images[activeImg]} alt={product.title} /> : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 96 }}>
                {product.category?.icon || '🔌'}
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="pd-thumbs">
              {images.map((src, i) => src && <img key={i} src={src} className={i === activeImg ? 'on' : ''} onMouseEnter={() => setActiveImg(i)} onClick={() => setActiveImg(i)} />)}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <span className="badge badge-primary">{product.condition ? titleCase(product.condition) : 'New'}</span>
            {product.featured && <span className="badge badge-warn">⭐ Featured</span>}
            {!inStock && <span className="badge badge-danger">Out of stock</span>}
            {product.brand && <span className="badge">{product.brand}</span>}
          </div>
          <h1 className="pd-title">{product.title}</h1>
          <div className="flex" style={{ gap: 10 }}>
            {product.ratingCount > 0 ? (
              <span className="stars">{stars(product.ratingAverage)} <b>{product.ratingAverage}</b> <span className="muted small">({product.ratingCount} review{product.ratingCount > 1 ? 's' : ''})</span></span>
            ) : <span className="small muted">No reviews yet</span>}
            <span className="small muted">· {product.sold} sold · {product.views} views</span>
          </div>

          <div className="flex mt-2" style={{ gap: 12, alignItems: 'baseline' }}>
            <span className="price" style={{ fontSize: 30 }}>{formatMoney(product.price, product.currency)}</span>
            {old > 0 && <span className="price old" style={{ fontSize: 17 }}>{formatMoney(old, product.currency)}</span>}
            <span className="badge badge-success" style={{ marginTop: 10 }}>{product.currency}</span>
          </div>
          <div className="small muted mt-1">
            Incl. fair-price guarantee · {inStock ? <b style={{ color: 'var(--success)' }}>{product.stock} in stock</b> : <span className="stock-out">sold out</span>}
          </div>

          <div className="divider" />
          <p className="muted" style={{ fontSize: 14.5, whiteSpace: 'pre-wrap' }}>{product.shortDescription || product.description?.slice(0, 260)}</p>

          <div className="flex mt-2">
            <div className="qty-row">
              <button className="qty-btn" onClick={() => setQty((v) => Math.max(1, v - 1))} disabled={!inStock}>−</button>
              <span className="qty-val">{qty}</span>
              <button className="qty-btn" onClick={() => setQty((v) => Math.min(product.stock, v + 1))} disabled={!inStock || qty >= product.stock}>+</button>
            </div>
          </div>

          <div className="flex mt-2" style={{ flexWrap: 'wrap' }}>
            <button className="btn btn-lg" disabled={!inStock} onClick={() => addToCart(product, qty)}>
              🛒 Add to cart
            </button>
            <button className="btn btn-lg btn-accent" disabled={!inStock} onClick={buyNow}>
              Buy now
            </button>
          </div>

          <div className="callout mt-2">
            <span>🛡️</span>
            <div>Buyer protection: tested items, 7-day returns, Cash on Delivery available at checkout. Prices are negotiated to stay fair for students and makers.</div>
          </div>

          {product.specs && Object.keys(product.specs).length > 0 && (
            <>
              <h3 className="mt-3">Specifications</h3>
              <table className="spec-table">
                <tbody>
                  {Object.entries(product.specs).map(([k, v]) => (
                    <tr key={k}><td>{titleCase(k)}</td><td>{String(v)}</td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <div className="mt-2">
            <h3>Description</h3>
            <p className="muted" style={{ whiteSpace: 'pre-wrap', fontSize: 14.5 }}>{product.description}</p>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <div><h2>Ratings &amp; reviews</h2><div className="sub">{reviews.length} verified review{reviews.length === 1 ? '' : 's'}</div></div>
        </div>
        <div className="grid" style={{ gridTemplateColumns: user ? '1fr 1.4fr' : '1fr', gap: 24 }}>
          {user && (
            <div className="card card-pad">
              <b>Write a review</b>
              <form onSubmit={submitReview} className="mt-1">
                <div className="field">
                  <label>Rating</label>
                  <div className="flex" style={{ gap: 4 }}>
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button type="button" key={r} style={{ fontSize: 22, background: 'none', border: 'none', color: r <= reviewForm.rating ? 'var(--accent)' : 'var(--line-2)' }} onClick={() => setReviewForm({ ...reviewForm, rating: r })}>★</button>
                    ))}
                  </div>
                </div>
                <div className="field"><label>Title (optional)</label><input className="input" maxLength={120} value={reviewForm.title} onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })} /></div>
                <div className="field"><label>Your comment</label><textarea className="textarea" maxLength={1000} required value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} /></div>
                <button className="btn" disabled={busy}>Submit review</button>
              </form>
            </div>
          )}
          <div>
            {reviews.length === 0 ? (
              <div className="card card-pad muted" style={{ textAlign: 'center' }}>No reviews yet — {user ? 'be the first to review this item' : 'sign in to be the first to review this item'}.</div>
            ) : (
              <div className="card">
                {reviews.map((r) => (
                  <div key={r._id} style={{ padding: '16px 18px', borderBottom: '1px solid var(--line)' }}>
                    <div className="flex-between">
                      <b style={{ fontSize: 14 }}>{r.user?.name || 'Verified buyer'}</b>
                      <span className="small muted">{formatDate(r.createdAt)}</span>
                    </div>
                    <div className="stars small mt-1">{stars(r.rating)}</div>
                    {r.title && <div style={{ fontWeight: 600, marginTop: 6 }}>{r.title}</div>}
                    <p className="small" style={{ marginTop: 6, marginBottom: 0 }}>{r.comment}</p>
                    {r.adminReply && (
                      <div className="callout mt-1" style={{ marginBottom: 0 }}>
                        <span>⚡</span>
                        <div><b>VoltMart:</b> {r.adminReply}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="section-head"><div><h2>You might also like</h2></div></div>
          <div className="grid grid-products">{related.map((p) => <ProductCard key={p._id} product={p} />)}</div>
        </section>
      )}
    </div>
  );
}