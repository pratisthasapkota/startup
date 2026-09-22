'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { api, fmtError } from '@/lib/api';
import { formatMoney } from '@/lib/format';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, booted, cart, cartSubtotal, clearCart, settings, toast } = useApp();
  const [form, setForm] = useState({ fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'Nepal', paymentMethod: 'cod', customerNote: '' });
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState(null);

  useEffect(() => {
    if (booted && !user) router.push(`/login?next=${encodeURIComponent('/checkout')}`);
    if (user && !form.fullName) setForm((f) => ({ ...f, fullName: user.name }));
  }, [booted, user, form.fullName, router]);

  useEffect(() => {
    if (booted && user && cart.length === 0 && !placed) router.push('/cart');
  }, [booted, user, cart.length, placed, router]);

  const shipping = settings.shippingFee || 0;
  const freeThreshold = settings.freeShippingThreshold || 0;
  const shippingFee = cartSubtotal >= freeThreshold && freeThreshold ? 0 : shipping;
  const total = cartSubtotal + shippingFee;

  const bankEnabled = settings.bankTransferEnabled !== false;
  const codEnabled = settings.codEnabled !== false;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api('/orders', {
        method: 'POST',
        body: {
          items: cart.map((i) => ({ product: i.productId, quantity: i.qty })),
          shippingAddress: {
            fullName: form.fullName, phone: form.phone, line1: form.line1, line2: form.line2,
            city: form.city, state: form.state, postalCode: form.postalCode, country: form.country,
          },
          paymentMethod: form.paymentMethod,
          customerNote: form.customerNote,
        },
      });
      clearCart();
      setPlaced(res.data);
      toast(`Order ${res.data.orderNumber} placed!`, 'success');
    } catch (err) {
      toast(fmtError(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  if (placed) {
    return (
      <div className="container">
        <div style={{ maxWidth: 560, margin: '60px auto' }} className="card card-pad" >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52 }}>✅</div>
            <h2>Order placed!</h2>
            <p className="muted">
              Your order <span className="order-num">{placed.orderNumber}</span> is confirmed.
              {placed.paymentMethod === 'cod'
                ? ' Keep cash ready for delivery — you pay on arrival.'
                : ` Check the bank details below and confirm payment via your order page.`}
            </p>
            {placed.paymentMethod === 'bank_transfer' && settings.bankDetails && (
              <div className="callout" style={{ textAlign: 'left', whiteSpace: 'pre-wrap' }}>{settings.bankDetails}</div>
            )}
            <div className="summary-row total"><span>Total</span><span>{formatMoney(placed.total, placed.currency)}</span></div>
            <Link href="/account/orders" className="btn mt-2">View my orders</Link>{' '}
            <Link href="/shop" className="btn btn-outline mt-2">Keep shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-head"><h1 className="page-title">Checkout</h1></div>
      <div className="section cart-wrap" style={{ paddingTop: 16 }}>
        <form className="card card-pad" onSubmit={submit}>
          <h3>Shipping address</h3>
          <div className="form-grid mt-1">
            <div className="field"><label>Full name *</label><input className="input" required value={form.fullName} onChange={set('fullName')} /></div>
            <div className="field"><label>Phone *</label><input className="input" required value={form.phone} onChange={set('phone')} placeholder="98XXXXXXXX" /></div>
            <div className="field" style={{ gridColumn: '1 / -1' }}><label>Address line 1 *</label><input className="input" required value={form.line1} onChange={set('line1')} /></div>
            <div className="field" style={{ gridColumn: '1 / -1' }}><label>Address line 2</label><input className="input" value={form.line2} onChange={set('line2')} /></div>
            <div className="field"><label>City *</label><input className="input" required value={form.city} onChange={set('city')} /></div>
            <div className="field"><label>State / Province</label><input className="input" value={form.state} onChange={set('state')} /></div>
            <div className="field"><label>Postal code</label><input className="input" value={form.postalCode} onChange={set('postalCode')} /></div>
            <div className="field"><label>Country</label><input className="input" value={form.country} onChange={set('country')} /></div>
          </div>

          <div className="divider" />

          <h3>Payment method</h3>
          {codEnabled && (
            <label className="checkbox-row" style={{ padding: '10px 0' }}>
              <input type="radio" name="pm" checked={form.paymentMethod === 'cod'} onChange={() => setForm({ ...form, paymentMethod: 'cod' })} />
              <div><b>Cash on Delivery (COD)</b><div className="small muted">Pay in cash when your order arrives.</div></div>
            </label>
          )}
          {bankEnabled && (
            <label className="checkbox-row" style={{ padding: '10px 0' }}>
              <input type="radio" name="pm" checked={form.paymentMethod === 'bank_transfer'} onChange={() => setForm({ ...form, paymentMethod: 'bank_transfer' })} />
              <div><b>Bank transfer</b><div className="small muted">Pay to our account and confirm from your order page.</div></div>
            </label>
          )}

          <div className="field mt-1"><label>Order note (optional)</label><textarea className="textarea" maxLength={500} value={form.customerNote} onChange={set('customerNote')} placeholder="Any instructions for the seller…" /></div>

          <button className="btn btn-lg btn-accent btn-block mt-2" disabled={busy || cart.length === 0}>
            {busy ? 'Placing order…' : `Place order · ${formatMoney(total)}`}
          </button>
        </form>

        <div className="card card-pad" style={{ position: 'sticky', top: 90 }}>
          <h3 style={{ marginBottom: 10 }}>Your items ({cart.length})</h3>
          {cart.map((i) => (
            <div key={i.productId} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
              <span className="small grow">{i.title} <span className="muted">× {i.qty}</span></span>
              <b className="small">{formatMoney(i.price * i.qty)}</b>
            </div>
          ))}
          <div className="summary-row"><span>Subtotal</span><b>{formatMoney(cartSubtotal)}</b></div>
          <div className="summary-row"><span>Shipping</span><b>{shippingFee === 0 ? 'FREE' : formatMoney(shippingFee)}</b></div>
          <div className="summary-row total"><span>Total</span><span>{formatMoney(total)}</span></div>
        </div>
      </div>
    </div>
  );
}