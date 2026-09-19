import type {MobileFeatureId} from '../mobile-router';
import type {ExplorationWorldDefinition} from './exploration-types';

export const FACILITY_SYSTEM_DESTINATION='facility:system';

export const rpgFacilityFeatureIds=[
  'raising','ambition','achievements','inventory','season','sanctuary',
] as const satisfies readonly MobileFeatureId[];

export type RpgFacilityFeatureId=(typeof rpgFacilityFeatureIds)[number];

type FacilitySpec={
  label:string;
  objective:string;
  stationLabel:string;
  layers:ExplorationWorldDefinition['layers'];
  station:{x:number;y:number};
};

const specs:Record<RpgFacilityFeatureId,FacilitySpec>={
  raising:{
    label:'수호자 성장 제단',
    objective:'성장 제단 안쪽의 별빛 결정까지 이동해 Calling과 성장 특성을 확인하세요.',
    stationLabel:'별빛 결정 · 정체성과 Calling',
    layers:[
      {id:'ground',src:'/assets/training/focus_training_bg.webp',zIndex:0},
    ],
    station:{x:1320,y:510},
  },
  ambition:{
    label:'연간 목표의 방',
    objective:'중앙 목표석까지 이동해 올해 집중할 성장 방향을 확인하세요.',
    stationLabel:'목표석 · 올해의 야망',
    layers:[
      {id:'ground',src:'/assets/training/magic_training_bg.webp',zIndex:0},
    ],
    station:{x:1260,y:520},
  },
  achievements:{
    label:'수호자 명예관',
    objective:'명예 기록석까지 이동해 달성한 업적과 보상을 확인하세요.',
    stationLabel:'명예 기록석 · 성장 업적',
    layers:[
      {id:'ground',src:'/assets/result/training_result_bg.webp',zIndex:0},
    ],
    station:{x:1280,y:500},
  },
  inventory:{
    label:'수호자 장비고',
    objective:'장비 작업대까지 이동해 보유 장비와 성장 물품을 정비하세요.',
    stationLabel:'장비 작업대 · 장비와 보유품',
    layers:[
      {id:'ground',src:'/assets/training/fight_training_bg.webp',zIndex:0},
    ],
    station:{x:1360,y:610},
  },
  season:{
    label:'계절 관측실',
    objective:'계절 관측구까지 이동해 현재 시즌 여정과 계승 보상을 확인하세요.',
    stationLabel:'계절 관측구 · 시즌 여정',
    layers:[
      {id:'ground',src:'/assets/exploration/old-shrine/shrine-ground.svg',zIndex:0},
      {id:'ruins',src:'/assets/exploration/old-shrine/moon-inscription.svg',zIndex:3},
    ],
    station:{x:1270,y:500},
  },
  sanctuary:{
    label:'별빛 성소 내부',
    objective:'성소의 핵심 제단까지 이동해 시설 성장과 별의 균열을 관리하세요.',
    stationLabel:'성소 핵심 제단 · 장기 성장',
    layers:[
      {id:'ground',src:'/assets/exploration/old-shrine/shrine-ground.svg',zIndex:0},
      {id:'ruins',src:'/assets/exploration/old-shrine/shrine-ruins.svg',zIndex:3},
      {id:'runes',src:'/assets/exploration/old-shrine/rune-device.svg',zIndex:4},
    ],
    station:{x:1320,y:520},
  },
};

export function isRpgFacilityFeature(feature:MobileFeatureId):feature is RpgFacilityFeatureId{
  return (rpgFacilityFeatureIds as readonly MobileFeatureId[]).includes(feature);
}

export function rpgFacilityWorld(feature:RpgFacilityFeatureId):ExplorationWorldDefinition{
  const spec=specs[feature];
  return {
    id:`facility:${feature}`,
    label:spec.label,
    objective:spec.objective,
    width:1800,
    height:1100,
    playerRadius:22,
    playerSpeed:245,
    start:{x:300,y:830},
    obstacles:[],
    layers:spec.layers,
    interactables:[{
      id:`facility-${feature}-system`,
      label:spec.stationLabel,
      kind:'portal',
      destinationId:FACILITY_SYSTEM_DESTINATION,
      position:spec.station,
      radius:145,
    }],
  };
}
