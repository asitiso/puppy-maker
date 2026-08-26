import type {GameState} from './game';
import {publicProjectDefinitions} from './generational-world';
import LineageChronicle from './LineageChronicle';
import MobileNavIcon,{type MobileNavIconName} from './MobileNavIcon';
import WeeklyPlannerCard from './WeeklyPlannerCard';
import WorldChronicle from './WorldChronicle';
import type {MobileContentCategory,MobileFeatureId} from './mobile-router';
import type {WeeklyFocusId} from './weekly-life';

type Props={
  category:MobileContentCategory;
  state:GameState;
  onOpenFeature:(feature:MobileFeatureId)=>void;
  onWeeklyFocus?:(focus:WeeklyFocusId)=>void;
  onCompleteWeek?:()=>void;
  onAdvanceWeek?:()=>void;
};

type CategoryMeta={label:string;eyebrow:string;description:string;icon:MobileNavIconName};

const meta:Record<MobileContentCategory,CategoryMeta>={
  life:{label:'생활',eyebrow:'LIVING',description:'이번 주와 이번 달의 일상을 정리해요.',icon:'life'},
  growth:{label:'성장',eyebrow:'GROWTH',description:'훈련과 성과, 장기 성장을 확인해요.',icon:'growth'},
  adventure:{label:'모험',eyebrow:'ADVENTURE',description:'밖으로 나가 탐험하고 전투해요.',icon:'adventure'},
  bond:{label:'인연',eyebrow:'BONDS',description:'루나와 친구들의 관계와 이야기를 만나요.',icon:'bond'},
  records:{label:'기록',eyebrow:'CHRONICLE',description:'세대와 세계에 남긴 흔적을 돌아봐요.',icon:'records'},
};

function Entry({icon,title,description,feature,onOpenFeature}:{
  icon:MobileNavIconName;
  title:string;
  description:string;
  feature:MobileFeatureId;
  onOpenFeature:(feature:MobileFeatureId)=>void;
}){
  return <button type="button" className="v8-category-entry" onClick={()=>onOpenFeature(feature)}>
    <span className="v8-category-entry-icon"><MobileNavIcon name={icon}/></span>
    <span className="v8-category-entry-copy"><b>{title}</b><small>{description}</small></span>
    <MobileNavIcon name="chevron" className="v8-category-chevron"/>
  </button>;
}

function SectionTitle({children}:{children:string}){
  return <h2 className="v8-section-title">{children}</h2>;
}

