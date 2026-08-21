import type { GuardianCallingId } from './guardian-callings';

export type GrowthTraitId =
  | 'vanguard_power' | 'vanguard_focus' | 'vanguard_assault' | 'vanguard_legend'
  | 'arcanist_mana' | 'arcanist_insight' | 'arcanist_channel' | 'arcanist_legend'
  | 'caretaker_rest' | 'caretaker_bond' | 'caretaker_guard' | 'caretaker_legend'
  | 'pathfinder_herb' | 'pathfinder_eye' | 'pathfinder_supply' | 'pathfinder_legend';

export type GrowthTraitDefinition = {
  id: GrowthTraitId;
  calling: GuardianCallingId;
  tier: 1 | 2 | 3 | 4;
  cost: 1 | 2;
  label: string;
  description: string;
  prerequisite: GrowthTraitId | null;
};

export const growthTraitDefinitions: GrowthTraitDefinition[] = [
  { id:'vanguard_power', calling:'vanguard', tier:1, cost:1, label:'선봉의 힘', description:'사냥이 포함된 달에는 근력 +1.', prerequisite:null },
  { id:'vanguard_focus', calling:'vanguard', tier:2, cost:1, label:'추격 집중', description:'GREAT/PERFECT 달에 사냥 숙련 보너스를 강화해요.', prerequisite:'vanguard_power' },
  { id:'vanguard_assault', calling:'vanguard', tier:3, cost:2, label:'돌파 공격', description:'원정 공격 성능 +5%.', prerequisite:'vanguard_focus' },
  { id:'vanguard_legend', calling:'vanguard', tier:4, cost:2, label:'선봉의 전설', description:'월 첫 원정 클리어의 피로 부담을 줄여요.', prerequisite:'vanguard_assault' },
  { id:'arcanist_mana', calling:'arcanist', tier:1, cost:1, label:'마력 증폭', description:'마법이 포함된 달에는 마력 +1.', prerequisite:null },
  { id:'arcanist_insight', calling:'arcanist', tier:2, cost:1, label:'별빛 통찰', description:'마법이 포함된 달에는 지식 +1.', prerequisite:'arcanist_mana' },
  { id:'arcanist_channel', calling:'arcanist', tier:3, cost:2, label:'별빛 집중', description:'원정 기 모으기 성능 +5%.', prerequisite:'arcanist_insight' },
  { id:'arcanist_legend', calling:'arcanist', tier:4, cost:2, label:'마도의 전설', description:'A/S 원정 발견 시 스트레스를 조금 낮춰요.', prerequisite:'arcanist_channel' },
  { id:'caretaker_rest', calling:'caretaker', tier:1, cost:1, label:'다정한 휴식', description:'휴식이 포함된 달의 피로 회복 +2.', prerequisite:null },
  { id:'caretaker_bond', calling:'caretaker', tier:2, cost:1, label:'마음 나누기', description:'성공한 선물의 호감도 +1.', prerequisite:'caretaker_rest' },
  { id:'caretaker_guard', calling:'caretaker', tier:3, cost:2, label:'마음의 방벽', description:'원정 회피/압박 방어 +5%.', prerequisite:'caretaker_bond' },
  { id:'caretaker_legend', calling:'caretaker', tier:4, cost:2, label:'치유의 전설', description:'새 관계 장면이 열린 달의 스트레스를 낮춰요.', prerequisite:'caretaker_guard' },
  { id:'pathfinder_herb', calling:'pathfinder', tier:1, cost:1, label:'별길 채집', description:'약초가 포함된 달의 성장 효과를 강화해요.', prerequisite:null },
  { id:'pathfinder_eye', calling:'pathfinder', tier:2, cost:1, label:'탐험가의 눈', description:'외출 발견 기회를 조금 앞당겨요.', prerequisite:'pathfinder_herb' },
  { id:'pathfinder_supply', calling:'pathfinder', tier:3, cost:2, label:'보급의 달인', description:'원정 S등급 재료 +1.', prerequisite:'pathfinder_eye' },
  { id:'pathfinder_legend', calling:'pathfinder', tier:4, cost:2, label:'별길의 전설', description:'월 첫 새 발견물에 100G 보너스.', prerequisite:'pathfinder_supply' },
];

export const growthTraitIds = growthTraitDefinitions.map(item => item.id);

export function canonicalGrowthTraits(purchased: readonly GrowthTraitId[]): GrowthTraitId[] {
  const requested = new Set(purchased);
  const accepted = new Set<GrowthTraitId>();
  for (const definition of growthTraitDefinitions) {
    if (!requested.has(definition.id)) continue;
    if (definition.prerequisite !== null && !accepted.has(definition.prerequisite)) continue;
    accepted.add(definition.id);
  }
  return growthTraitIds.filter(id => accepted.has(id));
}

export function canPurchaseGrowthTrait(id: GrowthTraitId, purchased: GrowthTraitId[], points: number): boolean {
  if (purchased.includes(id)) return false;
  const definition = growthTraitDefinitions.find(item => item.id === id);
  if (!definition || points < definition.cost) return false;
  const validPurchased = canonicalGrowthTraits(purchased);
  return definition.prerequisite === null || validPurchased.includes(definition.prerequisite);
}

export function purchaseGrowthTrait(id: GrowthTraitId, purchased: GrowthTraitId[], points: number) {
  if (!canPurchaseGrowthTrait(id, purchased, points)) return { purchased:false, traits:purchased, points };
  const definition = growthTraitDefinitions.find(item => item.id === id)!;
  return { purchased:true, traits:[...canonicalGrowthTraits(purchased), id], points:points - definition.cost };
}

export function activeCallingTraits(calling: GuardianCallingId | null, purchased: GrowthTraitId[]): GrowthTraitId[] {
  if (!calling) return [];
  const validPurchased = new Set(canonicalGrowthTraits(purchased));
  return growthTraitDefinitions.filter(item => item.calling === calling && validPurchased.has(item.id)).map(item => item.id);
}
