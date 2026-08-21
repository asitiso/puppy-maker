import type { SanctuaryFacilityId, SanctuaryLevels } from './starlight-sanctuary';

export type SanctuarySpecializationId =
  | 'warrior_doctrine'|'adaptive_drills'
  | 'mastery_codex'|'living_chronicle'
  | 'moonwell_garden'|'bonding_grove'
  | 'expedition_array'|'season_lens';

export type SanctuarySpecializationState = Partial<Record<SanctuaryFacilityId,SanctuarySpecializationId>>;
export type SanctuarySpecializationSynergyId = 'guardian_academy'|'living_haven'|'star_route_network'|'season_oracle';

export type SanctuarySpecializationDefinition = {
  id:SanctuarySpecializationId;
  facility:SanctuaryFacilityId;
  label:string;
  description:string;
};

export const sanctuarySpecializations:SanctuarySpecializationDefinition[] = [
  { id:'warrior_doctrine', facility:'training_hall', label:'수호 전투 교본', description:'훈련 성장을 더 강하게 밀어붙이는 전문화예요.' },
  { id:'adaptive_drills', facility:'training_hall', label:'적응형 훈련법', description:'모든 훈련에 고르게 대응하는 유연한 전문화예요.' },
  { id:'mastery_codex', facility:'archive_library', label:'숙련의 대전서', description:'훈련 숙련 경험을 더 깊게 축적하는 전문화예요.' },
  { id:'living_chronicle', facility:'archive_library', label:'살아있는 연대기', description:'월간 기록과 시즌 여정을 강화하는 전문화예요.' },
  { id:'moonwell_garden', facility:'herb_garden', label:'달샘 정원', description:'월말 피로와 스트레스 회복을 강화하는 전문화예요.' },
  { id:'bonding_grove', facility:'herb_garden', label:'유대의 숲', description:'선물과 외출에서 루나와의 유대를 더 깊게 만드는 전문화예요.' },
  { id:'expedition_array', facility:'observatory', label:'원정 항로 배열', description:'원정의 시즌 여정 진행을 강화하는 전문화예요.' },
  { id:'season_lens', facility:'observatory', label:'계절 관측 렌즈', description:'주간 시즌 토큰과 계절 흐름을 강화하는 전문화예요.' },
];

const specializationById = new Map(sanctuarySpecializations.map(item => [item.id,item]));

function validSelectedIds(selected:SanctuarySpecializationState):Set<SanctuarySpecializationId> {
  const ids = new Set<SanctuarySpecializationId>();
  for (const [facility,id] of Object.entries(selected)) {
    const definition = specializationById.get(id as SanctuarySpecializationId);
    if (definition?.facility === facility) ids.add(definition.id);
  }
  return ids;
}

export function resolveSanctuarySpecialization(input:{
  specialization:SanctuarySpecializationId;
  levels:SanctuaryLevels;
  selected:SanctuarySpecializationState;
}) {
  const definition = specializationById.get(input.specialization);
  if (!definition) return { accepted:false as const, reason:'invalid' as const, selected:input.selected };
  if (input.levels[definition.facility] < 3) return { accepted:false as const, reason:'level' as const, selected:input.selected };
  if (input.selected[definition.facility]) return { accepted:false as const, reason:'chosen' as const, selected:input.selected };
  return {
    accepted:true as const,
    selected:{ ...input.selected, [definition.facility]:definition.id },
    definition,
  };
}

export function sanctuarySpecializationSynergies(selected:SanctuarySpecializationState):SanctuarySpecializationSynergyId[] {
  const ids = validSelectedIds(selected);
  const result:SanctuarySpecializationSynergyId[] = [];
  if (ids.has('warrior_doctrine') && ids.has('mastery_codex')) result.push('guardian_academy');
  if (ids.has('bonding_grove') && ids.has('living_chronicle')) result.push('living_haven');
  if (ids.has('expedition_array') && ids.has('adaptive_drills')) result.push('star_route_network');
  if (ids.has('season_lens') && ids.has('moonwell_garden')) result.push('season_oracle');
  return result;
}

export function sanctuarySpecializationEffects(selected:SanctuarySpecializationState) {
  const ids = validSelectedIds(selected);
  return {
    trainingPercent:(ids.has('warrior_doctrine') ? 2 : 0) + (ids.has('adaptive_drills') ? 1 : 0),
    masteryXp:ids.has('mastery_codex') ? 1 : 0,
    monthlyJourneyBonus:ids.has('living_chronicle') ? 5 : 0,
    fatigueRecovery:ids.has('moonwell_garden') ? 1 : 0,
    stressRecovery:ids.has('moonwell_garden') ? 1 : 0,
    bondAffectionBonus:ids.has('bonding_grove') ? 1 : 0,
    expeditionJourneyBonus:ids.has('expedition_array') ? 2 : 0,
    weeklyTokenBonus:ids.has('season_lens') ? 1 : 0,
  };
}

export function sanctuarySpecializationGameplayEffects(selected:SanctuarySpecializationState) {
  const base = sanctuarySpecializationEffects(selected);
  const synergies = sanctuarySpecializationSynergies(selected);
  return {
    ...base,
    trainingPercent:base.trainingPercent + (synergies.includes('guardian_academy') ? 1 : 0),
    bondAffectionBonus:base.bondAffectionBonus + (synergies.includes('living_haven') ? 1 : 0),
    expeditionJourneyBonus:base.expeditionJourneyBonus + (synergies.includes('star_route_network') ? 1 : 0),
    weeklyTokenBonus:base.weeklyTokenBonus + (synergies.includes('season_oracle') ? 1 : 0),
  };
}
