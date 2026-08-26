import {useEffect,useRef,type ReactNode} from 'react';
import MobileSceneBackground from './MobileSceneBackground';
import type {MobileVisualSlot} from './mobile-visual-assets';
import {readMobileScroll,rememberMobileScroll} from './mobile-scroll-memory';
import './mobile-v9.css';

type Props={
  title:string;
  subtitle?:string;
  backgroundSlot:MobileVisualSlot;
  scrollKey:string;
  onBack?:()=>void;
  stickyAction?:ReactNode;
  children:ReactNode;
  className?:string;
};

export default function MobilePageShell({title,subtitle,backgroundSlot,scrollKey,onBack,stickyAction,children,className=''}:Props){
  const scrollRef=useRef<HTMLDivElement>(null);

  useEffect(()=>{
    const node=scrollRef.current;
    if(!node)return;
    node.scrollTop=readMobileScroll(scrollKey);
    return ()=>rememberMobileScroll(scrollKey,node.scrollTop);
  },[scrollKey]);

  const classes=['v9-page-shell',className].filter(Boolean).join(' ');
  return <section className={classes} data-mobile-page-shell>
    <MobileSceneBackground slot={backgroundSlot}/>
    <div className="v9-page-surface">
      <header className="v9-page-header">
        {onBack&&<button type="button" className="v9-page-back" onClick={onBack} aria-label="이전 화면으로 돌아가기">
          <span aria-hidden="true">‹</span><b>이전</b>
        </button>}
        <div className="v9-page-heading">
          <h1>{title}</h1>
          {subtitle&&<p>{subtitle}</p>}
        </div>
      </header>

      <div
        ref={scrollRef}
        className="v9-page-scroll"
        data-mobile-page-scroll
        onScroll={event=>rememberMobileScroll(scrollKey,event.currentTarget.scrollTop)}
      >
        <div className="v9-page-content">{children}</div>
      </div>

      {stickyAction&&<footer className="v9-page-sticky-action">{stickyAction}</footer>}
    </div>
  </section>;
}