export default function MobileCategoryPage({category,state,onOpenFeature,onWeeklyFocus,onCompleteWeek,onAdvanceWeek}:Props){
  const info=meta[category];
  const activeProject=state.generationalWorld.activeProject;
  const activeProjectLabel=activeProject?publicProjectDefinitions[activeProject].label:null;

  return <section className="v8-category-page" aria-labelledby={`v8-category-${category}`}>
    <header className="v8-category-header">
      <span className="v8-category-icon"><MobileNavIcon name={info.icon}/></span>
      <div>
        <small>{info.eyebrow}</small>
        <h1 id={`v8-category-${category}`}>{info.label}</h1>
        <p>{info.description}</p>
      </div>
    </header>

    {category==='life'&&<div className="v8-category-content">
      <SectionTitle>이번 주 계획</SectionTitle>
      <WeeklyPlannerCard
        state={state}
        onSelectFocus={focus=>onWeeklyFocus?.(focus)}
        onComplete={()=>onCompleteWeek?.()}
        onAdvance={()=>onAdvanceWeek?.()}
        showChronicles={false}
      />
      <div className="v8-category-grid">
        <Entry icon="life" title="스케줄" description="훈련과 하루 일정을 선택해요." feature="schedule" onOpenFeature={onOpenFeature}/>
        <Entry icon="life" title="이번 달 목표" description="월간 집중과 미션을 확인해요." feature="mission" onOpenFeature={onOpenFeature}/>
        <Entry icon="bell" title="출석 보상" description="이번 달 출석 보상을 받아요." feature="attendance" onOpenFeature={onOpenFeature}/>
        <Entry icon="records" title="우편함" description="도착한 편지와 보상을 확인해요." feature="mail" onOpenFeature={onOpenFeature}/>
      </div>
    </div>}

    {category==='growth'&&<div className="v8-category-grid">
      <Entry icon="growth" title="성장 정체성" description="Calling, Trait, 관계 장면과 루나의 성장 방향을 확인해요." feature="raising" onOpenFeature={onOpenFeature}/>
      <Entry icon="growth" title="올해의 야망" description="한 해 동안 집중할 성장 목표와 현재 진행률을 봐요." feature="ambition" onOpenFeature={onOpenFeature}/>
      <Entry icon="growth" title="성장 업적" description="성장 목표와 받을 보상을 확인해요." feature="achievements" onOpenFeature={onOpenFeature}/>
      <Entry icon="growth" title="능력과 보유품" description="숙련도와 성장에 필요한 보유품을 살펴봐요." feature="inventory" onOpenFeature={onOpenFeature}/>
      <Entry icon="records" title="시즌 여정" description="시즌 점수, 보상, Legacy 성장을 확인해요." feature="season" onOpenFeature={onOpenFeature}/>
      <Entry icon="records" title="별빛 성소" description="시설, 전문화, Masterwork와 천상 성장을 관리해요." feature="sanctuary" onOpenFeature={onOpenFeature}/>
    </div>}

    {category==='adventure'&&<div className="v8-category-content">
      <div className="v8-category-grid">
        <Entry icon="adventure" title="외출" description="마을과 주변 지역에서 새로운 일을 찾아요." feature="outing" onOpenFeature={onOpenFeature}/>
        <Entry icon="adventure" title="수호자 원정" description="Expedition과 Tactical 전투에 도전해요." feature="expedition" onOpenFeature={onOpenFeature}/>
        <Entry icon="adventure" title="월드 진행" description="지역 명성, 월간 월드 이벤트와 의뢰를 확인해요." feature="world" onOpenFeature={onOpenFeature}/>
      </div>
      <div className="v8-category-summary" aria-label="세계 프로젝트">
        <small>WORLD</small><b>세계 프로젝트</b>
        <span>{activeProjectLabel?`진행 중 · ${activeProjectLabel} ${state.generationalWorld.projectProgress}%`:'진행 중인 장기 프로젝트가 없어요.'}</span>
      </div>
    </div>}

    {category==='bond'&&<div className="v8-category-grid">
      <Entry icon="bond" title="루나와 교감" description="관계와 선물, 교감 기록을 확인해요." feature="bond" onOpenFeature={onOpenFeature}/>
      <Entry icon="bond" title="선물" description="보유한 선물을 확인하고 마음을 전해요." feature="gifts" onOpenFeature={onOpenFeature}/>
      <Entry icon="records" title="이야기" description="열린 캐릭터 이야기와 이벤트를 다시 봐요." feature="stories" onOpenFeature={onOpenFeature}/>
    </div>}

    {category==='records'&&<div className="v8-category-content v8-records-content">
      <section className="v8-embedded-section" aria-label="가문 연대기">
        <SectionTitle>가문 연대기</SectionTitle>
        <LineageChronicle state={state}/>
      </section>
      <section className="v8-embedded-section" aria-label="세계 연대기">
        <SectionTitle>세계 연대기</SectionTitle>
        <WorldChronicle generation={state.lineage.generation} world={state.generationalWorld}/>
      </section>
      <Entry icon="records" title="성장 도감" description="성장, 원정, 유산과 연간 수호 기록을 한곳에서 봐요." feature="archive" onOpenFeature={onOpenFeature}/>
      <div className="v8-category-summary"><small>COLLECTION</small><b>발견과 기억</b><span>발견물 {state.discoveries.length}개 · 세대 {state.lineage.generation}</span></div>
    </div>}
  </section>;
}
