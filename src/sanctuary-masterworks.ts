import type { SanctuaryFacilityId, SanctuaryLevels, SanctuaryMaterials } from './starlight-sanctuary';
import type { SanctuarySpecializationState } from './sanctuary-specializations';

export type SanctuaryMasterworkId = 'guardian_arena'|'living_archive'|'moonwell_conservatory'|'astral_nexus';

export type SanctuaryMasterworkDefinition = {
  id:SanctuaryMasterworkId;
  facility:SanctuaryFacilityId;
  label:string;
  description:string;
  cost:{ gold:number; materials:SanctuaryMaterials };
  reward:{ gold:number; gems:number };
};

const materials = (star_bark=0,arcane_shard=0,wind_pearl=0):SanctuaryMaterials => ({ star_bark,arcane_shard,wind_pearl });

export const sanctuaryMasterworks:SanctuaryMasterworkDefinition[] = [
  { id:'guardian_arena', facility:'training_hall', label:'별빛 수호자 대련장', description:'훈련당을 완성형 수호자 수련 시설로 승격해요.', cost:{ gold:2400, materials:materials(10,4,4) }, reward:{ gold:0, gems:1 } },
  { id:'living_archive', facility:'archive_library', label:'살아있는 별의 대서고', description:'기록과 계절의 기억이 스스로 이어지는 대서고예요.', cost:{ gold:2400, materials:materials(4,10,4) }, reward:{ gold:0, gems:1 } },
  { id:'moonwell_conservatory', facility:'herb_garden', label:'달샘 성역 온실', description:'루나의 회복과 평온을 지켜 주는 영구 정원이예요.', cost:{ gold:2200, materials:materials(4,4,10) }, reward:{ gold:0, gems:1 } },
  { id:'astral_nexus', facility:'observatory', label:'천체 항로 연결핵', description:'성역과 원정 항로를 하나의 별자리 망으로 연결해요.', cost:{ gold:2800, materials:materials(8,8,8) }, reward:{ gold:0, gems:2 } },
];

const byId = new Map(sanctuaryMasterworks.map(item => [item.id,item]));

export function canBuildSanctuaryMasterwork(input:{
  id:SanctuaryMasterworkId;
  levels:SanctuaryLevels;
  specializations:SanctuarySpecializationState;
  completed:ReadonlyArray<SanctuaryMasterworkId>;
  gold:number;
  materials:SanctuaryMaterials;
}) {
  const definition = byId.get(input.id);
  if (!definition) return { accepted:false as const, reason:'invalid' as const };
  if (input.completed.includes(input.id)) return { accepted:false as const, reason:'completed' as const, definition };
  if (input.levels[definition.facility] < 3) return { accepted:false as const, reason:'level' as const, definition };
  if (!input.specializations[definition.facility]) return { accepted:false as const, reason:'specialization' as const, definition };
  const enoughMaterials = (Object.keys(definition.cost.materials) as Array<keyof SanctuaryMaterials>)
    .every(id => Number.isFinite(input.materials[id]) && input.materials[id] >= definition.cost.materials[id]);
  if (!Number.isFinite(input.gold) || input.gold < definition.cost.gold || !enoughMaterials) return { accepted:false as const, reason:'resources' as const, definition };
  return { accepted:true as const, definition };
}

export function sanctuaryMasterworkEffects(completed:ReadonlyArray<SanctuaryMasterworkId>) {
  const ids = new Set(completed);
  return {
    trainingPercent:ids.has('guardian_arena') ? 1 : 0,
    monthlyJourneyBonus:ids.has('living_archive') ? 3 : 0,
    fatigueRecovery:ids.has('moonwell_conservatory') ? 1 : 0,
    stressRecovery:ids.has('moonwell_conservatory') ? 1 : 0,
    expeditionJourneyBonus:ids.has('astral_nexus') ? 1 : 0,
    weeklyTokenBonus:ids.has('astral_nexus') ? 1 : 0,
  };
}

export function sanctuaryMasterworkSetReward(completed:ReadonlyArray<SanctuaryMasterworkId>) {
  const ids = new Set(completed);
  return sanctuaryMasterworks.every(item => ids.has(item.id)) ? { gold:1000, gems:5 } : null;
}
