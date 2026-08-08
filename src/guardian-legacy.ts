import { annualHonor } from './annual-honors';
import type { AnnualRecord } from './annual-records';

export type GuardianLegacyId = 'new_chronicle' | 'first_page' | 'seasoned_chronicle' | 'living_legend' | 'eternal_guardian';

export type GuardianLegacyDefinition = {
  id: GuardianLegacyId;
  label: string;
  threshold: number;
  description: string;
};

export const guardianLegacyDefinitions: GuardianLegacyDefinition[] = [
  { id:'new_chronicle', label:'새로운 연대기', threshold:0, description:'아직 첫 해의 기록을 써 내려가는 중.' },
  { id:'first_page', label:'첫 장의 수호자', threshold:10, description:'한 해의 수호 기록을 완성한 증표.' },
  { id:'seasoned_chronicle', label:'이어지는 연대기', threshold:20, description:'여러 해의 선택이 하나의 성장사로 이어지고 있어요.' },
  { id:'living_legend', label:'살아있는 전설', threshold:30, description:'세 해 이상 이어진 수호의 역사가 루나의 전설이 되었어요.' },
  { id:'eternal_guardian', label:'별빛의 계승자', threshold:50, description:'오랜 시간 이어온 수호의 역사가 별빛처럼 남았습니다.' },
];

export function legacyPoints(records: AnnualRecord[]): number {
  return records.reduce((total, record) => {
    const honor = annualHonor(record);
    const specialHonor = honor.id !== 'balanced_guardian' ? 5 : 0;
    return total + 10 + specialHonor;
  }, 0);
}

export function guardianLegacy(records: AnnualRecord[]) {
  const points = legacyPoints(records);
  const current = [...guardianLegacyDefinitions].reverse().find(item => points >= item.threshold) ?? guardianLegacyDefinitions[0];
  const nextDefinition = guardianLegacyDefinitions.find(item => item.threshold > points);
  return {
    ...current,
    points,
    next: nextDefinition ? { id: nextDefinition.id, label: nextDefinition.label, threshold: nextDefinition.threshold, remaining: nextDefinition.threshold - points } : null,
  };
}
