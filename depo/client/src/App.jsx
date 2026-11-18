import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import Unauthorized from './pages/public/Unauthorized';
import Overview from './pages/Overview';
import Users from './pages/Users';
import Products from './pages/Products';
import Warehouses from './pages/Warehouses';
import Inventory from './pages/Inventory';
import { Transactions, LowStock } from './pages/Ledger';
import { Orders, OrderDetail } from './pages/Orders';
import NewOrder from './pages/NewOrder';
import SupplyRequests from './pages/SupplyRequests';
import Profile from './pages/Profile';

const A = 'admin', M = 'warehouseManager', S = 'supplier', R = 'salesRepresentative';
const guard = (roles, el) => <ProtectedRoute roles={roles}>{el}</ProtectedRoute>;

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Overview />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/users" element={guard([A], <Users />)} />
        <Route path="/products" element={<Products />} />
        <Route path="/warehouses" element={guard([A, M], <Warehouses />)} />
        <Route path="/inventory" element={guard([A, M], <Inventory />)} />
        <Route path="/transactions" element={guard([A, M], <Transactions />)} />
        <Route path="/low-stock" element={guard([A, M], <LowStock />)} />
        <Route path="/orders" element={guard([A, M, R], <Orders />)} />
        <Route path="/orders/new" element={guard([R], <NewOrder />)} />
        <Route path="/orders/:id" element={guard([A, M, R], <OrderDetail />)} />
        <Route path="/supply-requests" element={guard([A, M, S], <SupplyRequests />)} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
