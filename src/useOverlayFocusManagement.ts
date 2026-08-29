import { useEffect, useRef, type RefObject } from 'react';

const focusableSelector = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

type OverlayFocusOptions = {
  open: boolean;
  onClose: () => void;
  dialogRef: RefObject<HTMLElement | null>;
  launcherRef: RefObject<HTMLElement | null>;
  initialFocusRef: RefObject<HTMLElement | null>;
};

export function useOverlayFocusManagement({
  open,
  onClose,
  dialogRef,
  launcherRef,
  initialFocusRef,
}: OverlayFocusOptions) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const restoreTarget = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : launcherRef.current;

    initialFocusRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const dialog = dialogRef.current;
      const focusable = Array.from(
        dialog?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
      ).filter(element => !element.hasAttribute('disabled') && element.tabIndex !== -1);

      if (focusable.length === 0) {
        event.preventDefault();
        initialFocusRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const focusOutside = active instanceof Node ? !dialog?.contains(active) : true;

      if (event.shiftKey && (active === first || focusOutside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || focusOutside)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      requestAnimationFrame(() => {
        if (restoreTarget?.isConnected) restoreTarget?.focus();
        else launcherRef.current?.focus();
      });
    };
  }, [dialogRef, initialFocusRef, launcherRef, open]);
}
