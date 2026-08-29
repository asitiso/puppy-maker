import type { RefObject } from 'react'
import './v14-overlay-back-button.css'

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
  const classes = ['v14-overlay-back', className].filter(Boolean).join(' ')
  return <button
    ref={buttonRef}
    type="button"
    className={classes}
    onClick={onClick}
    aria-label={ariaLabel ?? label}
  >
    <span aria-hidden="true">←</span><span>{label}</span>
  </button>
}
