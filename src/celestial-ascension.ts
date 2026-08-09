import type { AstralTrialGrade } from './sanctuary-astral-trials';

export type CelestialAscensionRankId = 'earthbound'|'awakened'|'stellar'|'empyrean'|'transcendent';
export type CelestialAscensionRewardRank = Exclude<CelestialAscensionRankId,'earthbound'>;
export type CelestialAscensionRecord = { key:string; grade:AstralTrialGrade; power:number };

const ranks = [
  { id:'earthbound' as const, label:'지상의 별지기', threshold:0, description:'천상의 기록을 모으기 시작한 단계예요.' },
  { id:'awakened' as const, label:'성광 각성자', threshold:12, description:'성소와 별의 힘이 하나로 이어지기 시작했어요.' },
  { id:'stellar' as const, label:'성좌 승천자', threshold:28, description:'여러 별의 시련과 축복을 조화롭게 다루는 단계예요.' },
  { id:'empyrean' as const, label:'천궁 수호자', threshold:48, description:'완성된 성소와 천체 기록을 지키는 고위 단계예요.' },
  { id:'transcendent' as const, label:'초월의 별수호자', threshold:72, description:'모든 천상 성장 체계를 초월적으로 연결한 최고 단계예요.' },
];

export const celestialAscensionRewards = [
  { rank:'awakened' as const, threshold:12, reward:{ gold:250, gems:0, starShards:1 } },
  { rank:'stellar' as const, threshold:28, reward:{ gold:0, gems:1, starShards:2 } },
  { rank:'empyrean' as const, threshold:48, reward:{ gold:500, gems:2, starShards:3 } },
  { rank:'transcendent' as const, threshold:72, reward:{ gold:1200, gems:5, starShards:5 } },
];

const clampInt = (value:number,min:number,max:number) => Math.min(max,Math.max(min,Number.isFinite(value) ? Math.floor(value) : min));
const trialFromKey = (key:string) => key.split(':')[1] ?? '';

export function celestialAscensionProgress(input:{
  trialRecords:ReadonlyArray<CelestialAscensionRecord>;
  blessingCount:number;
  constellationCount:number;
  sanctuaryGrandProgress:number;
}):number {
  const clears = Math.min(12,input.trialRecords.length) * 2;
  const uniqueS = new Set<string>();
  for (const record of input.trialRecords) {
    if (record.grade !== 'S') continue;
    const trial = trialFromKey(record.key);
    if (trial) uniqueS.add(trial);
  }
  const sScore = Math.min(4,uniqueS.size) * 4;
  const blessingScore = clampInt(input.blessingCount,0,4) * 5;
  const constellationScore = clampInt(input.constellationCount,0,5) * 2;
  const sanctuaryScore = Math.floor(clampInt(input.sanctuaryGrandProgress,0,65) / 5);
  return Math.min(83,clears + sScore + blessingScore + constellationScore + sanctuaryScore);
}

export function celestialAscensionRank(rawScore:number) {
  const score = clampInt(rawScore,0,83);
  let index = 0;
  for (let candidate = 0; candidate < ranks.length; candidate += 1) {
    if (score >= ranks[candidate].threshold) index = candidate;
  }
  return { ...ranks[index], score, nextThreshold:ranks[index + 1]?.threshold ?? null };
}

export function newlyEarnedAscensionRewards(score:number,claimed:ReadonlyArray<CelestialAscensionRewardRank>) {
  const safe = clampInt(score,0,83);
  return celestialAscensionRewards.filter(item => safe >= item.threshold && !claimed.includes(item.rank));
}
