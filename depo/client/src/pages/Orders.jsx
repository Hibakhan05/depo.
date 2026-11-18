import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg } from '../api/client';
import useFetch, { useDebounce } from '../hooks/useFetch';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Button, Card, ConfirmDialog, DataTable, Input, PageHeader, PageLoader, Select, StatusPill, Thumb } from '../components/ui';
import { fmtDate, fmtDateTime, rs } from '../utils/format';

// Buttons depend on role and status. The API enforces the same rules again.
function OrderActions({ order, onChanged }) {
  const { user } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null); // 'cancel'

  async function run(request, message) {
    setBusy(true);
    try {
      await request();
      toast.success(message);
      setConfirm(null);
      onChanged();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }
  const setStatus = (status, msg) => run(() => api.put(`/orders/${order._id}/status`, { status }), msg);
  const cancelOwn = () => run(() => api.put(`/orders/${order._id}/cancel`), 'Order cancelled');
  const staff = ['admin', 'warehouseManager'].includes(user.role);

  return (
    <div className="flex justify-end gap-2">
      {staff && order.status === 'Pending' && <Button size="sm" disabled={busy} onClick={() => setStatus('Processing', 'Order is processing and stock was deducted')}>Process</Button>}
      {staff && order.status === 'Processing' && <Button size="sm" disabled={busy} onClick={() => setStatus('Completed', 'Order completed')}>Mark completed</Button>}
      {order.status === 'Pending' && <Button size="sm" variant="danger" disabled={busy} onClick={() => setConfirm('cancel')}>Cancel order</Button>}
      <ConfirmDialog
        open={confirm === 'cancel'} danger busy={busy} title="Cancel order" confirmLabel="Cancel order"
        message={`Cancel ${order.orderNumber}? This cannot be undone.`}
        onConfirm={() => (staff ? setStatus('Cancelled', 'Order cancelled') : cancelOwn())}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}

export function Orders() {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const dq = useDebounce(q);
  const { data, loading, reload } = useFetch('/orders', { q: dq, status });
  const rep = user.role === 'salesRepresentative';
  return (
    <>
      <PageHeader title={rep ? 'My orders' : 'Orders'} subtitle="Track every sales order and its status." action={rep && <Link to="/orders/new"><Button>New order</Button></Link>} />
      <div className="mb-4 flex flex-wrap gap-3">
        <Input className="max-w-xs" placeholder="Search by order or customer" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select className="max-w-[200px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['Pending', 'Processing', 'Completed', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}
        </Select>
      </div>
      <DataTable
        loading={loading}
        rows={data}
        empty="No orders found"
        columns={[
          { key: 'n', header: 'Order', render: (o) => <Link to={`/orders/${o._id}`} className="font-medium text-forest underline">{o.orderNumber}</Link> },
          { key: 'c', header: 'Customer', render: (o) => <div><p>{o.customerName}</p><p className="text-xs text-mute">{o.customerPhone}</p></div> },
          { key: 'w', header: 'Warehouse', render: (o) => <span className="text-mute">{o.warehouse?.name}</span> },
          ...(!rep ? [{ key: 'b', header: 'Sales rep', render: (o) => <span className="text-mute">{o.createdBy?.name}</span> }] : []),
          { key: 'i', header: 'Items', className: 'text-right', render: (o) => o.products.reduce((n, p) => n + p.quantity, 0) },
          { key: 't', header: 'Total', className: 'text-right', render: (o) => <span className="font-semibold">{rs(o.totalAmount)}</span> },
          { key: 's', header: 'Status', render: (o) => <StatusPill status={o.status} /> },
          { key: 'd', header: 'Date', render: (o) => <span className="text-mute">{fmtDate(o.createdAt)}</span> },
          { key: 'a', header: '', render: (o) => <OrderActions order={o} onChanged={reload} /> },
        ]}
      />
    </>
  );
}

export function OrderDetail() {
  const { id } = useParams();
  const { data: o, loading, reload } = useFetch(`/orders/${id}`);
  if (loading || !o) return <PageLoader />;
  return (
    <>
      <PageHeader title={o.orderNumber} subtitle={`Placed ${fmtDateTime(o.createdAt)}`} action={<StatusPill status={o.status} />} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <dl className="space-y-4 text-sm">
            <div><dt className="text-mute">Customer</dt><dd className="font-medium">{o.customerName}</dd></div>
            <div><dt className="text-mute">Phone</dt><dd className="font-medium">{o.customerPhone || 'None'}</dd></div>
            <div><dt className="text-mute">Fulfilled from</dt><dd className="font-medium">{o.warehouse?.name}</dd></div>
            <div><dt className="text-mute">Created by</dt><dd className="font-medium">{o.createdBy?.name}</dd></div>
          </dl>
          <div className="mt-6 border-t border-line pt-4"><OrderActions order={o} onChanged={reload} /></div>
        </Card>
        <div className="lg:col-span-2">
          <DataTable
            rows={o.products}
            columns={[
              { key: 'p', header: 'Product', render: (l) => <div className="flex items-center gap-3"><Thumb src={l.product?.imageUrl} name={l.product?.name} /><div><p className="font-medium">{l.product?.name}</p><p className="text-xs text-mute">{l.product?.sku}</p></div></div> },
              { key: 'q', header: 'Quantity', className: 'text-right', render: (l) => l.quantity },
              { key: 'u', header: 'Unit price', className: 'text-right', render: (l) => rs(l.price) },
              { key: 't', header: 'Line total', className: 'text-right', render: (l) => <span className="font-semibold">{rs(l.quantity * l.price)}</span> },
            ]}
          />
          <div className="mt-3 flex justify-end">
            <p className="rounded-lg border border-line bg-white px-5 py-3 text-right"><span className="text-sm text-mute">Grand total</span> <span className="ml-4 font-display text-xl font-bold">{rs(o.totalAmount)}</span></p>
          </div>
        </div>
      </div>
    </>
  );
}
