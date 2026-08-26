import type {ReactNode} from 'react';
import './mobile-v9.css';

export type MobileFeedbackTone='success'|'info'|'warning'|'error';

type Props={
  tone?:MobileFeedbackTone;
  children:ReactNode;
  className?:string;
};

export default function MobileFeedback({tone='info',children,className=''}:Props){
  const classes=['v9-feedback',`is-${tone}`,className].filter(Boolean).join(' ');
  return <div className={classes} role={tone==='error'?'alert':'status'} aria-live={tone==='error'?'assertive':'polite'}>
    {children}
  </div>;
}
