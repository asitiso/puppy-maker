type ModalTabEvent = {
  key: string;
  shiftKey: boolean;
  preventDefault: () => void;
  currentTarget: HTMLElement;
};

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function trapModalTab(event: ModalTabEvent) {
  if (event.key !== 'Tab') return;

  const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(focusableSelector));
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
    return;
  }

  if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}
