export type ExpeditionRelicId = 'moonfang_charm' | 'mana_prism' | 'wind_feather' | 'guardian_thread' | 'explorer_compass' | 'bond_locket';

export type ExpeditionRelicDefinition = {
  id: ExpeditionRelicId;
  label: string;
  description: string;
};

export const expeditionRelicDefinitions: ExpeditionRelicDefinition[] = [
  { id: 'moonfang_charm', label: '월아 부적', description: '원정 공격 점수 +6%' },
  { id: 'mana_prism', label: '마나 프리즘', description: '원정 기 모으기 점수 +6%' },
  { id: 'wind_feather', label: '바람 깃털', description: '원정 회피 효율 +8%' },
  { id: 'guardian_thread', label: '수호자의 실', description: '모든 원정 점수 +3%' },
  { id: 'explorer_compass', label: '탐험가의 나침반', description: '원정 재료 보상 +1' },
  { id: 'bond_locket', label: '인연의 로켓', description: '첫 클리어 호감도 +2' },
];

export const expeditionRelicIds = expeditionRelicDefinitions.map(item => item.id);

export type ExpeditionRelicModifiers = {
  attack: number;
  charge: number;
  dodge: number;
  all: number;
  materialBonus: number;
  firstClearAffection: number;
};

export function relicModifiers(equipped: ExpeditionRelicId[]): ExpeditionRelicModifiers {
  const set = new Set(equipped);
  return {
    attack: set.has('moonfang_charm') ? 0.06 : 0,
    charge: set.has('mana_prism') ? 0.06 : 0,
    dodge: set.has('wind_feather') ? 0.08 : 0,
    all: set.has('guardian_thread') ? 0.03 : 0,
    materialBonus: set.has('explorer_compass') ? 1 : 0,
    firstClearAffection: set.has('bond_locket') ? 2 : 0,
  };
}

export function equipExpeditionRelic(equipped: ExpeditionRelicId[], owned: ExpeditionRelicId[], relic: ExpeditionRelicId): ExpeditionRelicId[] {
  if (!owned.includes(relic) || equipped.includes(relic) || equipped.length >= 3) return [...equipped];
  return [...equipped, relic];
}

export function unequipExpeditionRelic(equipped: ExpeditionRelicId[], relic: ExpeditionRelicId): ExpeditionRelicId[] {
  return equipped.filter(id => id !== relic);
}
