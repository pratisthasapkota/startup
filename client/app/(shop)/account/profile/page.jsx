'use client';

import { useEffect, useState } from 'react';
import { api, fmtError } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { Spinner } from '@/components/ui';

export default function ProfilePage() {
  const { user, setUser, toast } = useApp();
  const [profile, setProfile] = useState({ name: '', phone: '', shopName: '', bio: '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (user) setProfile({ name: user.name, phone: user.phone || '', shopName: user.shopName || '', bio: user.bio || '' });
  }, [user]);

  if (!user) return <Spinner />;

  const saveProfile = async (e) => {
    e.preventDefault();
    setBusy('p');
    try {
      const r = await api('/auth/profile', { method: 'PUT', body: profile });
      setUser(r.data);
      toast('Profile updated', 'success');
    } catch (err) { toast(fmtError(err), 'error'); } finally { setBusy(''); }
  };

  const changePw = async (e) => {
    e.preventDefault();
    setBusy('w');
    try {
      await api('/auth/password', { method: 'PUT', body: pw });
      setPw({ currentPassword: '', newPassword: '' });
      toast('Password changed. You may be signed out of other devices.', 'success');
    } catch (err) { toast(fmtError(err), 'error'); } finally { setBusy(''); }
  };

  return (
    <div>
      <div className="section-head"><div><h2 style={{ fontSize: 19 }}>Profile & security</h2></div></div>

      <div className="grid" style={{ gridTemplateColumns: '1.6fr 1fr', gap: 18 }}>
        <form className="card card-pad" onSubmit={saveProfile}>
          <h3>Personal details</h3>
          <div className="form-grid mt-1">
            <div className="field" style={{ gridColumn: '1 / -1' }}><label>Full name</label><input className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></div>
            <div className="field"><label>Email (login)</label><input className="input" disabled value={user.email} /></div>
            <div className="field"><label>Phone</label><input className="input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
            {user.role === 'seller' && (
              <>
                <div className="field"><label>Shop name</label><input className="input" value={profile.shopName} onChange={(e) => setProfile({ ...profile, shopName: e.target.value })} /></div>
                <div className="field" style={{ gridColumn: '1 / -1' }}><label>About your shop</label><textarea className="textarea" value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} /></div>
              </>
            )}
          </div>
          <button className="btn" disabled={busy === 'p'}>{busy === 'p' ? 'Saving…' : 'Save changes'}</button>
        </form>

        <form className="card card-pad" onSubmit={changePw}>
          <h3>Change password</h3>
          <p className="small muted">Password changes are audit-logged and invalidate your tokens on other devices.</p>
          <div className="field mt-1"><label>Current password</label><input className="input" type="password" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></div>
          <div className="field"><label>New password</label><input className="input" type="password" required minLength={6} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></div>
          <button className="btn btn-outline" disabled={busy === 'w'}>{busy === 'w' ? 'Updating…' : 'Update password'}</button>
        </form>
      </div>

      <div className="callout mt-2">
        <span>🔐</span>
        <div>Security: your password is bcrypt-hashed, logins are rate-limited, brute-force protection locks accounts after 5 failures, and a lightweight intrusion detection system watches for SQLi / XSS / path-traversal / NoSQL-injection attempts (visible in the admin security dashboard).</div>
      </div>
    </div>
  );
}