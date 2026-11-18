export const rs = (n) => `Rs. ${Number(n || 0).toLocaleString('en-US')}`;
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
export const fmtDateTime = (d) =>
  new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
export const ROLE_LABEL = {
  admin: 'Admin',
  warehouseManager: 'Warehouse Manager',
  supplier: 'Supplier',
  salesRepresentative: 'Sales Representative',
};
