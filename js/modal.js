import { h } from 'https://esm.sh/preact';
import { useEffect, useLayoutEffect, useRef } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';

const html = htm.bind(h);

// ——— utilities ———
function useLockBodyScroll(locked) {
  useLayoutEffect(() => {
    if (!locked) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [locked]);
}

function usePrevious(value) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

// ——— Modal ———
export function Modal({
  open,
  onClose,
  title,
  ariaLabel,
  closeOnEsc = true,
  closeOnBackdrop = true,
  initialFocusRef,
  children
}) {
  const dialogRef = useRef(null);
  const previouslyOpen = usePrevious(open);

  // portal host
  const portalHostRef = useRef(null);
  if (!portalHostRef.current && typeof document !== 'undefined') {
    const el = document.createElement('div');
    el.setAttribute('data-preact-modal-root', '');
    document.body.appendChild(el);
    portalHostRef.current = el;
  }

  useLockBodyScroll(open);

  // focus management
  useEffect(() => {
    if (!open) return;
    const activeBefore = document.activeElement;

    const toFocus =
      (initialFocusRef && initialFocusRef.current) ||
      dialogRef.current?.querySelector(
        '[data-autofocus], button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) ||
      dialogRef.current;

    toFocus && toFocus.focus && toFocus.focus();

    return () => {
      activeBefore && activeBefore.focus && activeBefore.focus();
    };
  }, [open]);

  // ESC + Tab trap
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e) {
      if (e.key === 'Escape' && closeOnEsc) {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll(
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
        );
        const list = focusable ? Array.from(focusable).filter(el => el.offsetParent !== null) : [];
        if (!list.length) return;
        const first = list[0];
        const last = list[list.length - 1];
        const active = document.activeElement;
        if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        }
      }
    }

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [open, closeOnEsc, onClose]);

  if (!open || !portalHostRef.current) return null;

  function backdropClick(e) {
    if (!closeOnBackdrop) return;
    if (e.target === e.currentTarget) onClose();
  }

  // minimal inline styles
  const styles = {
    backdrop: {
      position: 'fixed', inset: 0, display: 'grid', placeItems: 'center',
      background: 'rgba(0,0,0,0.45)', zIndex: 1000
    },
    dialog: {
      background: 'white', color: '#111', minWidth: 'min(92vw, 560px)',
      maxWidth: '96vw', maxHeight: '90vh', overflow: 'auto', borderRadius: '16px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)', outline: 'none'
    },
    header: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', borderBottom: '1px solid #eee', fontWeight: 600
    },
    body: { padding: '16px' },
    closeBtn: {
      border: 'none', background: 'transparent', cursor: 'pointer',
      fontSize: '20px', lineHeight: 1, padding: '4px'
    }
  };

  const modalElement = h(
    'div',
    { onMouseDown: backdropClick, style: styles.backdrop },
    h(
      'div',
      {
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': title ? 'modal-title' : undefined,
        'aria-label': !title ? ariaLabel : undefined,
        ref: dialogRef,
        tabIndex: -1,
        style: styles.dialog
      },
      h(
        'div',
        { style: styles.header },
        h('div', { id: 'modal-title' }, title || ''),
        h('button', { onClick: onClose, style: styles.closeBtn, 'aria-label': 'Close modal' }, '×')
      ),
      h('div', { style: styles.body }, children)
    )
  );

  // Use createPortal if available, otherwise return the element directly
  if (typeof window !== 'undefined' && window.preact && window.preact.createPortal) {
    return window.preact.createPortal(modalElement, portalHostRef.current);
  }
  
  return modalElement;
}
