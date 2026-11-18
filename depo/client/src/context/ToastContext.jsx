import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((type, msg) => {
    const id = Math.random();
    setItems((i) => [...i, { id, type, msg }]);
    setTimeout(() => setItems((i) => i.filter((x) => x.id !== id)), 4500);
  }, []);
  const api = useMemo(() => ({ success: (m) => push('success', m), error: (m) => push('error', m) }), [push]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="fixed right-4 top-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`rounded-md border border-line border-l-4 bg-white px-4 py-3 text-sm ${t.type === 'error' ? 'border-l-[#B91C1C]' : 'border-l-forest'}`}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
