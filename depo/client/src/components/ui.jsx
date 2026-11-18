import { useEffect, useRef, useState } from 'react';
import { uploadImage, validateImage } from '../api/upload';
import { errMsg } from '../api/client';
import { useToast } from '../context/ToastContext';

export const cx = (...a) => a.filter(Boolean).join(' ');

export function Brand({ className = 'text-2xl' }) {
  return <span className={cx('font-display font-extrabold lowercase tracking-tight', className)}>depø.</span>;
}

export function Button({ variant = 'primary', size = 'md', className, ...p }) {
  const v = {
    primary: 'bg-forest text-white hover:bg-[#143225]',
    outline: 'border border-line bg-white text-ink hover:bg-canvas',
    ghost: 'text-mute hover:bg-canvas hover:text-ink',
    danger: 'border border-[#FECACA] bg-white text-[#B91C1C] hover:bg-[#FEE2E2]',
  }[variant];
  const s = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm';
  return (
    <button
      {...p}
      className={cx('inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50', v, s, className)}
    />
  );
}

const inputCls =
  'w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-mute/70 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest disabled:bg-canvas';
export const Input = (p) => <input {...p} className={cx(inputCls, p.className)} />;
export const Textarea = (p) => <textarea rows={3} {...p} className={cx(inputCls, p.className)} />;
export const Select = ({ children, ...p }) => <select {...p} className={cx(inputCls, p.className)}>{children}</select>;

export function Field({ label, hint, children, className }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-mute">{hint}</span>}
    </label>
  );
}

export const Card = ({ className, ...p }) => <div {...p} className={cx('rounded-lg border border-line bg-white', className)} />;

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-mute">{subtitle}</p>}
      </div>
      {action && <div className="flex gap-2">{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, tone }) {
  return (
    <Card className={cx('p-5', tone === 'warn' && 'border-bronze/50')}>
      <p className="text-sm text-mute">{label}</p>
      <p className={cx('mt-2 font-display text-3xl font-bold', tone === 'warn' ? 'text-bronze' : 'text-ink')}>{value}</p>
    </Card>
  );
}

const PILLS = {
  Completed: 'bg-[#DCFCE7] text-[#15803D]',
  Approved: 'bg-[#DCFCE7] text-[#15803D]',
  'In stock': 'bg-[#DCFCE7] text-[#15803D]',
  'Stock in': 'bg-[#DCFCE7] text-[#15803D]',
  Processing: 'bg-[#DBEAFE] text-[#1D4ED8]',
  Pending: 'bg-[#FEF3C7] text-[#B45309]',
  Cancelled: 'bg-[#FEE2E2] text-[#B91C1C]',
  Rejected: 'bg-[#FEE2E2] text-[#B91C1C]',
  'Low stock': 'bg-[#F6E6D3] text-[#9A5B1F]',
  'Stock out': 'bg-[#F6E6D3] text-[#9A5B1F]',
};
export const StatusPill = ({ status }) => (
  <span className={cx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', PILLS[status] || 'bg-canvas text-mute')}>{status}</span>
);

export function Spinner({ className = 'h-5 w-5' }) {
  return <span className={cx('inline-block animate-spin rounded-full border-2 border-line border-t-forest', className)} role="status" aria-label="Loading" />;
}
export const PageLoader = () => <div className="grid min-h-[40vh] place-items-center"><Spinner className="h-7 w-7" /></div>;

export function DataTable({ columns, rows, loading, empty = 'Nothing here yet', onRowClick }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-canvas/50">
            {columns.map((c) => <th key={c.key} className={cx('px-4 py-3 text-xs font-medium text-mute', c.className)}>{c.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length} className="py-12 text-center"><Spinner /></td></tr>
          ) : !rows?.length ? (
            <tr><td colSpan={columns.length} className="py-12 text-center text-mute">{empty}</td></tr>
          ) : (
            rows.map((r, i) => (
              <tr
                key={r._id || i}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                className={cx('border-b border-line last:border-0', onRowClick && 'cursor-pointer hover:bg-canvas/60')}
              >
                {columns.map((c) => <td key={c.key} className={cx('px-4 py-3 align-middle', c.className)}>{c.render ? c.render(r) : r[c.key]}</td>)}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Thumb({ src, name = '', size = 'h-10 w-10' }) {
  return src ? (
    <img src={src} alt={name} className={cx(size, 'shrink-0 rounded-md border border-line object-cover')} />
  ) : (
    <span className={cx(size, 'grid shrink-0 place-items-center rounded-md border border-line bg-canvas font-display text-sm font-bold text-forest')}>
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}

export function Modal({ open, title, onClose, children, wide }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 sm:py-12" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={cx('w-full rounded-lg border border-line bg-white', wide ? 'max-w-2xl' : 'max-w-md')}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="cursor-pointer rounded p-1 text-mute hover:text-ink" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger, busy, onConfirm, onClose }) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="text-sm text-mute">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={busy}>Keep it</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy}>{busy ? 'Working' : confirmLabel}</Button>
      </div>
    </Modal>
  );
}

export function FormActions({ onCancel, busy, submitLabel = 'Save changes' }) {
  return (
    <div className="mt-6 flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      <Button type="submit" disabled={busy}>{busy ? 'Saving' : submitLabel}</Button>
    </div>
  );
}

export function ImageUploader({ label = 'Image', value, onChange, folder }) {
  const toast = useToast();
  const input = useRef();
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const problem = validateImage(file);
    if (problem) return toast.error(problem);
    setPreview(URL.createObjectURL(file));
    setBusy(true);
    try {
      onChange(await uploadImage(file, folder));
      toast.success('Image uploaded');
    } catch (err) {
      setPreview(null);
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }
  const shown = preview || value;
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <div className="flex items-center gap-4">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-canvas">
          {shown ? <img src={shown} alt="Preview" className="h-full w-full object-cover" /> : <span className="text-xs text-mute">No image</span>}
        </div>
        <div>
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => input.current.click()}>
            {busy ? 'Uploading' : shown ? 'Replace image' : 'Choose image'}
          </Button>
          <p className="mt-1.5 text-xs text-mute">JPG, PNG or WebP, up to 2 MB</p>
        </div>
        <input ref={input} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={pick} />
      </div>
    </div>
  );
}
