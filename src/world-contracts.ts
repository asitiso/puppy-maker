import type { ExpeditionGrade, ExpeditionRegionId } from './expedition-regions';
import type { WorldEventDefinition } from './world-event';

export type WorldContractId = 'expedition_clear' | 'high_grade' | 'featured_region';
export type WorldContractProgress = Record<WorldContractId, number>;

export type WorldContractDefinition = {
  id: WorldContractId;
  label: string;
  description: string;
  target: number;
  region: ExpeditionRegionId | null;
  reward: { gold:number; gems:number };
};

const safeYear = (year:number) => Math.max(1, Math.floor(Number.isFinite(year) ? year : 1));
const safeMonth = (month:number) => Math.max(1, Math.min(12, Math.floor(Number.isFinite(month) ? month : 1)));

export function emptyWorldContractProgress(): WorldContractProgress {
  return { expedition_clear:0, high_grade:0, featured_region:0 };
}

export function monthlyWorldContracts(year:number, month:number, event?:WorldEventDefinition): WorldContractDefinition[] {
  void year;
  const canonicalMonth = safeMonth(month);
  const featured = event?.region ?? (canonicalMonth % 3 === 1 ? 'starlight_forest' : canonicalMonth % 3 === 2 ? 'ancient_city' : 'wind_lakes');
  return [
    { id:'expedition_clear', label:'원정대의 발걸음', description:'이번 달 원정을 3회 성공하세요.', target:3, region:null, reward:{ gold:100, gems:0 } },
    { id:'high_grade', label:'빛나는 기록', description:'A 또는 S등급 원정을 2회 달성하세요.', target:2, region:null, reward:{ gold:0, gems:1 } },
    { id:'featured_region', label:'월드 이벤트 지원', description:'추천 지역 원정을 2회 성공하세요.', target:2, region:featured, reward:{ gold:150, gems:0 } },
  ];
}

export function worldContractRewardKey(year:number, month:number, id:WorldContractId): string {
  return `${safeYear(year)}-${safeMonth(month)}:${id}`;
}

type AdvanceInput = {
  year:number;
  month:number;
  event:WorldEventDefinition;
  progress:WorldContractProgress;
  rewardedKeys:string[];
  region:ExpeditionRegionId;
  grade:ExpeditionGrade;
};

export function advanceWorldContracts(input:AdvanceInput): {
  progress:WorldContractProgress;
  rewardedKeys:string[];
  reward:{ gold:number; gems:number };
  newlyCompleted:WorldContractId[];
} {
  const contracts = monthlyWorldContracts(input.year, input.month, input.event);
  const targetFor = (id:WorldContractId) => contracts.find(contract => contract.id === id)?.target ?? Number.MAX_SAFE_INTEGER;
  const storedProgress = (id:WorldContractId) => {
    const value = input.progress[id];
    return Math.min(targetFor(id), Math.max(0, Math.floor(Number.isFinite(value) ? value : 0)));
  };
  const current:WorldContractProgress = {
    expedition_clear:storedProgress('expedition_clear'),
    high_grade:storedProgress('high_grade'),
    featured_region:storedProgress('featured_region'),
  };

  if (input.grade === 'C') {
    return { progress:current, rewardedKeys:[...input.rewardedKeys], reward:{ gold:0, gems:0 }, newlyCompleted:[] };
  }

  const progress:WorldContractProgress = {
    expedition_clear:Math.min(targetFor('expedition_clear'),current.expedition_clear + 1),
    high_grade:Math.min(targetFor('high_grade'),current.high_grade + (input.grade === 'A' || input.grade === 'S' ? 1 : 0)),
    featured_region:Math.min(targetFor('featured_region'),current.featured_region + (input.region === input.event.region ? 1 : 0)),
  };
  const rewardedKeys = [...input.rewardedKeys];
  const newlyCompleted:WorldContractId[] = [];
  let gold = 0;
  let gems = 0;

  for (const contract of contracts) {
    const key = worldContractRewardKey(input.year, input.month, contract.id);
    if (progress[contract.id] < contract.target || rewardedKeys.includes(key)) continue;
    rewardedKeys.push(key);
    newlyCompleted.push(contract.id);
    gold += contract.reward.gold;
    gems += contract.reward.gems;
  }

  return { progress, rewardedKeys, reward:{ gold, gems }, newlyCompleted };
}
