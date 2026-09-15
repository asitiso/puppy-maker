import type {Vec2} from './exploration-types';

export const LEGACY_REGION_IDS = ['forest','village','lakeside'] as const;
export const LIVING_REGION_IDS = ['old_shrine','herb_hills','expedition_outpost'] as const;
export const REGION_IDS = [...LEGACY_REGION_IDS,...LIVING_REGION_IDS] as const;

export type LegacyRegionId = typeof LEGACY_REGION_IDS[number];
export type LivingRegionId = typeof LIVING_REGION_IDS[number];
export type RegionId = typeof REGION_IDS[number];

export type CrossroadsPortalDefinition = {
  interactionId:string;
  label:string;
  position:Vec2;
  radius:number;
  artSrc:string;
};

export type RegionDefinition = {
  id:RegionId;
  name:string;
  summary:string;
  entranceLabel:string;
  generation:'legacy'|'living';
  crossroads:CrossroadsPortalDefinition;
};

const crossroadsAsset=(name:string)=>`/assets/exploration/crossroads/${name}`;

export const regionRegistry:Record<RegionId,RegionDefinition> = {
  forest:{
    id:'forest',
    name:'별빛 숲',
    summary:'별빛과 오래된 나무가 이어지는 숲길',
    entranceLabel:'숲길 입구',
    generation:'legacy',
    crossroads:{
      interactionId:'crossroads-forest',
      label:'별빛 숲으로 들어가기',
      position:{x:1200,y:250},
      radius:120,
      artSrc:crossroadsAsset('forest-gate.svg'),
    },
  },
  village:{
    id:'village',
    name:'마법 마을',
    summary:'상점과 주민들이 모인 생활 거점',
    entranceLabel:'마을 정문',
    generation:'legacy',
    crossroads:{
      interactionId:'crossroads-village',
      label:'마법 마을로 들어가기',
      position:{x:345,y:610},
      radius:120,
      artSrc:crossroadsAsset('village-gate.svg'),
    },
  },
  lakeside:{
    id:'lakeside',
    name:'바람 호숫가',
    summary:'바람과 물길이 만나는 잔잔한 호숫가',
    entranceLabel:'호숫가 오솔길',
    generation:'legacy',
    crossroads:{
      interactionId:'crossroads-lakeside',
      label:'바람 호숫가로 내려가기',
      position:{x:2050,y:610},
      radius:120,
      artSrc:crossroadsAsset('lakeside-gate.svg'),
    },
  },
  old_shrine:{
    id:'old_shrine',
    name:'고대 신전',
    summary:'무너진 석문과 봉인 흔적이 남은 폐신전 탐험지',
    entranceLabel:'금간 석문',
    generation:'living',
    crossroads:{
      interactionId:'crossroads-old-shrine',
      label:'고대 신전으로 들어가기',
      position:{x:610,y:1090},
      radius:120,
      artSrc:crossroadsAsset('old-shrine-gate.svg'),
    },
  },
  herb_hills:{
    id:'herb_hills',
    name:'약초 언덕',
    summary:'채집 길과 바람 능선이 이어지는 약초 재배지',
    entranceLabel:'약초밭 오름길',
    generation:'living',
    crossroads:{
      interactionId:'crossroads-herb-hills',
      label:'약초 언덕으로 올라가기',
      position:{x:1200,y:840},
      radius:120,
      artSrc:crossroadsAsset('herb-hills-gate.svg'),
    },
  },
  expedition_outpost:{
    id:'expedition_outpost',
    name:'원정 전초기지',
    summary:'탐사대가 보급과 경계를 유지하는 전초 거점',
    entranceLabel:'보강된 관문',
    generation:'living',
    crossroads:{
      interactionId:'crossroads-expedition-outpost',
      label:'원정 전초기지로 들어가기',
      position:{x:1790,y:1090},
      radius:120,
      artSrc:crossroadsAsset('expedition-outpost-gate.svg'),
    },
  },
};

export function getRegionDefinition(id:RegionId):RegionDefinition {
  return regionRegistry[id];
}

export function isRegionId(value:string):value is RegionId {
  return (REGION_IDS as readonly string[]).includes(value);
}

export function isLegacyRegionId(value:string):value is LegacyRegionId {
  return (LEGACY_REGION_IDS as readonly string[]).includes(value);
}

export function isLivingRegionId(value:string):value is LivingRegionId {
  return (LIVING_REGION_IDS as readonly string[]).includes(value);
}
