import { useState } from 'react';
import useFetch from '../hooks/useFetch';
import { DataTable, PageHeader, Select, StatusPill, Thumb } from '../components/ui';
import { fmtDateTime } from '../utils/format';

export function Transactions() {
  const [type, setType] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const { data: warehouses } = useFetch('/warehouses');
  const { data, loading } = useFetch('/transactions', { type, warehouse });
  return (
    <>
      <PageHeader title="Stock transactions" subtitle="Every addition and removal, newest first." />
      <div className="mb-4 flex flex-wrap gap-3">
        <Select className="max-w-[200px]" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All movements</option>
          <option value="stock-in">Stock in</option>
          <option value="stock-out">Stock out</option>
        </Select>
        <Select className="max-w-[240px]" value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
          <option value="">All warehouses</option>
          {warehouses?.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
        </Select>
      </div>
      <DataTable
        loading={loading}
        rows={data}
        empty="No transactions recorded"
        columns={[
          { key: 'd', header: 'Date', render: (t) => <span className="text-mute">{fmtDateTime(t.date)}</span> },
          { key: 'p', header: 'Product', render: (t) => <div><p className="font-medium">{t.product?.name}</p><p className="text-xs text-mute">{t.product?.sku}</p></div> },
          { key: 'w', header: 'Warehouse', render: (t) => t.warehouse?.name },
          { key: 't', header: 'Type', render: (t) => <StatusPill status={t.transactionType === 'stock-in' ? 'Stock in' : 'Stock out'} /> },
          { key: 'q', header: 'Quantity', className: 'text-right', render: (t) => <span className="font-semibold">{t.transactionType === 'stock-in' ? '+' : '-'}{t.quantity}</span> },
          { key: 'n', header: 'Note', render: (t) => <span className="text-mute">{t.note || 'None'}</span> },
          { key: 'b', header: 'By', render: (t) => t.performedBy?.name },
        ]}
      />
    </>
  );
}

export function LowStock() {
  const { data, loading } = useFetch('/stock/low');
  return (
    <>
      <PageHeader title="Low stock" subtitle="Products at or below their limit in a warehouse." />
      <DataTable
        loading={loading}
        rows={data}
        empty="Every product is above its low stock limit"
        columns={[
          { key: 'p', header: 'Product', render: (r) => <div className="flex items-center gap-3"><Thumb src={r.product.imageUrl} name={r.product.name} /><div><p className="font-medium">{r.product.name}</p><p className="text-xs text-mute">{r.product.sku}</p></div></div> },
          { key: 'w', header: 'Warehouse', render: (r) => r.warehouse.name },
          { key: 'q', header: 'Available', className: 'text-right', render: (r) => <span className="font-semibold text-bronze">{r.quantity}</span> },
          { key: 'l', header: 'Limit', className: 'text-right', render: (r) => r.product.lowStockLimit },
          { key: 'g', header: 'Shortfall', className: 'text-right', render: (r) => r.product.lowStockLimit - r.quantity },
          { key: 's', header: 'Status', render: () => <StatusPill status="Low stock" /> },
        ]}
      />
    </>
  );
}
