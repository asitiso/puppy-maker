import type {ReactNode} from 'react';
import type {GameState} from './game';
import MobileHomeStatus from './MobileHomeStatus';
import MobileNavIcon,{type MobileNavIconName} from './MobileNavIcon';
import {MobileRouterActionsProvider} from './MobileRouterActionsContext';
import type {MobileCategoryId,MobileNavigationState} from './mobile-router';
import './mobile-router-v8.css';
import './mobile-legacy-feature-v8.css';

type PendingExit='back'|'home'|null;

type Props={
  state:GameState;
  navigation:MobileNavigationState;
  guarded:boolean;
  pendingExit:PendingExit;
  onCategory:(category:MobileCategoryId)=>void;
  onBack:()=>void;
  onHome:()=>void;
  onRequestExit:(target:Exclude<PendingExit,null>)=>void;
  onCancelExit:()=>void;
  onConfirmExit:()=>void;
  notificationCount?:number;
  onNotifications?:()=>void;
  children:ReactNode;
};

const categories:Array<{id:MobileCategoryId;label:string;icon:MobileNavIconName}>=[
  {id:'home',label:'홈',icon:'home'},
  {id:'life',label:'생활',icon:'life'},
  {id:'growth',label:'성장',icon:'growth'},
  {id:'adventure',label:'모험',icon:'adventure'},
  {id:'bond',label:'인연',icon:'bond'},
  {id:'records',label:'기록',icon:'records'},
];

function activeCategory(navigation:MobileNavigationState):MobileCategoryId{
  const route=navigation.current;
  if(route.kind==='home')return 'home';
  return route.category;
}

export default function MobileRouterChrome({
  state,navigation,guarded,pendingExit,onCategory,onBack,onHome,onRequestExit,onCancelExit,onConfirmExit,
  notificationCount=0,onNotifications=()=>undefined,children,
}:Props){
  const route=navigation.current;
  const active=activeCategory(navigation);
  const appPlay=route.kind==='play'&&route.screen!=='tactical'&&route.screen!=='choice_event';
  const shellClass=[
    'v8-mobile-shell',
    guarded?'is-guarded':'',
    route.kind==='home'?'is-home':'',
    appPlay?'is-app-play':'',
  ].filter(Boolean).join(' ');

  return <MobileRouterActionsProvider onBack={onBack} onHome={onHome}>
    <div className={shellClass}>
      {!guarded&&<MobileHomeStatus
        state={state}
        notificationCount={notificationCount}
        onNotifications={onNotifications}
      />}

      {guarded&&<nav className="v8-play-guard" aria-label="진행 중인 플레이 제어">
        <button type="button" className="v8-play-back" onClick={()=>onRequestExit('back')} aria-label="진행을 종료하고 뒤로가기">
          <span aria-hidden="true">‹</span><b>뒤로</b>
        </button>
        <strong>진행 중</strong>
        <button type="button" className="v8-play-home" onClick={()=>onRequestExit('home')} aria-label="진행을 종료하고 홈으로 이동">
          <MobileNavIcon name="home"/><b>홈</b>
        </button>
      </nav>}

      <div className="v8-route-body">{children}</div>

      {!guarded&&<nav className="v8-bottom-nav" aria-label="주요 메뉴">
        {categories.map(item=><button
          key={item.id}
          type="button"
          className={active===item.id?'is-active':''}
          aria-current={active===item.id?'page':undefined}
          aria-pressed={active===item.id}
          onClick={()=>item.id==='home'?onHome():onCategory(item.id)}
        >
          <span><MobileNavIcon name={item.icon}/></span><b>{item.label}</b>
        </button>)}
      </nav>}

      {guarded&&pendingExit&&<div className="v8-exit-confirm-backdrop" role="presentation">
        <section className="v8-exit-confirm" role="alertdialog" aria-modal="true" aria-labelledby="v8-exit-title" aria-describedby="v8-exit-copy">
          <h2 id="v8-exit-title">진행 중인 플레이를 종료할까요?</h2>
          <p id="v8-exit-copy">지금 나가면 현재 진행 내용이 완료되지 않습니다.</p>
          <div className="v8-exit-actions">
            <button type="button" className="is-safe" onClick={onCancelExit}>계속하기</button>
            <button type="button" className="is-danger" onClick={onConfirmExit}>종료하고 이동</button>
          </div>
        </section>
      </div>}
    </div>
  </MobileRouterActionsProvider>;
}
