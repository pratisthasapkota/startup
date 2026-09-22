'use client';

import { useEffect, useState } from 'react';
import { api, fmtError } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { Spinner, Modal } from '@/components/ui';

const EMOJIS = ['🔌', '📷', '🌡️', '🤖', '🔋', '🔧', '📚', '💡', '🧩', '🛰️', '🎛️', '📡'];

export default function AdminCategories() {
  const { toast } = useApp();
  const [cats, setCats] = useState(null);
  const [open, setOpen] = useState(null);
  const [form, setForm] = useState({ name: '', icon: '🔌', description: '', order: 0, isActive: true });

  const load = () => {
    api('/categories', { auth: false }).then((r) => setCats(r.data)).catch(() => setCats([]));
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ name: '', icon: '🔌', description: '', order: 0, isActive: true }); setOpen({ mode: 'new' }); };
  const openEdit = (c) => { setForm({ name: c.name, icon: c.icon || '🔌', description: c.description || '', order: c.order || 0, isActive: c.isActive }); setOpen({ mode: 'edit', id: c._id }); };

  const save = async () => {
    try {
      if (open.mode === 'new') await api('/categories', { method: 'POST', body: form });
      else await api(`/categories/${open.id}`, { method: 'PUT', body: form });
      toast('Category saved', 'success');
      setOpen(null);
      load();
    } catch (err) { toast(fmtError(err), 'error'); }
  };

  const del = async (c) => {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    try {
      await api(`/categories/${c._id}`, { method: 'DELETE' });
      toast('Category deleted', 'success');
      load();
    } catch (err) { toast(fmtError(err), 'error'); }
  };

  return (
    <div>
      <div className="admin-head">
        <h1>Categories</h1>
        <button className="btn" onClick={openNew}>+ New category</button>
      </div>

      {!cats ? <Spinner /> : (
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th></th><th>Name</th><th>Slug</th><th>Products</th><th>Order</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {cats.map((c) => (
                <tr key={c._id}>
                  <td style={{ fontSize: 20 }}>{c.icon}</td>
                  <td><b className="small">{c.name}</b>{c.description ? <div className="small muted">{c.description}</div> : null}</td>
                  <td className="monospace muted">{c.slug}</td>
                  <td><span className="badge">{c.productCount}</span></td>
                  <td>{c.order}</td>
                  <td><span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`}>{c.isActive ? 'active' : 'hidden'}</span></td>
                  <td>
                    <div className="flex">
                      <button className="btn btn-outline btn-xs" onClick={() => openEdit(c)}>Edit</button>
                      <button className="btn btn-danger btn-xs" onClick={() => del(c)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.mode === 'new' ? 'New category' : 'Edit category'}>
        <div className="field"><label>Name *</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="field"><label>Icon</label>
          <div className="flex" style={{ flexWrap: 'wrap', gap: 6 }}>
            {EMOJIS.map((e) => (
              <button type="button" key={e} className="btn btn-outline btn-sm" style={{ fontSize: 16, background: form.icon === e ? 'var(--primary-50)' : undefined, borderColor: form.icon === e ? 'var(--primary)' : undefined }} onClick={() => setForm({ ...form, icon: e })}>{e}</button>
            ))}
          </div>
        </div>
        <div className="field"><label>Description</label><textarea className="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="form-grid">
          <div className="field"><label>Display order</label><input className="input" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} /></div>
          <div className="field"><label>&nbsp;</label><label className="checkbox-row"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label></div>
        </div>
        <button className="btn btn-block" onClick={save}>Save category</button>
      </Modal>
    </div>
  );
}