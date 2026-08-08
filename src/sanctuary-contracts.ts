import type { SanctuaryLevels } from './starlight-sanctuary';

export type SanctuaryContractKind = 'training'|'outing'|'gift'|'expedition';
export type SanctuaryContractId = 'training_focus'|'field_patrol'|'warm_bond'|'guardian_sortie';
export type SanctuaryPrestigeRankId = 'outpost'|'haven'|'sanctum'|'citadel'|'celestial';

export type SanctuaryContract = {
  id:SanctuaryContractId;
  kind:SanctuaryContractKind;
  label:string;
  target:number;
  prestige:number;
  reward:{ gold:number; gems:number };
};

const baseContracts = [
  { id:'training_focus' as const, kind:'training' as const, label:'훈련당 집중 수련', target:2, prestige:5, reward:{ gold:100, gems:0 } },
  { id:'field_patrol' as const, kind:'outing' as const, label:'별빛 들판 순찰', target:2, prestige:5, reward:{ gold:80, gems:0 } },
  { id:'warm_bond' as const, kind:'gift' as const, label:'루나와 따뜻한 교감', target:2, prestige:6, reward:{ gold:0, gems:1 } },
  { id:'guardian_sortie' as const, kind:'expedition' as const, label:'수호자 원정 임무', target:2, prestige:7, reward:{ gold:120, gems:0 } },
];

function totalFacilityLevels(levels:SanctuaryLevels) {
  return levels.training_hall + levels.archive_library + levels.herb_garden + levels.observatory;
}

export function sanctuaryContractSet(year:number,month:number,week:number,levels:SanctuaryLevels):SanctuaryContract[] {
  const total = totalFacilityLevels(levels);
  const start = Math.abs((Math.floor(year) * 17 + Math.floor(month) * 7 + Math.floor(week) * 3 + total)) % baseContracts.length;
  const difficulty = Math.floor(total / 4);
  return Array.from({ length:3 },(_,index) => {
    const base = baseContracts[(start + index) % baseContracts.length];
    return {
      ...base,
      target:base.target + Math.min(2,difficulty),
      prestige:base.prestige + difficulty * 2,
      reward:{
        gold:base.reward.gold + difficulty * 50,
        gems:base.reward.gems + (difficulty >= 2 && base.reward.gems > 0 ? 1 : 0),
      },
    };
  });
}

export function advanceSanctuaryContracts(
  contracts:SanctuaryContract[],
  progress:Record<string,number>,
  action:{ kind:SanctuaryContractKind },
  completedIds:string[],
) {
  const next = { ...progress };
  const completed:SanctuaryContract[] = [];
  for (const contract of contracts) {
    const current = Math.min(contract.target,Math.max(0,Math.floor(next[contract.id] ?? 0)));
    if (contract.kind !== action.kind || current >= contract.target) {
      next[contract.id] = current;
      continue;
    }
    const value = Math.min(contract.target,current + 1);
    next[contract.id] = value;
    if (value >= contract.target && !completedIds.includes(contract.id)) completed.push(contract);
  }
  return { progress:next, completed };
}

const prestigeRanks = [
  { id:'outpost' as const, label:'별빛 전초지', threshold:0 },
  { id:'haven' as const, label:'별빛 안식처', threshold:20 },
  { id:'sanctum' as const, label:'수호 성역', threshold:50 },
  { id:'citadel' as const, label:'별빛 성채', threshold:100 },
  { id:'celestial' as const, label:'천상의 수호성역', threshold:180 },
];

export function sanctuaryPrestigeRank(rawPrestige:number) {
  const prestige = Number.isFinite(rawPrestige) ? Math.max(0,Math.floor(rawPrestige)) : 0;
  let index = 0;
  for (let candidate=0; candidate<prestigeRanks.length; candidate += 1) if (prestige >= prestigeRanks[candidate].threshold) index = candidate;
  return {
    ...prestigeRanks[index],
    prestige,
    nextThreshold:prestigeRanks[index + 1]?.threshold ?? null,
  };
}

export function sanctuaryPrestigeReward(rank:SanctuaryPrestigeRankId) {
  if (rank === 'haven') return { gold:300, gems:0 };
  if (rank === 'sanctum') return { gold:0, gems:2 };
  if (rank === 'citadel') return { gold:700, gems:2 };
  if (rank === 'celestial') return { gold:1200, gems:5 };
  return { gold:0, gems:0 };
}
