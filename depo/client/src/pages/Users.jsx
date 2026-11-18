import { useState } from 'react';
import api, { errMsg } from '../api/client';
import useFetch, { useDebounce } from '../hooks/useFetch';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Button, ConfirmDialog, DataTable, Field, FormActions, ImageUploader, Input, Modal, PageHeader, Select, StatusPill, Thumb } from '../components/ui';
import { ROLE_LABEL } from '../utils/format';

const EMPTY = { name: '', email: '', phone: '', password: '', role: 'salesRepresentative', assignedWarehouses: [], image: '', imageFileId: '' };

function UserForm({ user, warehouses, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState(user ? { ...EMPTY, ...user, password: '', assignedWarehouses: (user.assignedWarehouses || []).map((w) => w._id) } : EMPTY);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggleWh = (id) => setF({ ...f, assignedWarehouses: f.assignedWarehouses.includes(id) ? f.assignedWarehouses.filter((x) => x !== id) : [...f.assignedWarehouses, id] });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const body = { ...f };
    if (!body.password) delete body.password;
    try {
      if (user) await api.put(`/users/${user._id}`, body);
      else await api.post('/users', body);
      toast.success(user ? 'User updated' : 'User created');
      onSaved();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name"><Input required value={f.name} onChange={set('name')} /></Field>
        <Field label="Email"><Input type="email" required value={f.email} onChange={set('email')} /></Field>
        <Field label="Phone"><Input value={f.phone || ''} onChange={set('phone')} /></Field>
        <Field label={user ? 'New password' : 'Password'} hint={user ? 'Leave blank to keep the current one' : 'At least 6 characters'}>
          <Input type="password" minLength={6} required={!user} value={f.password} onChange={set('password')} />
        </Field>
      </div>
      <Field label="Role">
        <Select value={f.role} onChange={set('role')}>
          {Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </Field>
      {f.role === 'warehouseManager' && (
        <div>
          <span className="mb-1.5 block text-sm font-medium">Assigned warehouses</span>
          <div className="space-y-1 rounded-md border border-line p-3">
            {warehouses?.length ? warehouses.map((w) => (
              <label key={w._id} className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" className="accent-[#1B4332]" checked={f.assignedWarehouses.includes(w._id)} onChange={() => toggleWh(w._id)} />
                {w.name} <span className="text-mute">{w.location}</span>
              </label>
            )) : <p className="text-sm text-mute">Create a warehouse first</p>}
          </div>
        </div>
      )}
      <ImageUploader label={f.role === 'supplier' ? 'Supplier logo' : 'Profile picture'} folder="users" value={f.image} onChange={({ url, fileId }) => setF({ ...f, image: url, imageFileId: fileId })} />
      <FormActions onCancel={onClose} busy={busy} submitLabel={user ? 'Save changes' : 'Create user'} />
    </form>
  );
}

export default function Users() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const dq = useDebounce(q);
  const { data: users, loading, reload } = useFetch('/users', { q: dq, role });
  const { data: warehouses } = useFetch('/warehouses');
  const [editing, setEditing] = useState(null);
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      await api.delete(`/users/${del._id}`);
      toast.success('User deleted');
      setDel(null);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Users and roles" subtitle="Create accounts, set roles and assign warehouses to managers." action={<Button onClick={() => setEditing({})}>Add user</Button>} />
      <div className="mb-4 flex flex-wrap gap-3">
        <Input className="max-w-xs" placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select className="max-w-[220px]" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          {Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </div>
      <DataTable
        loading={loading}
        rows={users}
        empty="No users match your search"
        columns={[
          { key: 'n', header: 'User', render: (u) => (
            <div className="flex items-center gap-3"><Thumb src={u.image} name={u.name} size="h-9 w-9" /><div><p className="font-medium">{u.name}</p><p className="text-xs text-mute">{u.email}</p></div></div>
          ) },
          { key: 'r', header: 'Role', render: (u) => ROLE_LABEL[u.role] },
          { key: 'w', header: 'Warehouses', render: (u) => <span className="text-mute">{u.assignedWarehouses?.map((w) => w.name).join(', ') || 'None'}</span> },
          { key: 'p', header: 'Phone', render: (u) => <span className="text-mute">{u.phone || 'None'}</span> },
          { key: 'a', header: '', className: 'text-right', render: (u) => (
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(u)}>Edit</Button>
              {u._id !== me._id && <Button size="sm" variant="danger" onClick={() => setDel(u)}>Delete</Button>}
            </div>
          ) },
        ]}
      />
      <Modal open={!!editing} wide title={editing?._id ? 'Edit user' : 'Add user'} onClose={() => setEditing(null)}>
        {editing && <UserForm user={editing._id ? editing : null} warehouses={warehouses} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      </Modal>
      <ConfirmDialog open={!!del} danger busy={busy} title="Delete user" message={`Delete ${del?.name}? Their account and profile image will be removed.`} confirmLabel="Delete user" onConfirm={remove} onClose={() => setDel(null)} />
    </>
  );
}
