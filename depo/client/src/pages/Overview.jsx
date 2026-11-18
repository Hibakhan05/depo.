import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useFetch from '../hooks/useFetch';
import { Button, Card, DataTable, PageHeader, PageLoader, StatCard, StatusPill } from '../components/ui';
import { fmtDate, rs } from '../utils/format';

export default function Overview() {
  const { user } = useAuth();
  const ops = ['admin', 'warehouseManager'].includes(user.role);
  const { data: stats, loading } = useFetch('/stats');
  const { data: low } = useFetch(ops ? '/stock/low' : null);
  const { data: orders } = useFetch(user.role !== 'supplier' ? '/orders' : null);
  const { data: reqs } = useFetch(user.role === 'supplier' ? '/supply-requests' : null);

  const hour = new Date().getHours();
  const part = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const action = {
    salesRepresentative: <Link to="/orders/new"><Button>Create order</Button></Link>,
    warehouseManager: <Link to="/inventory"><Button>Record stock</Button></Link>,
    supplier: <Link to="/supply-requests"><Button>Submit supply request</Button></Link>,
    admin: <Link to="/users"><Button>Manage users</Button></Link>,
  }[user.role];

  if (loading) return <PageLoader />;
  return (
    <>
      <PageHeader title={`Good ${part}, ${user.name.split(' ')[0]}`} subtitle="Here is where things stand today." action={action} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats?.cards.map((c) => <StatCard key={c.label} label={c.label} tone={c.tone} value={c.money ? rs(c.value) : c.value} />)}
      </div>

      <div className="mt-10 grid gap-8 xl:grid-cols-2">
        {ops && (
          <section>
            <h2 className="mb-3 font-display text-lg font-bold">Low stock</h2>
            <DataTable
              empty="Every product is above its limit"
              rows={(low || []).slice(0, 5)}
              columns={[
                { key: 'p', header: 'Product', render: (r) => <span className="font-medium">{r.product.name}</span> },
                { key: 'w', header: 'Warehouse', render: (r) => <span className="text-mute">{r.warehouse.name}</span> },
                { key: 'q', header: 'Available', className: 'text-right', render: (r) => <span className="font-semibold text-bronze">{r.quantity}</span> },
                { key: 'l', header: 'Limit', className: 'text-right', render: (r) => r.product.lowStockLimit },
              ]}
            />
          </section>
        )}
        {user.role !== 'supplier' && (
          <section>
            <h2 className="mb-3 font-display text-lg font-bold">Recent orders</h2>
            <DataTable
              empty="No orders yet"
              rows={(orders || []).slice(0, 5)}
              columns={[
                { key: 'n', header: 'Order', render: (r) => <Link className="font-medium text-forest underline" to={`/orders/${r._id}`}>{r.orderNumber}</Link> },
                { key: 'c', header: 'Customer', render: (r) => r.customerName },
                { key: 't', header: 'Total', className: 'text-right', render: (r) => rs(r.totalAmount) },
                { key: 's', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
              ]}
            />
          </section>
        )}
        {user.role === 'supplier' && (
          <section className="xl:col-span-2">
            <h2 className="mb-3 font-display text-lg font-bold">Recent supply requests</h2>
            <DataTable
              empty="You have not submitted any requests"
              rows={(reqs || []).slice(0, 5)}
              columns={[
                { key: 'd', header: 'Date', render: (r) => fmtDate(r.createdAt) },
                { key: 'p', header: 'Product', render: (r) => r.product?.name },
                { key: 'w', header: 'Warehouse', render: (r) => r.warehouse?.name },
                { key: 'q', header: 'Quantity', className: 'text-right', render: (r) => r.quantity },
                { key: 's', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
              ]}
            />
          </section>
        )}
      </div>
      {user.role === 'admin' && <Card className="mt-8 p-5 text-sm text-mute">Create warehouse managers in Users, then assign warehouses to them so they can record stock.</Card>}
    </>
  );
}
