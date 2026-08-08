import type { AnnualRecord } from './annual-records';

export type YearlyAmbitionId = 'training' | 'exploration' | 'bond' | 'season';

export const ambitionDefinitions: Array<{ id: YearlyAmbitionId; label: string; description: string; target: number }> = [
  { id:'training', label:'별을 넘는 훈련', description:'훈련과 S등급을 쌓아 루나의 실력을 증명해요.', target:30 },
  { id:'exploration', label:'세상의 끝까지', description:'외출과 발견을 이어가며 새로운 세계를 열어요.', target:20 },
  { id:'bond', label:'마음을 잇는 한 해', description:'선물과 기억을 쌓아 루나와 더 가까워져요.', target:18 },
  { id:'season', label:'사계의 수호자', description:'계절 인장을 모으거나 꾸준한 외출로 사계의 발자국을 채워요.', target:4 },
];

export function defaultYearlyAmbition(): YearlyAmbitionId {
  return 'training';
}

export function ambitionProgress(id: YearlyAmbitionId, record: AnnualRecord) {
  const target = ambitionDefinitions.find(item => item.id === id)?.target ?? 1;
  const raw = id === 'training'
    ? record.trainings + record.sGrades
    : id === 'exploration'
      ? record.outings + (record.discoveries * 2)
      : id === 'bond'
        ? record.gifts + record.memories
        : Math.max(record.seasonStamps, Math.floor(record.outings / 3));
  const current = Math.max(0, Math.min(target, raw));
  return {
    current,
    target,
    percent: Math.round((current / target) * 100),
    complete: current >= target,
  };
}
