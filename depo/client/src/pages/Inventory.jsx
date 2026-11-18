import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { errMsg } from '../api/client';
import useFetch from '../hooks/useFetch';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Button, DataTable, Field, FormActions, Input, Modal, PageHeader, Select, StatusPill, Thumb } from '../components/ui';

function MovementForm({ mode, defaults, warehouses, rows, onClose, onDone }) {
  const toast = useToast();
  const { data: products } = useFetch('/products');
  const [f, setF] = useState({ warehouse: defaults.warehouse || warehouses[0]?._id || '', product: defaults.product || '', quantity: '', note: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const available = rows.find((r) => r.warehouse?._id === f.warehouse && r.product?._id === f.product)?.quantity ?? 0;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/stock/${mode}`, { ...f, quantity: Number(f.quantity) });
      toast.success(mode === 'in' ? 'Stock received' : 'Stock removed');
      onDone();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Warehouse">
        <Select required value={f.warehouse} onChange={set('warehouse')}>
          {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
        </Select>
      </Field>
      <Field label="Product" hint={f.product ? `Currently available here: ${available}` : undefined}>
        <Select required value={f.product} onChange={set('product')}>
          <option value="">Select a product</option>
          {products?.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
        </Select>
      </Field>
      <Field label="Quantity"><Input type="number" min="1" step="1" required value={f.quantity} onChange={set('quantity')} /></Field>
      <Field label="Note"><Input value={f.note} onChange={set('note')} placeholder={mode === 'in' ? 'Delivery reference' : 'Reason for removal'} /></Field>
      <FormActions onCancel={onClose} busy={busy} submitLabel={mode === 'in' ? 'Receive stock' : 'Remove stock'} />
    </form>
  );
}

export default function Inventory() {
  const { user } = useAuth();
  const manager = user.role === 'warehouseManager';
  const [params, setParams] = useSearchParams();
  const warehouse = params.get('warehouse') || '';
  const [q, setQ] = useState('');
  const { data: warehouses } = useFetch('/warehouses');
  const { data: rows, loading, reload } = useFetch('/stock');
  const [modal, setModal] = useState(null); // { mode, defaults }

  const filtered = useMemo(
    () => (rows || []).filter((r) =>
      (!warehouse || r.warehouse?._id === warehouse) &&
      (!q || `${r.product?.name} ${r.product?.sku}`.toLowerCase().includes(q.toLowerCase()))
    ),
    [rows, warehouse, q]
  );
  const open = (mode, r) => setModal({ mode, defaults: { warehouse: r?.warehouse._id || warehouse, product: r?.product._id } });

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="Live stock by warehouse."
        action={manager && <><Button variant="outline" onClick={() => open('out')}>Stock out</Button><Button onClick={() => open('in')}>Stock in</Button></>}
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <Input className="max-w-xs" placeholder="Search by name or SKU" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select className="max-w-[240px]" value={warehouse} onChange={(e) => setParams(e.target.value ? { warehouse: e.target.value } : {})}>
          <option value="">All warehouses</option>
          {warehouses?.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
        </Select>
      </div>
      <DataTable
        loading={loading}
        rows={filtered}
        empty="No stock recorded for this selection"
        columns={[
          { key: 'p', header: 'Product', render: (r) => <div className="flex items-center gap-3"><Thumb src={r.product?.imageUrl} name={r.product?.name} /><div><p className="font-medium">{r.product?.name}</p><p className="text-xs text-mute">{r.product?.sku}</p></div></div> },
          { key: 'w', header: 'Warehouse', render: (r) => <span className="text-mute">{r.warehouse?.name}</span> },
          { key: 'q', header: 'Quantity', className: 'text-right', render: (r) => <span className="font-semibold">{r.quantity}</span> },
          { key: 'l', header: 'Limit', className: 'text-right', render: (r) => r.product?.lowStockLimit },
          { key: 's', header: 'Status', render: (r) => <StatusPill status={r.quantity <= r.product?.lowStockLimit ? 'Low stock' : 'In stock'} /> },
          ...(manager ? [{ key: 'a', header: '', className: 'text-right', render: (r) => (
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => open('in', r)}>Add</Button>
              <Button size="sm" variant="outline" onClick={() => open('out', r)}>Remove</Button>
            </div>
          ) }] : []),
        ]}
      />
      <Modal open={!!modal} title={modal?.mode === 'in' ? 'Stock in' : 'Stock out'} onClose={() => setModal(null)}>
        {modal && <MovementForm {...modal} warehouses={warehouses || []} rows={rows || []} onClose={() => setModal(null)} onDone={() => { setModal(null); reload(); }} />}
      </Modal>
    </>
  );
}
