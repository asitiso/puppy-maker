import type { RefObject } from 'react'

type V14OverlayBackButtonProps = {
  onClick: () => void
  buttonRef?: RefObject<HTMLButtonElement | null>
  className?: string
  label?: string
  ariaLabel?: string
}

export default function V14OverlayBackButton({
  onClick,
  buttonRef,
  className,
  label = '이전 화면',
  ariaLabel,
}: V14OverlayBackButtonProps) {
  return <button
    ref={buttonRef}
    type="button"
    className={className}
    onClick={onClick}
    aria-label={ariaLabel ?? label}
  >
    <span aria-hidden="true">←</span><span>{label}</span>
  </button>
}
