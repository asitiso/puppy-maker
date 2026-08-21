import type { ExpeditionGrade, ExpeditionRegionId } from './expedition-regions';

export type WorldEventId =
  | 'forest_bloom'
  | 'arcane_market'
  | 'moon_tide'
  | 'starfall_tracks'
  | 'rune_resonance'
  | 'storm_pearls';

export type WorldEventDefinition = {
  id: WorldEventId;
  label: string;
  region: ExpeditionRegionId;
  description: string;
};

export const worldEventDefinitions: readonly WorldEventDefinition[] = [
  { id:'forest_bloom', label:'별꽃 대개화', region:'starlight_forest', description:'별빛 숲 전역에 희귀 별꽃이 피어 원정대가 몰려들고 있어요.' },
  { id:'arcane_market', label:'마도 장터 개방', region:'ancient_city', description:'고대 마법도시의 봉인된 장터가 잠시 열렸어요.' },
  { id:'moon_tide', label:'달물결 만조', region:'wind_lakes', description:'바람 호수령의 수면이 달빛과 공명하며 특별한 재료가 떠올라요.' },
  { id:'starfall_tracks', label:'별똥별 흔적', region:'starlight_forest', description:'밤새 떨어진 별똥별의 흔적이 숲 깊은 곳으로 이어집니다.' },
  { id:'rune_resonance', label:'룬 공명 주간', region:'ancient_city', description:'도시의 오래된 룬들이 동시에 빛나며 잊힌 길을 드러냅니다.' },
  { id:'storm_pearls', label:'폭풍 진주철', region:'wind_lakes', description:'강한 바람 뒤 호수령 곳곳에서 빛나는 진주가 발견되고 있어요.' },
] as const;

export function worldEvent(year:number, month:number): WorldEventDefinition {
  const safeYear = Math.max(1, Math.floor(Number.isFinite(year) ? year : 1));
  const safeMonth = Math.max(1, Math.min(12, Math.floor(Number.isFinite(month) ? month : 1)));
  const index = (((safeYear - 1) * 12 + (safeMonth - 1)) % worldEventDefinitions.length + worldEventDefinitions.length) % worldEventDefinitions.length;
  return worldEventDefinitions[index];
}

export function worldEventExpeditionBonus(
  event:WorldEventDefinition,
  region:ExpeditionRegionId,
  grade:ExpeditionGrade,
): { seasonPoints:number; materialBonus:number } {
  const successfulGrade = grade === 'B' || grade === 'A' || grade === 'S';
  if (!successfulGrade || region !== event.region) return { seasonPoints:0, materialBonus:0 };
  return { seasonPoints:5, materialBonus:grade === 'S' ? 1 : 0 };
}
