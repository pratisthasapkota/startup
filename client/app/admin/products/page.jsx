'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, fmtError } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { formatMoney, formatDate } from '@/lib/format';
import { Spinner, EmptyState, Pagination, Modal } from '@/components/ui';

const STATUSES = ['', 'pending', 'approved', 'rejected', 'archived'];
const CONDITIONS = ['new', 'like-new', 'used', 'refurbished', 'for-parts'];

const emptyForm = {
  title: '', price: '', compareAtPrice: '', stock: 1, category: '',
  condition: 'new', brand: 'Generic', shortDescription: '', description: '',
  imagesText: '', tagsText: '', featured: false,
};

export default function AdminProducts() {
  const { toast } = useApp();
  const [data, setData] = useState(null);
  const [cats, setCats] = useState([]);
  const [status, setStatus] = useState('pending');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [reject, setReject] = useState(null);
  const [reason, setReason] = useState('');
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  const load = () => {
    const p = new URLSearchParams({ page: String(page), limit: '15' });
    if (status) p.set('status', status);
    if (q) p.set('q', q);
    api(`/admin/products?${p.toString()}`).then(setData).catch(() => setData([]));
  };

  useEffect(() => { load(); }, [status, q, page]);

  useEffect(() => {
    api('/categories', { auth: false }).then((r) => setCats(r.data)).catch(() => {});
  }, []);

  const act = async (fn) => {
    try {
      await fn();
      toast('Updated', 'success');
      setReject(null);
      setReason('');
      load();
    } catch (err) { toast(fmtError(err), 'error'); }
  };

  const approve = (id) => act(() => api(`/admin/products/${id}/moderate`, { method: 'PATCH', body: { status: 'approved' } }));
  const archive = (id) => act(() => api(`/admin/products/${id}/moderate`, { method: 'PATCH', body: { status: 'archived' } }));
  const feature = (id) => act(() => api(`/admin/products/${id}/featured`, { method: 'PATCH' }));

  const doReject = () => {
    if (!reason.trim()) return toast('Add a rejection reason', 'warn');
    act(() => api(`/admin/products/${reject._id}/moderate`, { method: 'PATCH', body: { status: 'rejected', rejectionReason: reason } }));
  };

  const delProduct = (p) => {
    if (!window.confirm(`Permanently delete product "${p.title}"? This cannot be undone.`)) return;
    act(() => api(`/products/${p._id}`, { method: 'DELETE' }).then(() => toast('Product deleted', 'success')));
  };

  const openNew = () => {
    setForm(emptyForm);
    setEditor({ mode: 'new' });
  };

  const openEdit = (p) => {
    setForm({
      title: p.title || '',
      price: String(p.price ?? ''),
      compareAtPrice: String(p.compareAtPrice || ''),
      stock: p.stock ?? 1,
      category: p.category?._id || p.category || '',
      condition: p.condition || 'new',
      brand: p.brand || 'Generic',
      shortDescription: p.shortDescription || '',
      description: p.description || '',
      imagesText: (p.images || []).join('\n'),
      tagsText: (p.tags || []).join(', '),
      featured: !!p.featured,
    });
    setEditor({ mode: 'edit', id: p._id });
  };

  const saveProduct = async () => {
    setBusy(true);
    try {
      if (!form.title.trim() || form.description.trim().length < 10) {
        throw new Error('Title is required and description must be at least 10 characters');
      }
      if (!form.category) throw new Error('Please pick a category');
      const payload = {
        title: form.title.trim(),
        price: Number(form.price),
        compareAtPrice: Number(form.compareAtPrice || 0),
        stock: Number(form.stock),
        category: form.category,
        condition: form.condition,
        brand: form.brand.trim() || 'Generic',
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim(),
        images: form.imagesText.split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean).slice(0, 6),
        tags: form.tagsText.split(/[\s,]+/).map((s) => s.trim().toLowerCase()).filter(Boolean).slice(0, 15),
        featured: form.featured,
      };
      if (editor.mode === 'new') {
        await api('/products', { method: 'POST', body: payload });
        toast('Product created and approved', 'success');
      } else {
        await api(`/products/${editor.id}`, { method: 'PUT', body: payload });
        toast('Product updated', 'success');
      }
      setEditor(null);
      load();
    } catch (err) { toast(fmtError(err), 'error'); } finally { setBusy(false); }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  return (
    <div>
      <div className="admin-head">
        <h1>Products</h1>
        <div className="filters">
          <input className="input" placeholder="Search title…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} style={{ maxWidth: 220 }} />
          <div className="seg">
            {STATUSES.map((s) => (
              <button key={s || 'all'} className={status === s ? 'on' : ''} onClick={() => { setStatus(s); setPage(1); }}>{s || 'all'}</button>
            ))}
          </div>
          <button className="btn" onClick={openNew}>+ New product</button>
        </div>
      </div>

      {!data ? <Spinner /> : data.data.length === 0 ? <EmptyState icon="📦" title="No products match" /> : (
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Product</th><th>Seller</th><th>Price</th><th>Stock</th><th>Status</th><th style={{ width: 300 }}>Actions</th></tr>
            </thead>
            <tbody>
              {data.data.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      {p.images?.[0] ? <img src={p.images[0]} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} /> : null}
                      <div>
                        <div style={{ fontWeight: 600, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                        <span className="small muted">{formatDate(p.createdAt)} {p.featured ? '· ⭐' : ''}</span>
                      </div>
                    </div>
                  </td>
                  <td className="small">{p.seller?.shopName || p.seller?.name}{p.seller?.email ? <div className="muted">{p.seller.email}</div> : null}</td>
                  <td>{formatMoney(p.price)}</td>
                  <td><span className={`badge ${p.stock <= 3 ? 'badge-danger' : 'badge-success'}`}>{p.stock}</span></td>
                  <td><span className={`badge ${p.status === 'approved' ? 'badge-success' : p.status === 'rejected' || p.status === 'archived' ? 'badge-danger' : 'badge-warn'}`}>{p.status}</span></td>
                  <td>
                    <div className="flex" style={{ flexWrap: 'wrap', gap: 4 }}>
                      <Link className="btn btn-outline btn-xs" href={`/product/${p._id}`}>View</Link>
                      <button className="btn btn-outline btn-xs" onClick={() => openEdit(p)}>Edit</button>
                      {p.status !== 'approved' && <button className="btn btn-success btn-xs" onClick={() => approve(p._id)}>Approve</button>}
                      {p.status === 'approved' && <button className="btn btn-danger btn-xs" onClick={() => archive(p._id)}>Archive</button>}
                      {p.status !== 'rejected' && <button className="btn btn-outline btn-xs" onClick={() => setReject(p)}>Reject</button>}
                      <button className={`btn btn-xs ${p.featured ? 'btn-accent' : 'btn-outline'}`} onClick={() => feature(p._id)}>{p.featured ? '★ Featured' : 'Feature'}</button>
                      <button className="btn btn-danger btn-xs" onClick={() => delProduct(p)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.pagination && <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={setPage} small />}

      <Modal open={!!reject} onClose={() => setReject(null)} title={`Reject "${reject?.title}"`}>
        <div className="field"><label>Reason (shown to the seller)</label><textarea className="textarea" required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Price above fair market value — please adjust below Rs. X" /></div>
        <button className="btn btn-danger btn-block" onClick={doReject}>Reject product</button>
      </Modal>

      <Modal open={!!editor} onClose={() => setEditor(null)} title={editor?.mode === 'new' ? 'New product' : 'Edit product'} lg>
        <div className="form-grid">
          <div className="field" style={{ gridColumn: '1 / -1' }}><label>Title *</label><input className="input" value={form.title} onChange={set('title')} placeholder="Arduino Uno R3 (Compatible)" /></div>
          <div className="field"><label>Price (Rs) *</label><input className="input" type="number" min={0} value={form.price} onChange={set('price')} /></div>
          <div className="field"><label>Compare-at price</label><input className="input" type="number" min={0} value={form.compareAtPrice} onChange={set('compareAtPrice')} /></div>
          <div className="field"><label>Stock *</label><input className="input" type="number" min={0} value={form.stock} onChange={set('stock')} /></div>
          <div className="field">
            <label>Category *</label>
            <select className="select" value={form.category} onChange={set('category')}>
              <option value="">Select…</option>
              {cats.map((c) => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Condition</label>
            <select className="select" value={form.condition} onChange={set('condition')}>
              {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field"><label>Brand</label><input className="input" value={form.brand} onChange={set('brand')} /></div>
          <div className="field"><label className="checkbox-row" style={{ marginTop: 28 }}><input type="checkbox" checked={form.featured} onChange={set('featured')} /> Featured product</label></div>
          <div className="field" style={{ gridColumn: '1 / -1' }}><label>Short description</label><input className="input" maxLength={220} value={form.shortDescription} onChange={set('shortDescription')} /></div>
          <div className="field" style={{ gridColumn: '1 / -1' }}><label>Description * (min 10 chars)</label><textarea className="textarea" rows={4} value={form.description} onChange={set('description')} /></div>
          <div className="field" style={{ gridColumn: '1 / -1' }}><label>Image URLs (one per line)</label><textarea className="textarea" rows={3} value={form.imagesText} onChange={set('imagesText')} placeholder="https://…/photo.jpg" /></div>
          <div className="field" style={{ gridColumn: '1 / -1' }}><label>Tags (comma separated)</label><input className="input" value={form.tagsText} onChange={set('tagsText')} placeholder="arduino, uno, board" /></div>
        </div>
        <button className="btn btn-block" onClick={saveProduct} disabled={busy}>{busy ? 'Saving…' : editor?.mode === 'new' ? 'Create product' : 'Save changes'}</button>
      </Modal>
    </div>
  );
}