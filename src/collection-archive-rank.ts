export type ArchiveRankId = 'newcomer' | 'keeper' | 'collector' | 'chronicler' | 'master';

export type ArchiveRankDefinition = {
  id: Exclude<ArchiveRankId, 'newcomer'>;
  label: string;
  description: string;
  required: number;
};

export const archiveRankDefinitions: ArchiveRankDefinition[] = [
  { id:'keeper', label:'기억의 수집가', description:'성장의 흔적 10개를 모았어요.', required:10 },
  { id:'collector', label:'별빛 기록가', description:'성장의 흔적 절반을 넘어섰어요.', required:25 },
  { id:'chronicler', label:'루나의 연대기 작가', description:'거의 모든 성장의 순간을 기록했어요.', required:40 },
  { id:'master', label:'수호 연대기의 주인', description:'50개의 성장 흔적을 모두 완성했어요.', required:50 },
];

const newcomer = {
  id:'newcomer' as const,
  label:'첫 장을 연 수호자',
  description:'루나와 함께 첫 성장 기록을 채우고 있어요.',
  required:0,
};

export function archiveRank(rawCurrent: number) {
  const current = Number.isFinite(rawCurrent) ? Math.max(0, Math.min(50, Math.floor(rawCurrent))) : 0;
  const reached = [...archiveRankDefinitions].reverse().find(item => current >= item.required) ?? newcomer;
  const nextDefinition = archiveRankDefinitions.find(item => current < item.required) ?? null;
  return {
    ...reached,
    current,
    next: nextDefinition ? {
      id: nextDefinition.id,
      label: nextDefinition.label,
      required: nextDefinition.required,
      remaining: nextDefinition.required - current,
    } : null,
  };
}
