import type {MobileContentCategory,MobileFeatureId} from '../mobile-router';
import type {ExplorationInteractable,ExplorationWorldDefinition} from './exploration-types';

const gate=(name:string)=>`/assets/exploration/crossroads/${name}`;

type DistrictSpec={
  id:string;
  label:string;
  objective:string;
  layer:string;
  portals:readonly [MobileFeatureId,string,number,number,string][];
};

const specs:Record<MobileContentCategory,DistrictSpec>={
  life:{
    id:'life-quarter',
    label:'생활 구역',
    objective:'생활관을 걸어 이번 주 일정, 월간 목표, 출석과 우편을 직접 확인하세요.',
    layer:'/assets/home/home_bg_layer.webp',
    portals:[
      ['schedule','일정 게시판 · 이번 주 스케줄',520,820,'village-gate.svg'],
      ['mission','의뢰 데스크 · 이번 달 목표',900,520,'herb-hills-gate.svg'],
      ['attendance','출석 광장 · 월간 보상',1320,520,'lakeside-gate.svg'],
      ['mail','우편소 · 도착한 편지',1700,820,'village-gate.svg'],
    ],
  },
  growth:{
    id:'growth-quarter',
    label:'수련 구역',
    objective:'수련장을 직접 돌며 성장 방향, 장비, 시즌 성장과 성소를 선택하세요.',
    layer:'/assets/training/focus_training_bg.webp',
    portals:[
      ['raising','성장 제단 · 정체성과 Calling',430,850,'old-shrine-gate.svg'],
      ['ambition','목표석 · 올해의 야망',720,520,'old-shrine-gate.svg'],
      ['achievements','명예 게시판 · 성장 업적',1100,390,'expedition-outpost-gate.svg'],
      ['inventory','장비고 · 능력과 보유품',1480,520,'village-gate.svg'],
      ['season','시즌 문 · 시즌 여정',1770,850,'forest-gate.svg'],
      ['sanctuary','별빛 성소 · 장기 성장',1100,940,'old-shrine-gate.svg'],
    ],
  },
  adventure:{
    id:'adventure-quarter',
    label:'모험 구역',
    objective:'월드 게이트, 원정 게시판, 세계 지도를 걸어 선택하며 다음 모험을 시작하세요.',
    layer:'/assets/outing/forest_walk_bg.webp',
    portals:[
      ['outing','월드 게이트 · 지역 탐험',600,650,'forest-gate.svg'],
      ['expedition','원정 게시판 · 수호자 전투',1100,430,'expedition-outpost-gate.svg'],
      ['world','세계 지도 · 지역 진행',1600,650,'village-gate.svg'],
    ],
  },
  bond:{
    id:'bond-quarter',
    label:'인연 구역',
    objective:'인연 정원을 걸으며 루나와 교감하고, 선물을 건네고, 열린 이야기를 만나세요.',
    layer:'/assets/outing/park_bg.webp',
    portals:[
      ['bond','인연 정원 · 루나와 교감',650,690,'herb-hills-gate.svg'],
      ['gifts','선물 공방 · 마음 전하기',1100,440,'village-gate.svg'],
      ['stories','기억 정자 · 열린 이야기',1550,690,'lakeside-gate.svg'],
    ],
  },
  records:{
    id:'records-quarter',
    label:'기록 구역',
    objective:'기록관을 걸어 성장 도감, 가문 연대기, 세계 연대기를 직접 열어보세요.',
    layer:'/assets/event/special_event_bg.webp',
    portals:[
      ['archive','성장 도감 · 수집 기록',700,680,'old-shrine-gate.svg'],
      ['lineage','가문 연대기 · 세대 기록',1100,430,'village-gate.svg'],
      ['world_chronicle','세계 연대기 · 선택의 흔적',1500,680,'lakeside-gate.svg'],
    ],
  },
};

export const districtFeatureIds:Record<MobileContentCategory,readonly MobileFeatureId[]>={
  life:['schedule','mission','attendance','mail'],
  growth:['raising','ambition','achievements','inventory','season','sanctuary'],
  adventure:['outing','expedition','world'],
  bond:['bond','gifts','stories'],
  records:['archive','lineage','world_chronicle'],
};

export function rpgDistrictWorld(category:MobileContentCategory):ExplorationWorldDefinition{
  const spec=specs[category];
  const interactables:ExplorationInteractable[]=spec.portals.map(([feature,label,x,y,art])=>({
    id:`district-${category}-${feature}`,
    label,
    kind:'portal',
    destinationId:`feature:${feature}`,
    position:{x,y},
    radius:135,
    artSrc:gate(art),
  }));
  return {
    id:spec.id,
    label:spec.label,
    objective:spec.objective,
    width:2200,
    height:1400,
    playerRadius:22,
    playerSpeed:245,
    start:{x:1100,y:1200},
    obstacles:[],
    interactables,
    layers:[{id:'district-background',src:spec.layer,zIndex:0}],
  };
}

export function parseDistrictFeature(destinationId:string):MobileFeatureId|null{
  if(!destinationId.startsWith('feature:')) return null;
  const feature=destinationId.slice('feature:'.length) as MobileFeatureId;
  return (Object.values(districtFeatureIds) as readonly (readonly MobileFeatureId[])[]).some(items=>items.includes(feature))
    ?feature
    :null;
}
