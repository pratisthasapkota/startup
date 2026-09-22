'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, fmtError, uploadImages } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { formatMoney, formatDate } from '@/lib/format';
import { Spinner, EmptyState } from '@/components/ui';

const CONDITIONS = ['new', 'like-new', 'used', 'refurbished', 'for-parts'];

export default function SellPage() {
  const router = useRouter();
  const { user, booted, toast, settings } = useApp();
  const [cats, setCats] = useState([]);
  const [mine, setMine] = useState(null);
  const [form, setForm] = useState({
    title: '', shortDescription: '', description: '', price: '', compareAtPrice: '', stock: 1,
    category: '', condition: 'new', brand: '', tags: '', specs: '', images: [],
  });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadCats = () => api('/categories', { auth: false }).then((r) => setCats(r.data.filter((c) => c.isActive))).catch(() => {});

  useEffect(() => {
    if (booted && !user) { router.push('/login?next=/sell'); return; }
    if (user && !['seller', 'admin'].includes(user.role)) {
      toast('You need a seller account to list items', 'warn');
      router.push('/register?next=/sell');
      return;
    }
    loadCats();
    api('/products/mine/list').then((r) => setMine(r.data)).catch(() => setMine([]));
  }, [booted, user, router, toast]);

  if (!booted || !user) return <Spinner />;
  if (!['seller', 'admin'].includes(user.role)) return <div className="container"><EmptyState icon="🏷️" title="Become a seller" desc="Create a seller account to list your Arduino, ESP32-CAM, books and hardware." action={<Link className="btn" href="/register">Create seller account</Link>} /></div>;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await uploadImages(files);
      setForm((f) => ({ ...f, images: [...f.images, ...urls].slice(0, 6) }));
    } catch (err) {
      toast(fmtError(err), 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.category) return toast('Please pick a category', 'warn');
    setBusy(true);
    try {
      const specLines = form.specs.split('\n').map((l) => l.split(':')).filter(([k, v]) => k?.trim() && v?.trim());
      const specs = {};
      specLines.forEach(([k, v]) => (specs[k.trim()] = v.trim()));
      await api('/products', {
        method: 'POST',
        body: {
          title: form.title,
          shortDescription: form.shortDescription,
          description: form.description,
          price: Number(form.price),
          compareAtPrice: Number(form.compareAtPrice) || 0,
          stock: Number(form.stock),
          category: form.category,
          condition: form.condition,
          brand: form.brand || 'Generic',
          tags: form.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
          images: form.images,
          specs,
        },
      });
      toast(user.role === 'admin' ? 'Product published!' : 'Product submitted for review', 'success');
      setForm({ title: '', shortDescription: '', description: '', price: '', compareAtPrice: '', stock: 1, category: form.category, condition: 'new', brand: '', tags: '', specs: '', images: [] });
      api('/products/mine/list').then((r) => setMine(r.data)).catch(() => {});
    } catch (err) {
      toast(fmtError(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container">
      <div className="page-head"><h1 className="page-title">Sell an item</h1></div>
      <div className="section cart-wrap" style={{ paddingTop: 14, gridTemplateColumns: '1.6fr 1fr' }}>
        <form className="card card-pad" onSubmit={submit}>
          <h3>Listing details</h3>
          <div className="mt-1">
            <div className="field"><label>Title *</label><input className="input" required minLength={3} maxLength={140} value={form.title} onChange={set('title')} placeholder="e.g. Arduino Uno R3 (compatible)" /></div>
            <div className="field"><label>Short description</label><input className="input" maxLength={220} value={form.shortDescription} onChange={set('shortDescription')} placeholder="One-liner shown in listings" /></div>
            <div className="field"><label>Full description *</label><textarea className="textarea" required minLength={10} maxLength={5000} value={form.description} onChange={set('description')} placeholder="Condition, what's included, compatibility…" /></div>

            <div className="form-grid">
              <div className="field"><label>Price (NPR) *</label><input className="input" type="number" required min={0} value={form.price} onChange={set('price')} /></div>
              <div className="field"><label>Compare-at price (optional)</label><input className="input" type="number" min={0} value={form.compareAtPrice} onChange={set('compareAtPrice')} /></div>
              <div className="field"><label>Stock *</label><input className="input" type="number" required min={0} value={form.stock} onChange={set('stock')} /></div>
              <div className="field"><label>Category *</label><select className="select" required value={form.category} onChange={set('category')}>
                <option value="">Select…</option>
                {cats.map((c) => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
              </select></div>
              <div className="field"><label>Condition</label><select className="select" value={form.condition} onChange={set('condition')}>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select></div>
              <div className="field"><label>Brand</label><input className="input" value={form.brand} onChange={set('brand')} placeholder="e.g. Arduino, Espressif" /></div>
              <div className="field" style={{ gridColumn: '1 / -1' }}><label>Tags (comma separated)</label><input className="input" value={form.tags} onChange={set('tags')} placeholder="arduino, iot, sensor" /></div>
              <div className="field" style={{ gridColumn: '1 / -1' }}><label>Specifications (one per line: Key: Value)</label><textarea className="textarea" value={form.specs} onChange={set('specs')} placeholder={'Chipset: ESP32\nCamera: OV2640\nWiFi: Yes'} /></div>
            </div>

            <div className="field">
              <label>Photos (up to 6)</label>
              <input className="input" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple onChange={onFiles} disabled={uploading} />
              <div className="hint">{uploading ? 'Uploading…' : 'JPEG, PNG, WEBP, GIF, AVIF · max 5 MB each'}</div>
              {form.images.length > 0 && (
                <div className="flex mt-1" style={{ flexWrap: 'wrap' }}>
                  {form.images.map((src, i) => (
                    <div key={i} style={{ position: 'relative', width: 64, height: 64 }}>
                      <img src={src} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--line)' }} />
                      <button type="button" className="btn btn-danger btn-xs" style={{ position: 'absolute', top: -6, right: -6 }} onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button className="btn btn-lg" disabled={busy || uploading}>{busy ? 'Submitting…' : user.role === 'admin' ? 'Publish product' : 'Submit for review'}</button>
          <div className="hint mt-1">{user.role === 'admin' ? 'You are admin — this goes live immediately.' : 'Listings are checked by our team before going live. You will be notified of the outcome.'}</div>
        </form>

        <div>
          <div className="card card-pad mb-2">
            <b>How selling works</b>
            <p className="small muted" style={{ marginBottom: 0 }}>
              We list your item on VoltMart and handle the sale. When it sells you get paid — VoltMart keeps
              <b style={{ color: 'var(--ink)' }}> {settings.commissionRate ?? 10}%</b> commission, you receive the rest.
            </p>
          </div>

          <div className="card card-pad mb-2">
            <b>Fair-pricing tips</b>
            <ul className="small muted" style={{ paddingLeft: 18, marginBottom: 0 }}>
              <li>Compare with the shop price before you set yours.</li>
              <li>Used items: 50–70% of new price is reasonable.</li>
              <li>Include genuine condition details in the description.</li>
              <li>Honest listings get approved faster and sell faster.</li>
            </ul>
          </div>

          <div className="section-head" style={{ marginBottom: 10 }}><div><h3 style={{ fontSize: 17, margin: 0 }}>My listings</h3></div></div>
          <div className="card">
            {!mine ? <Spinner /> : mine.length === 0 ? (
              <div className="card-pad muted small" style={{ textAlign: 'center' }}>You haven't listed anything yet.</div>
            ) : mine.map((p) => (
              <div key={p._id} style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)' }}>
                <div className="flex-between">
                  <b className="small">{p.title}</b>
                  <span className={`badge ${p.status === 'approved' ? 'badge-success' : p.status === 'rejected' ? 'badge-danger' : p.status === 'archived' ? '' : 'badge-warn'}`}>{p.status}</span>
                </div>
                <div className="small muted mt-1">{formatMoney(p.price, p.currency)} · stock {p.stock} · {formatDate(p.createdAt)}</div>
                {p.status === 'rejected' && p.rejectionReason && <div className="small mt-1" style={{ color: 'var(--danger)' }}>Rejected: {p.rejectionReason}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}