'use client';

import { useEffect, useState } from 'react';
import { api, fmtError } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { formatDate } from '@/lib/format';
import { Spinner, Pagination } from '@/components/ui';

const empty = { name: '', email: '', password: '', phone: '', shopName: '', bio: '', role: 'buyer', status: 'active' };

export default function AdminUsers() {
  const { user, toast } = useApp();
  const [data, setData] = useState(null);
  const [role, setRole] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState(null); // { mode, id }
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);

  const load = () => {
    const p = new URLSearchParams({ page: String(page), limit: '20' });
    if (role) p.set('role', role);
    if (q) p.set('q', q);
    api(`/admin/users?${p.toString()}`).then(setData).catch(() => setData([]));
  };
  useEffect(() => { load(); }, [role, q, page]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    if (!form.name.trim() || !form.email.trim() || (editor?.mode === 'new' && !form.password)) {
      return toast(editor?.mode === 'new' ? 'Name, email and password are required' : 'Name and email are required', 'error');
    }
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        shopName: form.shopName.trim(),
        bio: form.bio.trim(),
        role: form.role,
        status: form.status,
      };
      if (form.password) payload.password = form.password;
      if (editor.mode === 'new') await api('/admin/users', { method: 'POST', body: payload });
      else await api(`/admin/users/${editor.id}`, { method: 'PATCH', body: payload });
      toast(editor.mode === 'new' ? 'User created' : 'User updated', 'success');
      setEditor(null);
      load();
    } catch (err) { toast(fmtError(err), 'error'); } finally { setBusy(false); }
  };

  const del = async (u) => {
    if (u._id === user._id) return toast('You cannot delete your own account', 'error');
    if (!window.confirm(`Permanently delete ${u.name} and archive their listings?`)) return;
    try {
      await api(`/admin/users/${u._id}`, { method: 'DELETE' });
      toast('User deleted', 'success');
      load();
    } catch (err) { toast(fmtError(err), 'error'); }
  };

  const openNew = () => {
    setForm({ ...empty, role: 'seller' });
    setEditor({ mode: 'new' });
  };

  const openEdit = (u) => {
    setForm({
      name: u.name, email: u.email, password: '', phone: u.phone || '',
      shopName: u.shopName || '', bio: u.bio || '', role: u.role, status: u.status || 'active',
    });
    setEditor({ mode: 'edit', id: u._id });
  };

  return (
    <div>
      <div className="admin-head">
        <h1>Users</h1>
        <div className="filters">
          <input className="input" placeholder="Search name / email…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} style={{ maxWidth: 220 }} />
          <select className="select" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
            <option value="">All roles</option>
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
            <option value="admin">Admin</option>
          </select>
          <button className="btn" onClick={openNew}>+ New user</button>
        </div>
      </div>

      {!data ? <Spinner /> : data.data.length === 0 ? <div className="card card-pad">No users found.</div> : (
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>User</th><th>Joined</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {data.data.map((u) => (
                <tr key={u._id}>
                  <td>
                    <b className="small">{u.name} {u._id === user._id ? '(you)' : ''}</b>
                    <div className="small muted">{u.email}</div>
                    {u.shopName && <div className="small muted">🏪 {u.shopName}</div>}
                  </td>
                  <td className="small muted">{formatDate(u.createdAt)}</td>
                  <td><span className={`badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'seller' ? 'badge-warn' : 'badge-info'}`}>{u.role}</span></td>
                  <td><span className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{u.status}</span></td>
                  <td>
                    <div className="flex" style={{ flexWrap: 'wrap', gap: 4 }}>
                      <button className="btn btn-outline btn-xs" onClick={() => openEdit(u)}>Edit</button>
                      <button className="btn btn-danger btn-xs" onClick={() => del(u)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.pagination && <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={setPage} small />}

      {/* New / edit user */}
      {editor && (
        <div className="admin-editor">
          <div className="admin-editor-head">
            <h2>{editor.mode === 'new' ? 'New user' : 'Edit user'}</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditor(null)}>✕</button>
          </div>
          <div className="table-wrap">
            <div className="form-grid">
              <div className="field"><label>Name *</label><input className="input" value={form.name} onChange={set('name')} /></div>
              <div className="field"><label>Email *</label><input className="input" type="email" value={form.email} onChange={set('email')} /></div>
              <div className="field"><label>Phone</label><input className="input" value={form.phone} onChange={set('phone')} /></div>
              <div className="field"><label>Shop name</label><input className="input" value={form.shopName} onChange={set('shopName')} /></div>
              <div className="field"><label>Role</label>
                <select className="select" value={form.role} onChange={set('role')}>
                  <option value="buyer">buyer</option>
                  <option value="seller">seller</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              <div className="field"><label>Status</label>
                <select className="select" value={form.status} onChange={set('status')}>
                  <option value="active">active</option>
                  <option value="suspended">suspended</option>
                </select>
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}><label>Password {editor.mode === 'new' ? '*' : '(leave blank to keep)'}</label><input className="input" type="password" value={form.password} onChange={set('password')} /></div>
              <div className="field" style={{ gridColumn: '1 / -1' }}><label>Bio</label><input className="input" value={form.bio} onChange={set('bio')} /></div>
            </div>
            <button className="btn btn-block" onClick={save} disabled={busy}>{busy ? 'Saving…' : editor.mode === 'new' ? 'Create user' : 'Save changes'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
