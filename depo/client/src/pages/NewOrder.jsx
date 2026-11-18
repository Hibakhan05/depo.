import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api/client';
import useFetch from '../hooks/useFetch';
import { useToast } from '../context/ToastContext';
import { Button, Card, DataTable, Field, Input, PageHeader, Select, Thumb } from '../components/ui';
import { rs } from '../utils/format';

export default function NewOrder() {
  const toast = useToast();
  const navigate = useNavigate();
  const { data: warehouses } = useFetch('/warehouses');
  const [warehouse, setWarehouse] = useState('');
  const { data: stock, loading } = useFetch(warehouse ? '/stock' : null, { warehouse });
  const [customer, setCustomer] = useState({ customerName: '', customerPhone: '' });
  const [q, setQ] = useState('');
  const [cart, setCart] = useState({}); // productId -> quantity
  const [busy, setBusy] = useState(false);

  const available = useMemo(() => (stock || []).filter((s) => s.quantity > 0), [stock]);
  const visible = available.filter((s) => !q || `${s.product.name} ${s.product.sku}`.toLowerCase().includes(q.toLowerCase()));
  const lines = available.filter((s) => cart[s.product._id]).map((s) => ({ ...s, qty: cart[s.product._id] }));
  const total = lines.reduce((n, l) => n + l.qty * l.product.price, 0);

  const setQty = (s, v) => {
    const qty = Math.max(0, Math.min(s.quantity, Math.floor(Number(v) || 0)));
    setCart((c) => { const n = { ...c }; if (qty) n[s.product._id] = qty; else delete n[s.product._id]; return n; });
  };
  const changeWarehouse = (id) => { setWarehouse(id); setCart({}); };

  async function submit(e) {
    e.preventDefault();
    if (!lines.length) return toast.error('Add at least one product');
    setBusy(true);
    try {
      const { data } = await api.post('/orders', { ...customer, warehouse, items: lines.map((l) => ({ product: l.product._id, quantity: l.qty })) });
      toast.success(`Order ${data.orderNumber} created`);
      navigate(`/orders/${data._id}`);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="New sales order" subtitle="Choose a warehouse, then add products. Stock is checked when you submit." />
      <form onSubmit={submit} className="grid gap-6 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-3">
          <Card className="grid gap-4 p-5 sm:grid-cols-3">
            <Field label="Customer name"><Input required value={customer.customerName} onChange={(e) => setCustomer({ ...customer, customerName: e.target.value })} /></Field>
            <Field label="Customer phone"><Input value={customer.customerPhone} onChange={(e) => setCustomer({ ...customer, customerPhone: e.target.value })} /></Field>
            <Field label="Warehouse">
              <Select required value={warehouse} onChange={(e) => changeWarehouse(e.target.value)}>
                <option value="">Select warehouse</option>
                {warehouses?.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
              </Select>
            </Field>
          </Card>
          {warehouse && (
            <>
              <Input placeholder="Search by name or SKU" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
              <DataTable
                loading={loading}
                rows={visible}
                empty="No products in stock at this warehouse"
                columns={[
                  { key: 'p', header: 'Product', render: (s) => <div className="flex items-center gap-3"><Thumb src={s.product.imageUrl} name={s.product.name} /><div><p className="font-medium">{s.product.name}</p><p className="text-xs text-mute">{s.product.sku}</p></div></div> },
                  { key: 'pr', header: 'Price', className: 'text-right', render: (s) => rs(s.product.price) },
                  { key: 'a', header: 'Available', className: 'text-right', render: (s) => <span className={s.quantity <= s.product.lowStockLimit ? 'font-semibold text-bronze' : 'font-semibold'}>{s.quantity}</span> },
                  { key: 'x', header: '', className: 'text-right', render: (s) => (
                    <Button type="button" size="sm" variant="outline" onClick={() => setQty(s, (cart[s.product._id] || 0) + 1)}>Add</Button>
                  ) },
                ]}
              />
            </>
          )}
        </div>
        <Card className="h-fit p-5 xl:col-span-2">
          <h2 className="font-display text-lg font-bold">Order summary</h2>
          {!lines.length ? (
            <p className="py-8 text-center text-sm text-mute">Products you add appear here</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {lines.map((l) => (
                <li key={l.product._id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{l.product.name}</p>
                    <p className="text-xs text-mute">{rs(l.product.price)} each</p>
                  </div>
                  <Input type="number" min="0" max={l.quantity} value={l.qty} onChange={(e) => setQty(l, e.target.value)} className="w-20 text-right" aria-label={`Quantity of ${l.product.name}`} />
                  <p className="w-24 text-right text-sm font-semibold">{rs(l.qty * l.product.price)}</p>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
            <span className="text-sm text-mute">Grand total</span>
            <span className="font-display text-2xl font-bold">{rs(total)}</span>
          </div>
          <Button type="submit" className="mt-5 w-full" disabled={busy || !lines.length}>{busy ? 'Creating order' : 'Create order'}</Button>
        </Card>
      </form>
    </>
  );
}
