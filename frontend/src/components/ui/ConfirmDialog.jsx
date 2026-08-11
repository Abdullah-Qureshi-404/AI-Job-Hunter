import { useEffect } from 'react';

/**
 * In-app confirmation dialog.
 *
 * Replaces window.confirm, which renders as a browser-chrome alert reading
 * "localhost:5173 says..." - it looks like a security warning rather than
 * part of the product.
 */
export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  destructive = true,
  busy = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !busy) onCancel?.();
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      onClick={() => !busy && onCancel?.()}
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md glass-card p-6 border border-white/10 shadow-2xl space-y-4"
      >
        <h2 className="text-base font-bold text-white tracking-tight">
          {title}
        </h2>

        {message && (
          <p className="text-xs text-zinc-400 leading-relaxed">
            {message}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 bg-white/5 border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            autoFocus
            className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-lg disabled:opacity-50 ${
              destructive
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/40'
                : 'bg-purple-600 hover:bg-purple-500 shadow-purple-950/40'
            }`}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
