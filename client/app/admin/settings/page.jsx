'use client';

import { useEffect, useState } from 'react';
import { api, fmtError } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { Spinner } from '@/components/ui';

const DEFAULTS = {
  siteName: 'VoltMart', tagline: '', logoUrl: '', currency: 'NPR',
  shippingFee: 100, freeShippingThreshold: 3000, commissionRate: 10, codEnabled: true, bankTransferEnabled: true,
  bankDetails: '', maintenanceMode: false, allowSellerSignup: true, autoApproveProducts: false,
  announcement: '', contactEmail: '', contactPhone: '', address: '',
  socials: { facebook: '', instagram: '', twitter: '' },
};

export default function AdminSettings() {
  const { toast, settings, setSettings } = useApp();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/admin/settings').then((r) => setForm({ ...DEFAULTS, ...r.data, socials: { ...DEFAULTS.socials, ...r.data.socials } })).catch(() => setForm(DEFAULTS));
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const save = async () => {
    setBusy(true);
    try {
      const r = await api('/admin/settings', { method: 'PUT', body: form });
      toast('Settings saved', 'success');
      setSettings(r.data);
    } catch (err) { toast(fmtError(err), 'error'); } finally { setBusy(false); }
  };

  if (!form) return <Spinner />;

  return (
    <div>
      <div className="admin-head">
        <h1>Store settings</h1>
        <button className="btn" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div className="card card-pad">
          <h3>Branding</h3>
          <div className="field mt-1"><label>Site name</label><input className="input" value={form.siteName} onChange={set('siteName')} /></div>
          <div className="field"><label>Tagline</label><input className="input" value={form.tagline} onChange={set('tagline')} /></div>
          <div className="field"><label>Logo URL</label><input className="input" value={form.logoUrl} onChange={set('logoUrl')} placeholder="https://…" /></div>
          <div className="field"><label>Announcement bar</label><input className="input" value={form.announcement} onChange={set('announcement')} placeholder="e.g. Free shipping over Rs. 3,000" /></div>
        </div>

        <div className="card card-pad">
          <h3>Commerce</h3>
          <div className="form-grid mt-1">
            <div className="field"><label>Currency</label><input className="input" value={form.currency} onChange={set('currency')} /></div>
            <div className="field"><label>Shipping fee</label><input className="input" type="number" value={form.shippingFee} onChange={set('shippingFee')} /></div>
            <div className="field"><label>Free shipping from</label><input className="input" type="number" value={form.freeShippingThreshold} onChange={set('freeShippingThreshold')} /></div>
            <div className="field"><label>Commission rate (%)</label><input className="input" type="number" min={0} max={100} value={form.commissionRate} onChange={set('commissionRate')} /></div>
          </div>
          <div className="hint">VoltMart keeps this % of each seller's sale; the seller receives the rest. Items listed by VoltMart itself pay 100% commission.</div>
          <label className="checkbox-row mt-1"><input type="checkbox" checked={form.codEnabled} onChange={set('codEnabled')} /> Cash on Delivery enabled</label>
          <label className="checkbox-row mt-1"><input type="checkbox" checked={form.bankTransferEnabled} onChange={set('bankTransferEnabled')} /> Bank transfer enabled</label>
          <div className="field mt-2"><label>Bank details (shown to buyers)</label><textarea className="textarea" value={form.bankDetails} onChange={set('bankDetails')} /></div>
        </div>

        <div className="card card-pad">
          <h3>Contact & location</h3>
          <div className="form-grid mt-1">
            <div className="field"><label>Support email</label><input className="input" value={form.contactEmail} onChange={set('contactEmail')} /></div>
            <div className="field"><label>Phone</label><input className="input" value={form.contactPhone} onChange={set('contactPhone')} /></div>
            <div className="field" style={{ gridColumn: '1 / -1' }}><label>Address</label><input className="input" value={form.address} onChange={set('address')} /></div>
            <div className="field"><label>Facebook</label><input className="input" value={form.socials.facebook} onChange={(e) => setForm({ ...form, socials: { ...form.socials, facebook: e.target.value } })} /></div>
            <div className="field"><label>Instagram</label><input className="input" value={form.socials.instagram} onChange={(e) => setForm({ ...form, socials: { ...form.socials, instagram: e.target.value } })} /></div>
          </div>
        </div>

        <div className="card card-pad">
          <h3>Marketplace rules</h3>
          <label className="checkbox-row mt-1"><input type="checkbox" checked={form.allowSellerSignup} onChange={set('allowSellerSignup')} /> Allow seller registration</label>
          <label className="checkbox-row mt-1"><input type="checkbox" checked={form.autoApproveProducts} onChange={set('autoApproveProducts')} /> Auto-approve new listings (skip moderation)</label>
          <div className="callout callout-danger mt-2"><span>⛔</span><div>Auto-approving skips the human review step. We recommend keeping it off so every listing is checked for fair pricing.</div></div>
          <label className="checkbox-row mt-2"><input type="checkbox" checked={form.maintenanceMode} onChange={set('maintenanceMode')} /> Maintenance mode (hide storefront)</label>
          {form.maintenanceMode && <div className="callout mt-1"><span>⚠️</span><div>The API will keep working; toggle this only during maintenance windows.</div></div>}
        </div>
      </div>
    </div>
  );
}