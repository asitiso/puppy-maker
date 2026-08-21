export type SanctuaryFacilityId = 'training_hall'|'archive_library'|'herb_garden'|'observatory';
export type SanctuaryLevel = 0|1|2|3;
export type SanctuaryLevels = Record<SanctuaryFacilityId,SanctuaryLevel>;
export type SanctuaryMaterials = { star_bark:number; arcane_shard:number; wind_pearl:number };
export type SanctuaryRenown = { starlight_forest:number; ancient_city:number; wind_lakes:number };

export type SanctuaryUpgradeStep = {
  level:1|2|3;
  cost:{ gold:number; materials:SanctuaryMaterials };
  renown:Partial<SanctuaryRenown>;
};

export type SanctuaryFacilityDefinition = {
  id:SanctuaryFacilityId;
  label:string;
  description:string;
  upgrades:SanctuaryUpgradeStep[];
};

const materials = (star_bark=0,arcane_shard=0,wind_pearl=0):SanctuaryMaterials => ({ star_bark,arcane_shard,wind_pearl });

export const sanctuaryFacilities:SanctuaryFacilityDefinition[] = [
  {
    id:'training_hall', label:'수호자 훈련당', description:'매달 훈련 성장을 조금 더 끌어올리는 시설이에요.',
    upgrades:[
      { level:1, cost:{ gold:500, materials:materials(3,0,0) }, renown:{} },
      { level:2, cost:{ gold:900, materials:materials(5,0,2) }, renown:{} },
      { level:3, cost:{ gold:1600, materials:materials(7,3,3) }, renown:{ starlight_forest:3 } },
    ],
  },
  {
    id:'archive_library', label:'별빛 기록 도서관', description:'성장 기록을 정리해 숙련 상승을 돕는 시설이에요.',
    upgrades:[
      { level:1, cost:{ gold:500, materials:materials(0,3,0) }, renown:{} },
      { level:2, cost:{ gold:900, materials:materials(2,5,0) }, renown:{} },
      { level:3, cost:{ gold:1600, materials:materials(3,7,3) }, renown:{ ancient_city:3 } },
    ],
  },
  {
    id:'herb_garden', label:'달빛 약초 정원', description:'매달 끝에 루나가 더 편안하게 회복하도록 돕는 시설이에요.',
    upgrades:[
      { level:1, cost:{ gold:450, materials:materials(0,0,3) }, renown:{} },
      { level:2, cost:{ gold:800, materials:materials(2,0,4) }, renown:{} },
      { level:3, cost:{ gold:1400, materials:materials(3,3,6) }, renown:{ wind_lakes:3 } },
    ],
  },
  {
    id:'observatory', label:'별자리 천문대', description:'원정에서 얻는 Season Journey 진행을 조금 강화하는 시설이에요.',
    upgrades:[
      { level:1, cost:{ gold:600, materials:materials(2,2,2) }, renown:{} },
      { level:2, cost:{ gold:1100, materials:materials(4,4,4) }, renown:{} },
      { level:3, cost:{ gold:1800, materials:materials(6,6,6) }, renown:{ starlight_forest:3, ancient_city:3, wind_lakes:3 } },
    ],
  },
];

export function emptySanctuaryLevels():SanctuaryLevels {
  return { training_hall:0, archive_library:0, herb_garden:0, observatory:0 };
}

function safeLevel(value:unknown):SanctuaryLevel {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.min(3,Math.max(0,Math.floor(value))) as SanctuaryLevel;
}

export function sanitizeSanctuaryLevels(raw:unknown):SanctuaryLevels {
  const source = typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? raw as Record<string,unknown> : {};
  return {
    training_hall:safeLevel(source.training_hall),
    archive_library:safeLevel(source.archive_library),
    herb_garden:safeLevel(source.herb_garden),
    observatory:safeLevel(source.observatory),
  };
}

export function resolveSanctuaryUpgrade(input:{
  facility:SanctuaryFacilityId;
  levels:SanctuaryLevels;
  gold:number;
  materials:SanctuaryMaterials;
  renown:SanctuaryRenown;
}) {
  const facility = sanctuaryFacilities.find(item => item.id === input.facility);
  if (!facility) return { accepted:false as const, reason:'invalid' as const };
  const current = input.levels[input.facility];
  if (current >= 3) return { accepted:false as const, reason:'max' as const };
  const nextLevel = (current + 1) as 1|2|3;
  const step = facility.upgrades.find(item => item.level === nextLevel)!;
  const renownReady = Object.entries(step.renown).every(([id,required]) => {
    const value = input.renown[id as keyof SanctuaryRenown];
    return Number.isFinite(value) && value >= (required ?? 0);
  });
  if (!renownReady) return { accepted:false as const, reason:'renown' as const, nextLevel, cost:step.cost };
  const materialIds = Object.keys(step.cost.materials) as Array<keyof SanctuaryMaterials>;
  const resourcesReady = Number.isFinite(input.gold) && input.gold >= step.cost.gold && materialIds.every(id => Number.isFinite(input.materials[id]) && input.materials[id] >= step.cost.materials[id]);
  if (!resourcesReady) return { accepted:false as const, reason:'resources' as const, nextLevel, cost:step.cost };
  return { accepted:true as const, nextLevel, cost:step.cost, renown:step.renown };
}

export function sanctuaryEffects(levels:SanctuaryLevels) {
  const hall = levels.training_hall;
  const library = levels.archive_library;
  const garden = levels.herb_garden;
  const observatory = levels.observatory;
  return {
    trainingPercent:hall,
    masteryStrongMonth:library >= 2 ? 1 : 0,
    masteryAllMonth:library >= 3 ? 1 : 0,
    fatigueRecovery:garden >= 3 ? 2 : garden >= 1 ? 1 : 0,
    stressRecovery:garden >= 2 ? 1 : 0,
    expeditionJourneyBonus:observatory,
  };
}
