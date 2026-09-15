export const LEGACY_REGION_IDS = ['forest','village','lakeside'] as const;
export const LIVING_REGION_IDS = ['old_shrine','herb_hills','expedition_outpost'] as const;
export const REGION_IDS = [...LEGACY_REGION_IDS,...LIVING_REGION_IDS] as const;

export type RegionId = typeof REGION_IDS[number];
export type LivingRegionId = typeof LIVING_REGION_IDS[number];

export type RegionDefinition = {
  id:RegionId;
  name:string;
  summary:string;
  entranceLabel:string;
  generation:'legacy'|'living';
};

export const regionRegistry:Record<RegionId,RegionDefinition> = {
  forest:{
    id:'forest',
    name:'별빛 숲',
    summary:'별빛과 오래된 나무가 이어지는 숲길',
    entranceLabel:'숲길 입구',
    generation:'legacy',
  },
  village:{
    id:'village',
    name:'마법 마을',
    summary:'상점과 주민들이 모인 생활 거점',
    entranceLabel:'마을 정문',
    generation:'legacy',
  },
  lakeside:{
    id:'lakeside',
    name:'바람 호숫가',
    summary:'바람과 물길이 만나는 잔잔한 호숫가',
    entranceLabel:'호숫가 오솔길',
    generation:'legacy',
  },
  old_shrine:{
    id:'old_shrine',
    name:'고대 신전',
    summary:'무너진 석문과 봉인 흔적이 남은 폐신전 탐험지',
    entranceLabel:'금간 석문',
    generation:'living',
  },
  herb_hills:{
    id:'herb_hills',
    name:'약초 언덕',
    summary:'채집 길과 바람 능선이 이어지는 약초 재배지',
    entranceLabel:'약초밭 오름길',
    generation:'living',
  },
  expedition_outpost:{
    id:'expedition_outpost',
    name:'원정 전초기지',
    summary:'탐사대가 보급과 경계를 유지하는 전초 거점',
    entranceLabel:'보강된 관문',
    generation:'living',
  },
};

export function getRegionDefinition(id:RegionId):RegionDefinition {
  return regionRegistry[id];
}
