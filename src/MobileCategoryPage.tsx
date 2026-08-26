import type {GameState} from './game';
import {publicProjectDefinitions} from './generational-world';
import LineageChronicle from './LineageChronicle';
import MobileNavIcon,{type MobileNavIconName} from './MobileNavIcon';
import MobilePageShell from './MobilePageShell';
import WeeklyPlannerCard from './WeeklyPlannerCard';
import WorldChronicle from './WorldChronicle';
import {mobileCategoryPriorityFeatures,mobileCategoryRecommendation} from './mobile-category-guidance';
import type {MobileContentCategory,MobileFeatureId} from './mobile-router';
import type {MobileVisualSlot} from './mobile-visual-assets';
import type {WeeklyFocusId} from './weekly-life';

type Props={
  category:MobileContentCategory;
  state:GameState;
  onOpenFeature:(feature:MobileFeatureId)=>void;
  onWeeklyFocus?:(focus:WeeklyFocusId)=>void;
  onCompleteWeek?:()=>void;
  onAdvanceWeek?:()=>void;
};

type CategoryMeta={label:string;eyebrow:string;description:string;icon:MobileNavIconName;backgroundSlot:MobileVisualSlot};
type EntryInfo={icon:MobileNavIconName;title:string;description:string};

const meta:Record<MobileContentCategory,CategoryMeta>={
  life:{label:'생활',eyebrow:'LIVING',description:'이번 주와 이번 달의 일상을 정리해요.',icon:'life',backgroundSlot:'category.life.background'},
  growth:{label:'성장',eyebrow:'GROWTH',description:'훈련과 성과, 장기 성장을 확인해요.',icon:'growth',backgroundSlot:'category.growth.background'},
  adventure:{label:'모험',eyebrow:'ADVENTURE',description:'밖으로 나가 탐험하고 전투해요.',icon:'adventure',backgroundSlot:'category.adventure.background'},
  bond:{label:'인연',eyebrow:'BONDS',description:'루나와 친구들의 관계와 이야기를 만나요.',icon:'bond',backgroundSlot:'category.bond.background'},
  records:{label:'기록',eyebrow:'CHRONICLE',description:'세대와 세계에 남긴 흔적을 돌아봐요.',icon:'records',backgroundSlot:'category.records.background'},
};

const entries:Record<MobileFeatureId,EntryInfo>={
  schedule:{icon:'life',title:'스케줄',description:'훈련과 하루 일정을 선택해요.'},
  mission:{icon:'life',title:'이번 달 목표',description:'월간 집중과 미션을 확인해요.'},
  attendance:{icon:'bell',title:'출석 보상',description:'이번 달 출석 보상을 받아요.'},
  mail:{icon:'records',title:'우편함',description:'도착한 편지와 보상을 확인해요.'},
  raising:{icon:'growth',title:'성장 정체성',description:'Calling, Trait, 관계 장면과 루나의 성장 방향을 확인해요.'},
  ambition:{icon:'growth',title:'올해의 야망',description:'한 해 동안 집중할 성장 목표와 현재 진행률을 봐요.'},
  achievements:{icon:'growth',title:'성장 업적',description:'성장 목표와 받을 보상을 확인해요.'},
  inventory:{icon:'growth',title:'능력과 보유품',description:'숙련도와 성장에 필요한 보유품을 살펴봐요.'},
  season:{icon:'records',title:'시즌 여정',description:'시즌 점수, 보상, Legacy 성장을 확인해요.'},
  sanctuary:{icon:'records',title:'별빛 성소',description:'시설, 전문화, Masterwork와 천상 성장을 관리해요.'},
  outing:{icon:'adventure',title:'외출',description:'마을과 주변 지역에서 새로운 일을 찾아요.'},
  expedition:{icon:'adventure',title:'수호자 원정',description:'Expedition과 Tactical 전투에 도전해요.'},
  world:{icon:'adventure',title:'월드 진행',description:'지역 명성, 월간 월드 이벤트와 의뢰를 확인해요.'},
  bond:{icon:'bond',title:'루나와 교감',description:'관계와 선물, 교감 기록을 확인해요.'},
  gifts:{icon:'bond',title:'선물',description:'보유한 선물을 확인하고 마음을 전해요.'},
  stories:{icon:'records',title:'이야기',description:'열린 캐릭터 이야기와 이벤트를 다시 봐요.'},
  archive:{icon:'records',title:'성장 도감',description:'성장, 원정, 유산과 연간 수호 기록을 한곳에서 봐요.'},
  lineage:{icon:'records',title:'가문 연대기',description:'세대별 성장과 계승의 흐름을 돌아봐요.'},
  world_chronicle:{icon:'records',title:'세계 연대기',description:'세계에 남긴 선택과 변화를 돌아봐요.'},
};

