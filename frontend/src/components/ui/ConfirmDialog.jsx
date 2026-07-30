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
  // Escape to dismiss, and don't let the page scroll behind the dialog.
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
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(6, 6, 12, 0.72)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 400,
          background: '#14141f',
          border: '0.5px solid #2a2a3a',
          borderRadius: 12,
          padding: '22px 22px 18px',
          boxShadow: '0 18px 50px rgba(0,0,0,0.5)',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <h2 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: '#e8e8f0' }}>
          {title}
        </h2>

        {message && (
          <p style={{ margin: '0 0 20px', fontSize: 13, lineHeight: 1.55, color: '#9090a8' }}>
            {message}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            style={{
              height: 36,
              padding: '0 16px',
              background: 'none',
              border: '0.5px solid #2a2a3a',
              borderRadius: 8,
              color: '#9090a8',
              fontSize: 13,
              cursor: busy ? 'default' : 'pointer',
            }}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            autoFocus
            style={{
              height: 36,
              padding: '0 18px',
              background: destructive ? '#e05260' : '#7c6ff7',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 13,
              fontWeight: 500,
              opacity: busy ? 0.7 : 1,
              cursor: busy ? 'default' : 'pointer',
            }}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
