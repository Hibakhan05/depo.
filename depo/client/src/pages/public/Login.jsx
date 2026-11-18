import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { errMsg } from '../../api/client';
import { Button, Field, Input } from '../../components/ui';
import AuthShell from './AuthShell';

const TEST = [
  ['Admin', 'admin@depo.com', 'Admin@123'],
  ['Manager', 'manager@depo.com', 'Manager@123'],
  ['Supplier', 'supplier@depo.com', 'Supplier@123'],
  ['Sales', 'sales@depo.com', 'Sales@123'],
];

export default function Login() {
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Sign in" subtitle="Welcome back. Enter your details to open your workspace.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email"><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" /></Field>
        <Field label="Password"><Input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Signing in' : 'Sign in'}</Button>
      </form>
      <p className="mt-6 text-sm text-mute">New here? <Link to="/register" className="font-medium text-forest underline">Create an account</Link></p>
      <div className="mt-8 border-t border-line pt-5">
        <p className="mb-2 text-xs text-mute">Test accounts. Select one to fill the form.</p>
        <div className="flex flex-wrap gap-2">
          {TEST.map(([label, email, password]) => (
            <button key={email} type="button" onClick={() => setForm({ email, password })} className="cursor-pointer rounded-full border border-line bg-white px-3 py-1 text-xs text-ink hover:bg-canvas">{label}</button>
          ))}
        </div>
      </div>
    </AuthShell>
  );
}
