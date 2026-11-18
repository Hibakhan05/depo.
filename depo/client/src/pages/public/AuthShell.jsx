import { Brand } from '../../components/ui';

const POINTS = ['Live stock for every warehouse', 'Orders that never sell what you do not have', 'Every movement recorded and traceable'];

export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-forest p-12 text-white lg:flex">
        <Brand className="text-5xl" />
        <div>
          <p className="max-w-sm font-display text-3xl font-bold leading-tight">Zero blind spots in your supply chain.</p>
          <ul className="mt-8 space-y-3 text-sm text-white/75">
            {POINTS.map((p) => <li key={p} className="border-l border-bronze pl-4">{p}</li>)}
          </ul>
        </div>
        <p className="text-xs text-white/50">Inventory and warehouse management</p>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Brand className="text-4xl text-forest" /></div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mb-8 mt-2 text-sm text-mute">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
