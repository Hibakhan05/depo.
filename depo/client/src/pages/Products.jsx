import { useMemo, useState } from 'react';
import api, { errMsg } from '../api/client';
import useFetch, { useDebounce } from '../hooks/useFetch';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Button, ConfirmDialog, DataTable, Field, FormActions, ImageUploader, Input, Modal, PageHeader, PageLoader, Select, StatusPill, Textarea, Thumb } from '../components/ui';
import { rs } from '../utils/format';

const EMPTY = { name: '', sku: '', category: '', price: '', lowStockLimit: 10, supplier: '', description: '', imageUrl: '', imageFileId: '' };

function ProductForm({ product, onClose, onSaved }) {
  const toast = useToast();
  const { data: suppliers } = useFetch('/users/suppliers');
  const [f, setF] = useState(product ? { ...EMPTY, ...product, supplier: product.supplier?._id || '' } : EMPTY);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (!product && !f.imageFileId) return toast.error('Upload a product image first');
    setBusy(true);
    try {
      const body = { ...f, price: Number(f.price), lowStockLimit: Number(f.lowStockLimit) };
      if (product) await api.put(`/products/${product._id}`, body);
      else await api.post('/products', body);
      toast.success(product ? 'Product updated' : 'Product created');
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
        <Field label="Product name"><Input required value={f.name} onChange={set('name')} /></Field>
        <Field label="SKU"><Input required value={f.sku} onChange={set('sku')} placeholder="LAP-001" /></Field>
        <Field label="Category"><Input value={f.category} onChange={set('category')} placeholder="Accessories" /></Field>
        <Field label="Supplier">
          <Select value={f.supplier} onChange={set('supplier')}>
            <option value="">No supplier</option>
            {suppliers?.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </Select>
        </Field>
        <Field label="Price in Rs."><Input type="number" min="0" required value={f.price} onChange={set('price')} /></Field>
        <Field label="Low stock limit" hint="Alerts start at or below this quantity"><Input type="number" min="0" required value={f.lowStockLimit} onChange={set('lowStockLimit')} /></Field>
      </div>
      <Field label="Description"><Textarea value={f.description || ''} onChange={set('description')} /></Field>
      <ImageUploader label="Product image" folder="products" value={f.imageUrl} onChange={({ url, fileId }) => setF({ ...f, imageUrl: url, imageFileId: fileId })} />
      <FormActions onCancel={onClose} busy={busy} submitLabel={product ? 'Save changes' : 'Create product'} />
    </form>
  );
}

function Details({ id }) {
  const { data: p, loading } = useFetch(`/products/${id}`);
  if (loading || !p) return <PageLoader />;
  return (
    <div className="space-y-5">
      <div className="flex gap-4">
        <Thumb src={p.imageUrl} name={p.name} size="h-24 w-24" />
        <div>
          <h3 className="font-display text-xl font-bold">{p.name}</h3>
          <p className="text-sm text-mute">{p.sku} &nbsp;{p.category}</p>
          <p className="mt-2 text-lg font-semibold">{rs(p.price)}</p>
        </div>
      </div>
      {p.description && <p className="text-sm text-mute">{p.description}</p>}
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-mute">Supplier</dt><dd className="font-medium">{p.supplier?.name || 'None'}</dd></div>
        <div><dt className="text-mute">Low stock limit</dt><dd className="font-medium">{p.lowStockLimit}</dd></div>
      </dl>
      <div>
        <h4 className="mb-2 text-sm font-semibold">Available by warehouse</h4>
        {p.stock.length ? (
          <ul className="divide-y divide-line rounded-md border border-line text-sm">
            {p.stock.map((s) => (
              <li key={s._id} className="flex items-center justify-between px-3 py-2">
                <span>{s.warehouse?.name}</span>
                <span className={s.quantity <= p.lowStockLimit ? 'font-semibold text-bronze' : 'font-semibold'}>{s.quantity}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-mute">No stock recorded yet</p>}
        <p className="mt-2 text-sm text-mute">Total available: <span className="font-semibold text-ink">{p.available}</span></p>
      </div>
    </div>
  );
}

export default function Products() {
  const { user } = useAuth();
  const toast = useToast();
  const canEdit = ['admin', 'warehouseManager'].includes(user.role);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const dq = useDebounce(q);
  const { data: products, loading, reload } = useFetch('/products', { q: dq, category });
  const { data: all } = useFetch('/products');
  const categories = useMemo(() => [...new Set((all || []).map((p) => p.category).filter(Boolean))].sort(), [all]);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      await api.delete(`/products/${del._id}`);
      toast.success('Product deleted');
      setDel(null);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  const title = user.role === 'supplier' ? 'My products' : user.role === 'salesRepresentative' ? 'Find products' : 'Products';
  const columns = [
    { key: 'n', header: 'Product', render: (p) => (
      <div className="flex items-center gap-3"><Thumb src={p.imageUrl} name={p.name} /><div><p className="font-medium">{p.name}</p><p className="text-xs text-mute">{p.category}</p></div></div>
    ) },
    { key: 's', header: 'SKU', render: (p) => <span className="text-mute">{p.sku}</span> },
    { key: 'p', header: 'Price', className: 'text-right', render: (p) => rs(p.price) },
    { key: 'a', header: 'Available', className: 'text-right', render: (p) => (
      <span className={p.available <= p.lowStockLimit ? 'font-semibold text-bronze' : 'font-semibold'}>{p.available}</span>
    ) },
    ...(user.role !== 'supplier' ? [{ key: 'sup', header: 'Supplier', render: (p) => <span className="text-mute">{p.supplier?.name || 'None'}</span> }] : []),
    ...(canEdit ? [{ key: 'x', header: '', className: 'text-right', render: (p) => (
      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="outline" onClick={() => setEditing(p)}>Edit</Button>
        {user.role === 'admin' && <Button size="sm" variant="danger" onClick={() => setDel(p)}>Delete</Button>}
      </div>
    ) }] : []),
  ];

  return (
    <>
      <PageHeader title={title} subtitle="Select a product to see stock in every warehouse." action={canEdit && <Button onClick={() => setEditing({})}>Add product</Button>} />
      <div className="mb-4 flex flex-wrap gap-3">
        <Input className="max-w-xs" placeholder="Search by name or SKU" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select className="max-w-[200px]" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </Select>
      </div>
      <DataTable loading={loading} rows={products} columns={columns} empty="No products found" onRowClick={(p) => setViewing(p._id)} />
      <Modal open={!!editing} wide title={editing?._id ? 'Edit product' : 'Add product'} onClose={() => setEditing(null)}>
        {editing && <ProductForm product={editing._id ? editing : null} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      </Modal>
      <Modal open={!!viewing} title="Product details" onClose={() => setViewing(null)}>{viewing && <Details id={viewing} />}</Modal>
      <ConfirmDialog open={!!del} danger busy={busy} title="Delete product" message={`Delete ${del?.name}? Its image and empty stock records will be removed.`} confirmLabel="Delete product" onConfirm={remove} onClose={() => setDel(null)} />
    </>
  );
}
