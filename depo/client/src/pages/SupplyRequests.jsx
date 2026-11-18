import { useState } from 'react';
import api, { errMsg } from '../api/client';
import useFetch from '../hooks/useFetch';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Button, ConfirmDialog, DataTable, Field, FormActions, Input, Modal, PageHeader, Select, StatusPill } from '../components/ui';
import { fmtDate } from '../utils/format';

function RequestForm({ onClose, onSaved }) {
  const toast = useToast();
  const { data: products } = useFetch('/products');
  const { data: warehouses } = useFetch('/warehouses');
  const [f, setF] = useState({ product: '', warehouse: '', quantity: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/supply-requests', { ...f, quantity: Number(f.quantity) });
      toast.success('Supply request submitted');
      onSaved();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Product" hint={products && !products.length ? 'No products are linked to your account yet' : undefined}>
        <Select required value={f.product} onChange={set('product')}>
          <option value="">Select a product</option>
          {products?.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
        </Select>
      </Field>
      <Field label="Deliver to warehouse">
        <Select required value={f.warehouse} onChange={set('warehouse')}>
          <option value="">Select a warehouse</option>
          {warehouses?.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
        </Select>
      </Field>
      <Field label="Quantity"><Input type="number" min="1" step="1" required value={f.quantity} onChange={set('quantity')} /></Field>
      <FormActions onCancel={onClose} busy={busy} submitLabel="Submit request" />
    </form>
  );
}

export default function SupplyRequests() {
  const { user } = useAuth();
  const toast = useToast();
  const supplier = user.role === 'supplier';
  const [status, setStatus] = useState('');
  const { data, loading, reload } = useFetch('/supply-requests', { status });
  const [creating, setCreating] = useState(false);
  const [reject, setReject] = useState(null);
  const [busy, setBusy] = useState(false);

  async function review(r, next) {
    setBusy(true);
    try {
      await api.put(`/supply-requests/${r._id}/status`, { status: next });
      toast.success(next === 'Approved' ? 'Approved and stock added to the warehouse' : 'Request rejected');
      setReject(null);
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
        title="Supply requests"
        subtitle={supplier ? 'Submit stock you can supply and track each decision.' : 'Approving a request adds the quantity to the warehouse and records a stock in transaction.'}
        action={supplier && <Button onClick={() => setCreating(true)}>New request</Button>}
      />
      <div className="mb-4">
        <Select className="max-w-[200px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['Pending', 'Approved', 'Rejected'].map((s) => <option key={s}>{s}</option>)}
        </Select>
      </div>
      <DataTable
        loading={loading}
        rows={data}
        empty="No supply requests found"
        columns={[
          { key: 'd', header: 'Date', render: (r) => <span className="text-mute">{fmtDate(r.createdAt)}</span> },
          ...(!supplier ? [{ key: 's', header: 'Supplier', render: (r) => r.supplier?.name }] : []),
          { key: 'p', header: 'Product', render: (r) => <div><p className="font-medium">{r.product?.name}</p><p className="text-xs text-mute">{r.product?.sku}</p></div> },
          { key: 'w', header: 'Warehouse', render: (r) => r.warehouse?.name },
          { key: 'q', header: 'Quantity', className: 'text-right', render: (r) => <span className="font-semibold">{r.quantity}</span> },
          { key: 'st', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
          { key: 'rb', header: 'Reviewed by', render: (r) => <span className="text-mute">{r.reviewedBy?.name || 'Not yet'}</span> },
          ...(!supplier ? [{ key: 'a', header: '', className: 'text-right', render: (r) => r.status === 'Pending' && (
            <div className="flex justify-end gap-2">
              <Button size="sm" disabled={busy} onClick={() => review(r, 'Approved')}>Approve</Button>
              <Button size="sm" variant="danger" disabled={busy} onClick={() => setReject(r)}>Reject</Button>
            </div>
          ) }] : []),
        ]}
      />
      <Modal open={creating} title="New supply request" onClose={() => setCreating(false)}>
        {creating && <RequestForm onClose={() => setCreating(false)} onSaved={() => { setCreating(false); reload(); }} />}
      </Modal>
      <ConfirmDialog open={!!reject} danger busy={busy} title="Reject request" message={`Reject the request for ${reject?.quantity} units of ${reject?.product?.name}?`} confirmLabel="Reject request" onConfirm={() => review(reject, 'Rejected')} onClose={() => setReject(null)} />
    </>
  );
}
