import type { ActivityId } from './game-core';
import type { GuardianRankId } from './guardian-rank';

export type GuardianCallingId = 'vanguard' | 'arcanist' | 'caretaker' | 'pathfinder';

export type GuardianCallingDefinition = {
  id: GuardianCallingId;
  label: string;
  activity: ActivityId;
  description: string;
};

export const guardianCallingDefinitions: GuardianCallingDefinition[] = [
  { id:'vanguard', label:'선봉 수호자', activity:'hunt', description:'근력과 공격으로 길을 여는 전투형 수호자.' },
  { id:'arcanist', label:'별빛 마도사', activity:'magic', description:'마력과 지식으로 전장을 지배하는 마법형 수호자.' },
  { id:'caretaker', label:'마음의 치유사', activity:'rest', description:'회복과 관계를 지켜내는 교감형 수호자.' },
  { id:'pathfinder', label:'별길 탐험가', activity:'herb', description:'발견과 재료 수집에 강한 탐험형 수호자.' },
];

export const guardianCallingIds = guardianCallingDefinitions.map(item => item.id);
const guardianRankOrder: GuardianRankId[] = ['trainee','junior','guardian','veteran','starlight'];

function positiveInt(value:number): number {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
}

function canonicalGold(value:number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function canonicalHistory(history:readonly GuardianCallingId[]): GuardianCallingId[] {
  const result:GuardianCallingId[] = [];
  for (const id of history) {
    if (!guardianCallingIds.includes(id) || result.includes(id)) continue;
    result.push(id);
  }
  return result;
}

export function callingSwitchKey(year: number, month: number): string {
  const safeYear = positiveInt(year);
  const safeMonth = Number.isFinite(month) ? Math.max(1, Math.min(12, Math.floor(month))) : 1;
  return `${safeYear}-${safeMonth}`;
}

export type CallingSelectionInput = {
  current: GuardianCallingId | null;
  next: GuardianCallingId;
  guardianRank: GuardianRankId;
  gold: number;
  year: number;
  month: number;
  lastSwitchKey: string | null;
  history: GuardianCallingId[];
};

export type CallingSelectionResult = CallingSelectionInput & {
  changed: boolean;
  reason: 'rank_locked' | 'same_calling' | 'monthly_lock' | 'insufficient_gold' | null;
};

export function applyCallingSelection(input: CallingSelectionInput): CallingSelectionResult {
  const gold = canonicalGold(input.gold);
  const history = canonicalHistory(input.history);
  if (guardianRankOrder.indexOf(input.guardianRank) < guardianRankOrder.indexOf('guardian')) {
    return { ...input, gold, history, changed:false, reason:'rank_locked' };
  }
  if (input.current === input.next) return { ...input, gold, history, changed:false, reason:'same_calling' };
  const key = callingSwitchKey(input.year, input.month);
  if (input.lastSwitchKey === key) return { ...input, gold, history, changed:false, reason:'monthly_lock' };
  const switching = input.current !== null;
  if (switching && gold < 300) return { ...input, gold, history, changed:false, reason:'insufficient_gold' };
  return {
    ...input,
    current: input.next,
    gold: switching ? gold - 300 : gold,
    lastSwitchKey: key,
    history: history.includes(input.next) ? history : [...history, input.next],
    changed:true,
    reason:null,
  };
}
