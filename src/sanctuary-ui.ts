import type { GameState } from './game';
import {
  sanctuarySpecializations,
  sanctuarySpecializationSynergies,
} from './sanctuary-specializations';
import {
  resolveSanctuaryUpgrade,
  sanctuaryEffects,
  sanctuaryFacilities,
  type SanctuaryFacilityId,
  type SanctuaryLevels,
} from './starlight-sanctuary';

const renownLabels = {
  starlight_forest:'별빛 숲',
  ancient_city:'고대 마법도시',
  wind_lakes:'바람 호수령',
} as const;

function effectLabel(id:SanctuaryFacilityId,levels:SanctuaryLevels) {
  const effect = sanctuaryEffects(levels);
  if (id === 'training_hall') return `월간 훈련 성장 +${effect.trainingPercent}%`;
  if (id === 'archive_library') {
    if (levels.archive_library >= 3) return '완료한 달 숙련 XP +1';
    if (levels.archive_library >= 2) return 'A/S 달 숙련 XP +1';
    return levels.archive_library >= 1 ? '강한 결과의 숙련 지원 준비' : '숙련 보너스 0';
  }
  if (id === 'herb_garden') return `월말 피로 -${effect.fatigueRecovery} · 스트레스 -${effect.stressRecovery}`;
  return `성공 원정 Season Journey +${effect.expeditionJourneyBonus}P`;
}

export function sanctuaryUiSummary(state:GameState) {
  const selected = state.sanctuarySpecializations ?? {};
  const facilities = sanctuaryFacilities.map(facility => {
    const level = state.sanctuaryLevels[facility.id];
    const complete = level >= 3;
    const nextLevel = complete ? null : (level + 1) as 1|2|3;
    const step = nextLevel ? facility.upgrades.find(item => item.level === nextLevel)! : null;
    const resolution = complete ? null : resolveSanctuaryUpgrade({
      facility:facility.id,
      levels:state.sanctuaryLevels,
      gold:state.gold,
      materials:state.expeditionMaterials,
      renown:state.regionalRenown,
    });
    const nextLevels = nextLevel ? { ...state.sanctuaryLevels, [facility.id]:nextLevel } : state.sanctuaryLevels;
    let blockReason:string|null = null;
    if (resolution && !resolution.accepted) {
      if (resolution.reason === 'renown' && step) {
        const requirements = Object.entries(step.renown).map(([id,value]) => `${renownLabels[id as keyof typeof renownLabels]} 명성 ${value}`).join(' · ');
        blockReason = `${requirements} 필요`;
      } else if (resolution.reason === 'resources') blockReason = '골드 또는 원정 재료 부족';
      else if (resolution.reason === 'max') blockReason = '최대 레벨';
    }
    const specializationId = selected[facility.id] ?? null;
    const specialization = specializationId
      ? sanctuarySpecializations.find(item => item.id === specializationId) ?? null
      : null;
    const specializationChoices = sanctuarySpecializations.filter(item => item.facility === facility.id);
    return {
      ...facility,
      level,
      complete,
      nextLevel,
      nextCost:step?.cost ?? null,
      canUpgrade:Boolean(resolution?.accepted),
      blockReason,
      currentEffect:effectLabel(facility.id,state.sanctuaryLevels),
      nextEffect:nextLevel ? effectLabel(facility.id,nextLevels) : null,
      specialization,
      specializationChoices,
      canChooseSpecialization:complete && !specialization,
    };
  });
  return {
    levelTotal:facilities.reduce((sum,item) => sum + item.level,0),
    maxLevelTotal:12,
    facilities,
    specializationSynergies:sanctuarySpecializationSynergies(selected),
  };
}
