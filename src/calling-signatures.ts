import type { GuardianCallingId } from './guardian-callings';
import type { GrowthTraitId } from './growth-traits';

export type CallingSignatureId =
  | 'rally_strike' | 'guardian_breaker'
  | 'mana_echo' | 'astral_core'
  | 'gentle_guard' | 'heart_anchor'
  | 'trail_reading' | 'star_compass';

export type CallingSignatureDefinition = {
  id: CallingSignatureId;
  calling: GuardianCallingId;
  requiredTrait: GrowthTraitId;
  label: string;
  description: string;
};

export const callingSignatureDefinitions: CallingSignatureDefinition[] = [
  { id:'rally_strike', calling:'vanguard', requiredTrait:'vanguard_focus', label:'집결 일격', description:'원정 첫 공격 +8%.' },
  { id:'guardian_breaker', calling:'vanguard', requiredTrait:'vanguard_legend', label:'수호자 파쇄', description:'보스전 공격 +6%.' },
  { id:'mana_echo', calling:'arcanist', requiredTrait:'arcanist_insight', label:'마력 메아리', description:'원정 첫 기 모으기 +8%.' },
  { id:'astral_core', calling:'arcanist', requiredTrait:'arcanist_legend', label:'성운 핵', description:'보스전 기 모으기 +6%.' },
  { id:'gentle_guard', calling:'caretaker', requiredTrait:'caretaker_bond', label:'다정한 방벽', description:'원정 첫 회피 압박 방어 +10%.' },
  { id:'heart_anchor', calling:'caretaker', requiredTrait:'caretaker_legend', label:'마음의 닻', description:'원정 종료 스트레스 부담 -2.' },
  { id:'trail_reading', calling:'pathfinder', requiredTrait:'pathfinder_eye', label:'길 읽기', description:'일반 원정 첫 클리어 재료 +1.' },
  { id:'star_compass', calling:'pathfinder', requiredTrait:'pathfinder_legend', label:'별의 나침반', description:'지역 완주 시 해당 지역 재료 +1.' },
];

export function callingSignatures(calling: GuardianCallingId | null, purchasedTraits: GrowthTraitId[]): CallingSignatureId[] {
  if (!calling) return [];
  return callingSignatureDefinitions
    .filter(item => item.calling === calling && purchasedTraits.includes(item.requiredTrait))
    .map(item => item.id);
}
