import { useState } from 'react';
import api, { errMsg } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Card, Field, ImageUploader, Input, PageHeader } from '../components/ui';
import { ROLE_LABEL } from '../utils/format';

export default function Profile() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const supplier = user.role === 'supplier';
  const [f, setF] = useState({ name: user.name, phone: user.phone || '', password: '', image: user.image || '', imageFileId: user.imageFileId || '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const body = { ...f };
    if (!body.password) delete body.password;
    try {
      await api.put(`/users/${user._id}`, body);
      await refresh();
      setF((s) => ({ ...s, password: '' }));
      toast.success('Profile saved');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title={supplier ? 'Supplier profile' : 'Your profile'} subtitle={ROLE_LABEL[user.role]} />
      <Card className="max-w-xl p-6">
        <form onSubmit={submit} className="space-y-4">
          <ImageUploader label={supplier ? 'Supplier logo' : 'Profile picture'} folder="users" value={f.image} onChange={({ url, fileId }) => setF({ ...f, image: url, imageFileId: fileId })} />
          <Field label={supplier ? 'Company name' : 'Full name'}><Input required value={f.name} onChange={set('name')} /></Field>
          <Field label="Email"><Input value={user.email} disabled /></Field>
          <Field label="Phone"><Input value={f.phone} onChange={set('phone')} /></Field>
          <Field label="New password" hint="Leave blank to keep the current one"><Input type="password" minLength={6} value={f.password} onChange={set('password')} /></Field>
          <Button type="submit" disabled={busy}>{busy ? 'Saving' : 'Save changes'}</Button>
        </form>
      </Card>
    </>
  );
}