const featuresByCategory:Record<MobileContentCategory,MobileFeatureId[]>={
  life:['schedule','mission','attendance','mail'],
  growth:['raising','ambition','achievements','inventory','season','sanctuary'],
  adventure:['outing','expedition','world'],
  bond:['bond','gifts','stories'],
  records:['archive'],
};

function Entry({feature,onOpenFeature,priority=false}:{feature:MobileFeatureId;onOpenFeature:(feature:MobileFeatureId)=>void;priority?:boolean}){
  const item=entries[feature];
  return <button type="button" className={`v8-category-entry${priority?' is-priority':''}`} onClick={()=>onOpenFeature(feature)} data-feature={feature}>
    <span className="v8-category-entry-icon"><MobileNavIcon name={item.icon}/></span>
    <span className="v8-category-entry-copy"><b>{item.title}</b><small>{item.description}</small></span>
    <MobileNavIcon name="chevron" className="v8-category-chevron"/>
  </button>;
}

function SectionTitle({children}:{children:string}){return <h2 className="v8-section-title">{children}</h2>;}

export default function MobileCategoryPage({category,state,onOpenFeature,onWeeklyFocus,onCompleteWeek,onAdvanceWeek}:Props){
  const info=meta[category];
  const recommendation=mobileCategoryRecommendation(category,state);
  const priority=new Set(mobileCategoryPriorityFeatures(category,state));
  const activeProject=state.generationalWorld.activeProject;
  const activeProjectLabel=activeProject?publicProjectDefinitions[activeProject].label:null;

  return <MobilePageShell title={info.label} subtitle={info.description} backgroundSlot={info.backgroundSlot} scrollKey={`category:${category}`} className={`v8-category-page v9-category-page is-${category}`}>
    <div className="v8-category-header" aria-hidden="true">
      <span className="v8-category-icon"><MobileNavIcon name={info.icon}/></span><small>{info.eyebrow}</small>
    </div>

    <button type="button" className="v9-category-recommendation" onClick={()=>onOpenFeature(recommendation.feature)}>
      <small>지금 추천</small><strong>{recommendation.label}</strong><span>{recommendation.description}</span><em>{recommendation.reason}</em>
    </button>

    {category==='life'&&<div className="v8-category-content">
      <SectionTitle>이번 주 계획</SectionTitle>
      <WeeklyPlannerCard state={state} onSelectFocus={focus=>onWeeklyFocus?.(focus)} onComplete={()=>onCompleteWeek?.()} onAdvance={()=>onAdvanceWeek?.()} showChronicles={false}/>
      <div className="v8-category-grid">{featuresByCategory.life.map(feature=><Entry key={feature} feature={feature} priority={priority.has(feature)} onOpenFeature={onOpenFeature}/>)}</div>
    </div>}

    {category==='growth'&&<div className="v8-category-grid">{featuresByCategory.growth.map(feature=><Entry key={feature} feature={feature} priority={priority.has(feature)} onOpenFeature={onOpenFeature}/>)}</div>}

    {category==='adventure'&&<div className="v8-category-content">
      <div className="v8-category-grid">{featuresByCategory.adventure.map(feature=><Entry key={feature} feature={feature} priority={priority.has(feature)} onOpenFeature={onOpenFeature}/>)}</div>
      <div className="v8-category-summary" aria-label="세계 프로젝트"><small>WORLD</small><b>세계 프로젝트</b><span>{activeProjectLabel?`진행 중 · ${activeProjectLabel} ${state.generationalWorld.projectProgress}%`:'진행 중인 장기 프로젝트가 없어요.'}</span></div>
    </div>}

    {category==='bond'&&<div className="v8-category-grid">{featuresByCategory.bond.map(feature=><Entry key={feature} feature={feature} priority={priority.has(feature)} onOpenFeature={onOpenFeature}/>)}</div>}

    {category==='records'&&<div className="v8-category-content v8-records-content">
      <Entry feature="archive" priority onOpenFeature={onOpenFeature}/>
      <div className="v8-category-summary"><small>COLLECTION</small><b>발견과 기억</b><span>발견물 {state.discoveries.length}개 · 세대 {state.lineage.generation}</span></div>
      <details className="v9-chronicle-details"><summary>가문 연대기</summary><section className="v8-embedded-section" aria-label="가문 연대기"><LineageChronicle state={state}/></section></details>
      <details className="v9-chronicle-details"><summary>세계 연대기</summary><section className="v8-embedded-section" aria-label="세계 연대기"><WorldChronicle generation={state.lineage.generation} world={state.generationalWorld}/></section></details>
    </div>}
  </MobilePageShell>;
}
