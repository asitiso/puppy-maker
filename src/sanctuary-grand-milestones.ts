import type { SanctuaryLevels } from './starlight-sanctuary';

export type SanctuaryGrandRankId = 'seed'|'haven'|'sanctum'|'citadel'|'celestial';
export type SanctuaryGrandRewardRank = Exclude<SanctuaryGrandRankId,'seed'>;

const ranks = [
  { id:'seed' as const, label:'성소의 씨앗', threshold:0, description:'별빛 성소의 기반을 다지는 단계예요.' },
  { id:'haven' as const, label:'별빛 안식처', threshold:12, description:'시설과 활동이 하나의 성소로 연결되기 시작했어요.' },
  { id:'sanctum' as const, label:'수호 성역', threshold:25, description:'전문화와 시설 성장이 안정적인 체계를 이루었어요.' },
  { id:'citadel' as const, label:'별빛 성채', threshold:42, description:'Masterwork와 위상이 결합된 고위 성역이에요.' },
  { id:'celestial' as const, label:'천상의 성역', threshold:65, description:'모든 성역 체계가 완성된 최고 장기 등급이에요.' },
];

export const sanctuaryGrandRewards = [
  { rank:'haven' as const, threshold:12, reward:{ gold:300, gems:0 } },
  { rank:'sanctum' as const, threshold:25, reward:{ gold:0, gems:1 } },
  { rank:'citadel' as const, threshold:42, reward:{ gold:500, gems:2 } },
  { rank:'celestial' as const, threshold:65, reward:{ gold:1200, gems:5 } },
];

const clamp = (value:number,min:number,max:number) => Math.min(max,Math.max(min,Number.isFinite(value) ? Math.floor(value) : min));

export function sanctuaryGrandProgress(input:{
  levels:SanctuaryLevels;
  specializationCount:number;
  masterworkCount:number;
  prestige:number;
}):number {
  const levelScore = (Object.values(input.levels) as number[]).reduce((sum,value) => sum + clamp(value,0,3),0) * 2;
  const specializationScore = clamp(input.specializationCount,0,4) * 2;
  const masterworkScore = clamp(input.masterworkCount,0,4) * 5;
  const prestigeScore = Math.min(13,Math.floor(Math.max(0,Number.isFinite(input.prestige) ? input.prestige : 0) / 10));
  return Math.min(65,levelScore + specializationScore + masterworkScore + prestigeScore);
}

export function sanctuaryGrandRank(rawScore:number) {
  const score = clamp(rawScore,0,65);
  let index = 0;
  for (let candidate = 0; candidate < ranks.length; candidate += 1) if (score >= ranks[candidate].threshold) index = candidate;
  return { ...ranks[index], score, nextThreshold:ranks[index + 1]?.threshold ?? null };
}

export function newlyEarnedSanctuaryGrandRewards(score:number,claimed:ReadonlyArray<SanctuaryGrandRewardRank>) {
  return sanctuaryGrandRewards.filter(item => score >= item.threshold && !claimed.includes(item.rank));
}
