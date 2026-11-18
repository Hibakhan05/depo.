import { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brand, Button, Thumb, cx } from '../components/ui';
import { ROLE_LABEL } from '../utils/format';

const NAV = {
  admin: [['/dashboard', 'Overview'], ['/users', 'Users'], ['/products', 'Products'], ['/warehouses', 'Warehouses'], ['/inventory', 'Inventory'], ['/transactions', 'Transactions'], ['/orders', 'All orders'], ['/low-stock', 'Low stock'], ['/supply-requests', 'Supply requests']],
  warehouseManager: [['/dashboard', 'Overview'], ['/warehouses', 'My warehouses'], ['/inventory', 'Inventory'], ['/products', 'Products'], ['/transactions', 'Stock history'], ['/low-stock', 'Low stock'], ['/orders', 'Orders'], ['/supply-requests', 'Supply requests']],
  supplier: [['/dashboard', 'Overview'], ['/products', 'My products'], ['/supply-requests', 'Supply requests'], ['/profile', 'Profile and logo']],
  salesRepresentative: [['/dashboard', 'Overview'], ['/products', 'Find products'], ['/orders/new', 'New order'], ['/orders', 'My orders']],
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const items = NAV[user.role] || [];

  return (
    <div className="min-h-screen">
      {open && <div className="fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-white transition-[width,transform] duration-200',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          collapsed ? 'lg:w-[72px]' : 'lg:w-64'
        )}
      >
        <div className={cx('flex h-16 items-center border-b border-line px-5', collapsed && 'lg:justify-center lg:px-0')}>
          <Link to="/dashboard"><Brand className={collapsed ? 'text-2xl' : 'text-3xl'} /></Link>
        </div>
        {!collapsed && <p className="hidden px-5 pt-3 text-xs leading-relaxed text-mute lg:block">Zero blind spots in your supply chain.</p>}
        <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3">
          {items.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end
              title={label}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cx(
                  'flex items-center gap-3 rounded-md border-l-2 px-3 py-2.5 text-sm transition-colors',
                  isActive ? 'border-forest bg-canvas font-semibold text-ink' : 'border-transparent text-mute hover:bg-canvas hover:text-ink',
                  collapsed && 'lg:justify-center lg:px-0'
                )
              }
            >
              <span className={cx('hidden h-6 w-6 shrink-0 place-items-center rounded bg-canvas text-xs font-semibold', collapsed && 'lg:grid')}>{label.charAt(0)}</span>
              <span className={cx(collapsed && 'lg:hidden')}>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="mx-3 mb-3 hidden cursor-pointer rounded-md border border-line py-2 text-xs text-mute hover:text-ink lg:block"
        >
          {collapsed ? 'Expand' : 'Collapse sidebar'}
        </button>
      </aside>

      <div className={cx('transition-[padding] duration-200', collapsed ? 'lg:pl-[72px]' : 'lg:pl-64')}>
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-canvas/90 px-4 backdrop-blur sm:px-8">
          <button onClick={() => setOpen(true)} className="cursor-pointer rounded p-2 text-ink lg:hidden" aria-label="Open menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <span className="hidden text-sm text-mute lg:block">{ROLE_LABEL[user.role]}</span>
          <div className="flex items-center gap-3">
            <Link to="/profile" className="flex items-center gap-2.5">
              <Thumb src={user.image} name={user.name} size="h-9 w-9" />
              <span className="hidden text-sm font-medium sm:block">{user.name}</span>
            </Link>
            <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/login'); }}>Sign out</Button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
