import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api/client';
import useFetch from '../hooks/useFetch';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Button, ConfirmDialog, DataTable, Field, FormActions, Input, Modal, PageHeader, Select } from '../components/ui';

function WarehouseForm({ warehouse, onClose, onSaved }) {
  const toast = useToast();
  const { data: managers } = useFetch('/users', { role: 'warehouseManager' });
  const [f, setF] = useState({ name: warehouse?.name || '', location: warehouse?.location || '', capacity: warehouse?.capacity || '', manager: warehouse?.manager?._id || '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { ...f, capacity: Number(f.capacity) || 0 };
      if (warehouse) await api.put(`/warehouses/${warehouse._id}`, body);
      else await api.post('/warehouses', body);
      toast.success(warehouse ? 'Warehouse updated' : 'Warehouse created');
      onSaved();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Warehouse name"><Input required value={f.name} onChange={set('name')} /></Field>
      <Field label="Location"><Input required value={f.location} onChange={set('location')} /></Field>
      <Field label="Capacity in units" hint="Use 0 for no limit"><Input type="number" min="0" value={f.capacity} onChange={set('capacity')} /></Field>
      <Field label="Manager">
        <Select value={f.manager} onChange={set('manager')}>
          <option value="">Unassigned</option>
          {managers?.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
        </Select>
      </Field>
      <FormActions onCancel={onClose} busy={busy} submitLabel={warehouse ? 'Save changes' : 'Create warehouse'} />
    </form>
  );
}

export default function Warehouses() {
  const { user } = useAuth();
  const toast = useToast();
  const admin = user.role === 'admin';
  const { data, loading, reload } = useFetch('/warehouses');
  const [editing, setEditing] = useState(null);
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      await api.delete(`/warehouses/${del._id}`);
      toast.success('Warehouse deleted');
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
      <PageHeader
        title={admin ? 'Warehouses' : 'My warehouses'}
        subtitle={admin ? 'Locations, capacity and managers.' : 'Warehouses assigned to you.'}
        action={admin && <Button onClick={() => setEditing({})}>Add warehouse</Button>}
      />
      <DataTable
        loading={loading}
        rows={data}
        empty={admin ? 'No warehouses yet' : 'No warehouse has been assigned to you yet'}
        columns={[
          { key: 'n', header: 'Warehouse', render: (w) => <div><p className="font-medium">{w.name}</p><p className="text-xs text-mute">{w.location}</p></div> },
          { key: 'm', header: 'Manager', render: (w) => <span className="text-mute">{w.manager?.name || 'Unassigned'}</span> },
          { key: 'u', header: 'Units stored', className: 'text-right', render: (w) => w.units },
          { key: 'c', header: 'Capacity used', render: (w) => {
            if (!w.capacity) return <span className="text-mute">No limit</span>;
            const pct = Math.min(100, Math.round((w.units / w.capacity) * 100));
            return (
              <div className="w-40">
                <div className="h-1.5 rounded-full bg-canvas"><div className={`h-1.5 rounded-full ${pct > 90 ? 'bg-bronze' : 'bg-forest'}`} style={{ width: `${pct}%` }} /></div>
                <p className="mt-1 text-xs text-mute">{w.units} of {w.capacity} units</p>
              </div>
            );
          } },
          { key: 'a', header: '', className: 'text-right', render: (w) => (
            <div className="flex justify-end gap-2">
              <Link to={`/inventory?warehouse=${w._id}`}><Button size="sm" variant="outline">Inventory</Button></Link>
              {admin && <Button size="sm" variant="outline" onClick={() => setEditing(w)}>Edit</Button>}
              {admin && <Button size="sm" variant="danger" onClick={() => setDel(w)}>Delete</Button>}
            </div>
          ) },
        ]}
      />
      <Modal open={!!editing} title={editing?._id ? 'Edit warehouse' : 'Add warehouse'} onClose={() => setEditing(null)}>
        {editing && <WarehouseForm warehouse={editing._id ? editing : null} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      </Modal>
      <ConfirmDialog open={!!del} danger busy={busy} title="Delete warehouse" message={`Delete ${del?.name}? This only works when it holds no stock.`} confirmLabel="Delete warehouse" onConfirm={remove} onClose={() => setDel(null)} />
    </>
  );
}
