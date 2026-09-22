'use client';

import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { formatMoney, stars } from '@/lib/format';
import { titleCase } from '@/lib/format';

export default function ProductCard({ product }) {
  const { addToCart } = useApp();
  const price = product.price ?? 0;
  const old = product.compareAtPrice > price ? product.compareAtPrice : 0;
  const inStock = product.stock > 0;
  const img = product.images?.[0];

  return (
    <div className="pcard">
      <Link href={`/product/${product.slug || product._id}`} className="pcard-media">
        {product.featured && <span className="badge badge-accent pcard-tag" style={{ background: 'var(--accent)', color: '#fff' }}>Featured</span>}
        {img ? <img src={img} alt={product.title} loading="lazy" /> : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, background: 'var(--bg)' }}>
            {product.category?.icon || '🔌'}
          </div>
        )}
      </Link>
      <div className="pcard-body">
        <span className="pcard-cat">{product.category?.name || titleCase(product.condition || 'product')}</span>
        <Link href={`/product/${product.slug || product._id}`} className="pcard-title">{product.title}</Link>

        {product.ratingCount > 0 && (
          <span className="stars small"><span className={product.ratingAverage < 5 ? '' : 'off'}>{stars(product.ratingAverage)}</span> <span className="muted">({product.ratingCount})</span></span>
        )}

        <div className="pcard-foot">
          <div className="pcard-price">
            <span className="price">{formatMoney(price, product.currency)}</span>
            {old > 0 && <span className="price old">{formatMoney(old, product.currency)}</span>}
          </div>
          <span className={`stock-pill ${inStock ? 'stock-in' : 'stock-out'}`}>
            {inStock ? (product.stock <= 5 ? `Only ${product.stock} left` : 'In stock') : 'Out of stock'}
          </span>
        </div>

        <button className="btn btn-block btn-sm" disabled={!inStock} onClick={() => addToCart(product)}>
          {inStock ? 'Add to cart' : 'Sold out'}
        </button>
      </div>
    </div>
  );
}