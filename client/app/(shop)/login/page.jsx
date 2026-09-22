'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { fmtError } from '@/lib/api';

function LoginInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const { login, toast } = useApp();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const next = sp.get('next') || '/account';

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const u = await login(form.email, form.password);
      toast(`Welcome back, ${u.name.split(' ')[0]}!`, 'success');
      router.push(u.role === 'admin' && next === '/account' ? '/admin' : next);
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
          <h2 style={{ marginBottom: 4 }}>Sign in</h2>
          <p className="muted small">Welcome back to VoltMart. Buy at fair prices, sell your hardware.</p>
          {err && <div className="callout callout-danger"><span>⚠️</span><div>{err}</div></div>}
          <form onSubmit={submit} className="mt-2">
            <div className="field"><label>Email</label><input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="field"><label>Password</label><input className="input" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <button className="btn btn-lg btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          </form>
          <div className="auth-alt">New here? <Link href="/register">Create an account</Link></div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div />}>
      <LoginInner />
    </Suspense>
  );
}