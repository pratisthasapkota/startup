'use client';

import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { formatMoney } from '@/lib/format';
import { EmptyState } from '@/components/ui';

export default function CartPage() {
  const { cart, setQty, removeFromCart, clearCart, cartSubtotal, settings, toast } = useApp();

  const shipping = settings.shippingFee || 0;
  const freeThreshold = settings.freeShippingThreshold || 0;
  const shippingFee = cartSubtotal >= freeThreshold && freeThreshold ? 0 : shipping;

  if (cart.length === 0) {
    return (
      <div className="container">
        <div className="page-head"><h1 className="page-title">Your cart</h1></div>
        <EmptyState icon="🛒" title="Your cart is empty" desc="Browse the shop and add some Arduino boards, sensors or books." action={<Link href="/shop" className="btn">Browse the shop</Link>} />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-head"><h1 className="page-title">Your cart ({cart.length} item{cart.length > 1 ? 's' : ''})</h1></div>
      <div className="section cart-wrap" style={{ paddingTop: 16 }}>
        <div className="card">
          {cart.map((i) => (
            <div key={i.productId} className="cart-item">
              <Link href={`/product/${i.slug}`}>
                {i.image ? <img src={i.image} alt={i.title} /> : <div style={{ width: 72, height: 72, borderRadius: 10, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🔌</div>}
              </Link>
              <div className="grow">
                <Link href={`/product/${i.slug}`} style={{ fontWeight: 600, fontSize: 14.5 }}>{i.title}</Link>
                <div className="small muted">{formatMoney(i.price)} each</div>
                <div className="small muted">Stock: {i.stock}</div>
              </div>
              <div className="qty-row">
                <button className="qty-btn" onClick={() => setQty(i.productId, i.qty - 1)}>−</button>
                <span className="qty-val">{i.qty}</span>
                <button className="qty-btn" onClick={() => setQty(i.productId, i.qty + 1)} disabled={i.qty >= i.stock}>+</button>
              </div>
              <b style={{ width: 90, textAlign: 'right' }}>{formatMoney(i.price * i.qty)}</b>
              <button className="btn btn-ghost btn-sm" onClick={() => removeFromCart(i.productId)} aria-label="Remove">✕</button>
            </div>
          ))}
          <div className="card-pad flex-between" style={{ borderTop: '1px solid var(--line)' }}>
            <span className="muted small">Prices are locked at what you see. Stock is confirmed at checkout.</span>
            <button className="btn btn-outline btn-sm" onClick={() => { clearCart(); toast('Cart cleared', 'warn'); }}>Clear cart</button>
          </div>
        </div>

        <div className="card card-pad" style={{ position: 'sticky', top: 90 }}>
          <h3 style={{ marginBottom: 14 }}>Order summary</h3>
          <div className="summary-row"><span>Subtotal</span><b>{formatMoney(cartSubtotal)}</b></div>
          <div className="summary-row">
            <span>Shipping</span>
            <b>{shippingFee === 0 ? <span className="stock-in">FREE</span> : formatMoney(shippingFee)}</b>
          </div>
          {freeThreshold > 0 && cartSubtotal < freeThreshold && (
            <div className="small muted" style={{ marginTop: 4 }}>Add {formatMoney(freeThreshold - cartSubtotal)} more for free shipping 🚚</div>
          )}
          <div className="summary-row total"><span>Total</span><span>{formatMoney(cartSubtotal + shippingFee)}</span></div>
          <Link href="/checkout" className="btn btn-lg btn-accent btn-block mt-2">Proceed to checkout →</Link>
          <Link href="/shop" className="btn btn-ghost btn-block mt-1">Continue shopping</Link>
          <div className="small muted mt-2" style={{ textAlign: 'center' }}>💵 Cash on Delivery · 🏦 Bank transfer available</div>
        </div>
      </div>
    </div>
  );
}