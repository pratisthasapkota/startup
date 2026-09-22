'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { fmtError } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const { register, allowSellerSignup, toast } = useApp();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'buyer' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return setErr('Password must be at least 6 characters');
    setBusy(true);
    setErr('');
    try {
      const u = await register(form);
      toast(`Account created — welcome, ${u.name.split(' ')[0]}!`, 'success');
      router.push(form.role === 'seller' ? '/sell' : '/account');
    } catch (ex) {
      setErr(fmtError(ex));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container">
      <div className="auth-wrap">
        <div className="card card-pad">
          <h2 style={{ marginBottom: 4 }}>Create your account</h2>
          <p className="muted small">Join VoltMart to buy fair-priced hardware and list your own items.</p>
          {err && <div className="callout callout-danger mt-1"><span>⚠️</span><div>{err}</div></div>}
          <form onSubmit={submit} className="mt-2">
            <div className="field"><label>Full name *</label><input className="input" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="field"><label>Email *</label><input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="field"><label>Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="98XXXXXXXX" /></div>
            <div className="field"><label>Password *</label><input className="input" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><div className="hint">At least 6 characters. Stored hashed — never plain text.</div></div>

            {allowSellerSignup && (
              <div className="field">
                <label>Account type</label>
                <div className="seg">
                  <button type="button" className={form.role === 'buyer' ? 'on' : ''} onClick={() => setForm({ ...form, role: 'buyer' })}>Buyer</button>
                  <button type="button" className={form.role === 'seller' ? 'on' : ''} onClick={() => setForm({ ...form, role: 'seller' })}>Seller</button>
                </div>
                <div className="hint">Sellers can list hardware and books for sale. Listings are reviewed by our team.</div>
              </div>
            )}

            <button className="btn btn-lg btn-block" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
          </form>
          <div className="auth-alt">Already have an account? <Link href="/login">Sign in</Link></div>
        </div>
      </div>
    </div>
  );
}