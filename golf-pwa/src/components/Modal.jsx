import { useEffect } from 'react';

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title}
        className="flex max-h-[92vh] w-full max-w-xl flex-col gap-4 overflow-y-auto [&>*]:shrink-0 rounded-t-3xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:rounded-3xl">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-2xl font-black">{title}</h2>
          <button className="px-2 text-3xl leading-none text-neutral-500" onClick={onClose} aria-label="Schließen">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
export const inputCls = 'w-full min-w-0 rounded-xl border-2 border-neutral-300 bg-white px-3 py-2.5 text-base focus:border-turf-900 focus:outline-none';

// Bestätigung ohne confirm(): erst „Wirklich?“, dann ausführen
export function DangerButton({ children, confirmText = 'Wirklich löschen?', onConfirm, armed, setArmed }) {
  return (
    <button
      type="button"
      className={`rounded-2xl border-2 px-4 py-3 text-base font-bold ${armed ? 'border-red-700 bg-red-700 text-white' : 'border-red-700 text-red-700'}`}
      onClick={() => (armed ? onConfirm() : setArmed(true))}
    >
      {armed ? confirmText : children}
    </button>
  );
}
