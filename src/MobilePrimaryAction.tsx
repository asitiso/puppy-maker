import {useId,type ButtonHTMLAttributes,type ReactNode} from 'react';
import './mobile-v9.css';

type Props=Omit<ButtonHTMLAttributes<HTMLButtonElement>,'children'> & {
  children:ReactNode;
  reason?:string;
};

export default function MobilePrimaryAction({children,reason,disabled,className='',...buttonProps}:Props){
  const reasonId=useId();
  const isDisabled=Boolean(disabled);
  const classes=['v9-primary-action',className].filter(Boolean).join(' ');

  return <div className="v9-primary-action-wrap">
    <button
      {...buttonProps}
      type={buttonProps.type??'button'}
      className={classes}
      disabled={isDisabled}
      aria-describedby={isDisabled&&reason?reasonId:buttonProps['aria-describedby']}
    >{children}</button>
    {isDisabled&&reason&&<p id={reasonId} className="v9-action-reason">{reason}</p>}
  </div>;
}
