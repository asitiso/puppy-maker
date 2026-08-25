import type {GameState} from './game';
import {publicProjectDefinitions} from './generational-world';
import type {HomeMenuId} from './home-panels';
import LineageChronicle from './LineageChronicle';
import MobileNavIcon,{type MobileNavIconName} from './MobileNavIcon';
import WeeklyPlannerCard from './WeeklyPlannerCard';
import WorldChronicle from './WorldChronicle';
import type {WeeklyFocusId} from './weekly-life';

export type MobileCategoryId='home'|'life'|'growth'|'adventure'|'bond'|'records';

export const mobileCategories:Array<{id:MobileCategoryId;label:string;icon:MobileNavIconName}>=[
  {id:'home',label:'홈',icon:'home'},
  {id:'life',label:'생활',icon:'life'},
  {id:'growth',label:'성장',icon:'growth'},
  {id:'adventure',label:'모험',icon:'adventure'},
  {id:'bond',label:'인연',icon:'bond'},
  {id:'records',label:'기록',icon:'records'},
];

type Props={
  category:Exclude<MobileCategoryId,'home'>;
  state:GameState;
  onClose:()=>void;
  onOpenMenu:(id:HomeMenuId)=>void;
  onSchedule:()=>void;
  onExpedition?:()=>void;
  onSeason?:()=>void;
  onWeeklyFocus?:(focus:WeeklyFocusId)=>void;
  onCompleteWeek?:()=>void;
  onAdvanceWeek?:()=>void;
};

function Entry({icon,title,description,onClick}: {icon:MobileNavIconName;title:string;description:string;onClick:()=>void}){
  return <button type="button" className="v7-category-entry" onClick={onClick}>
    <span className="v7-category-entry-icon"><MobileNavIcon name={icon}/></span>
    <span><b>{title}</b><small>{description}</small></span>
    <MobileNavIcon name="chevron" className="v7-chevron"/>
  </button>;
}

const meta:Record<Exclude<MobileCategoryId,'home'>,{label:string;eyebrow:string;description:string;icon:MobileNavIconName}>={
  life:{label:'생활',eyebrow:'LIVING',description:'이번 주와 이번 달의 일상을 정리해요.',icon:'life'},
  growth:{label:'성장',eyebrow:'GROWTH',description:'훈련과 성과, 장기 성장을 확인해요.',icon:'growth'},
  adventure:{label:'모험',eyebrow:'ADVENTURE',description:'밖으로 나가 탐험하고 전투해요.',icon:'adventure'},
  bond:{label:'인연',eyebrow:'BONDS',description:'루나와 친구들의 관계와 이야기를 만나요.',icon:'bond'},
  records:{label:'기록',eyebrow:'CHRONICLE',description:'세대와 세계에 남긴 흔적을 돌아봐요.',icon:'records'},
};

export default function MobileCategorySheet({category,state,onClose,onOpenMenu,onSchedule,onExpedition,onSeason,onWeeklyFocus,onCompleteWeek,onAdvanceWeek}:Props){
  const info=meta[category];
  const activeProject=state.generationalWorld.activeProject;
  const activeProjectLabel=activeProject?publicProjectDefinitions[activeProject].label:null;
  return <div className="v7-category-backdrop" onClick={onClose}>
    <section className="v7-category-sheet" role="dialog" aria-modal="true" aria-label={`${info.label} 메뉴`} onClick={event=>event.stopPropagation()}>
      <header className="v7-category-header">
        <span className="v7-category-icon"><MobileNavIcon name={info.icon}/></span>
        <div><small>{info.eyebrow}</small><h2>{info.label}</h2><p>{info.description}</p></div>
        <button type="button" className="v7-category-close" onClick={onClose} aria-label="홈으로 돌아가기">×</button>
      </header>

      {category==='life'&&<div className="v7-category-content">
        <WeeklyPlannerCard state={state} onSelectFocus={focus=>onWeeklyFocus?.(focus)} onComplete={()=>onCompleteWeek?.()} onAdvance={()=>onAdvanceWeek?.()} showChronicles={false}/>
        <div className="v7-category-grid">
          <Entry icon="life" title="스케줄" description="훈련과 하루 일정을 선택해요." onClick={onSchedule}/>
          <Entry icon="life" title="이번 달 목표" description="월간 집중과 미션을 확인해요." onClick={()=>onOpenMenu('mission')}/>
          <Entry icon="bell" title="출석 보상" description="이번 달 출석 보상을 받아요." onClick={()=>onOpenMenu('attendance')}/>
          <Entry icon="records" title="우편함" description="도착한 편지와 보상을 확인해요." onClick={()=>onOpenMenu('mail')}/>
        </div>
      </div>}

      {category==='growth'&&<div className="v7-category-grid">
        <Entry icon="growth" title="성장 업적" description="성장 목표와 받을 보상을 확인해요." onClick={()=>onOpenMenu('quest')}/>
        <Entry icon="growth" title="능력과 보유품" description="숙련도와 성장에 필요한 보유품을 살펴봐요." onClick={()=>onOpenMenu('bag')}/>
        <Entry icon="records" title="시즌 성장" description="시즌 여정과 장기 성장을 확인해요." onClick={()=>onSeason?.()}/>
      </div>}

      {category==='adventure'&&<div className="v7-category-grid">
        <Entry icon="adventure" title="외출" description="마을과 주변 지역에서 새로운 일을 찾아요." onClick={()=>onOpenMenu('outing')}/>
        <Entry icon="adventure" title="원정과 전투" description="Expedition과 Tactical 전투에 도전해요." onClick={()=>onExpedition?.()}/>
        <div className="v7-category-summary"><small>WORLD</small><b>세계 프로젝트</b><span>{activeProjectLabel?`진행 중 · ${activeProjectLabel} ${state.generationalWorld.projectProgress}%`:'진행 중인 장기 프로젝트가 없어요.'}</span></div>
      </div>}

      {category==='bond'&&<div className="v7-category-grid">
        <Entry icon="bond" title="루나와 교감" description="관계와 선물, 교감 기록을 확인해요." onClick={()=>onOpenMenu('bond')}/>
        <Entry icon="bond" title="선물" description="보유한 선물을 확인하고 마음을 전해요." onClick={()=>onOpenMenu('bag')}/>
        <Entry icon="records" title="이야기" description="열린 캐릭터 이야기와 이벤트를 다시 봐요." onClick={()=>onOpenMenu('event')}/>
      </div>}

      {category==='records'&&<div className="v7-category-content v7-records-content">
        <LineageChronicle state={state}/>
        <WorldChronicle generation={state.lineage.generation} world={state.generationalWorld}/>
        <div className="v7-category-summary"><small>COLLECTION</small><b>발견과 기억</b><span>발견물 {state.discoveries.length}개 · 세대 {state.lineage.generation}</span></div>
      </div>}
    </section>
  </div>;
}
