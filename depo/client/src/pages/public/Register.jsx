import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { errMsg } from '../../api/client';
import { Button, Field, Input, Select } from '../../components/ui';
import AuthShell from './AuthShell';

export default function Register() {
  const { user, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'salesRepresentative' });
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Choose the role that matches your work. Admin accounts are created by an administrator.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name"><Input required value={form.name} onChange={set('name')} /></Field>
        <Field label="Email"><Input type="email" required value={form.email} onChange={set('email')} /></Field>
        <Field label="Phone"><Input value={form.phone} onChange={set('phone')} /></Field>
        <Field label="Password" hint="At least 6 characters"><Input type="password" required minLength={6} value={form.password} onChange={set('password')} /></Field>
        <Field label="Role">
          <Select value={form.role} onChange={set('role')}>
            <option value="salesRepresentative">Sales Representative</option>
            <option value="warehouseManager">Warehouse Manager</option>
            <option value="supplier">Supplier</option>
          </Select>
        </Field>
        <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Creating account' : 'Create account'}</Button>
      </form>
      <p className="mt-6 text-sm text-mute">Already registered? <Link to="/login" className="font-medium text-forest underline">Sign in</Link></p>
    </AuthShell>
  );
}
