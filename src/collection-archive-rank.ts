export type ArchiveRankId = 'newcomer' | 'keeper' | 'collector' | 'chronicler' | 'master' | 'expedition_archivist' | 'chronicle_complete';

export type ArchiveRankDefinition = {
  id: Exclude<ArchiveRankId, 'newcomer'>;
  label: string;
  description: string;
  required: number;
};

export const archiveRankDefinitions: ArchiveRankDefinition[] = [
  { id:'keeper', label:'기억의 수집가', description:'성장의 흔적 10개를 모았어요.', required:10 },
  { id:'collector', label:'별빛 기록가', description:'성장의 흔적 25개를 모았어요.', required:25 },
  { id:'chronicler', label:'루나의 연대기 작가', description:'성장의 흔적 40개를 기록했어요.', required:40 },
  { id:'master', label:'수호 연대기의 주인', description:'기존 성장 도감 50칸을 완성했어요.', required:50 },
  { id:'expedition_archivist', label:'원정 기록관', description:'원정의 절반 이상을 연대기에 남겼어요.', required:75 },
  { id:'chronicle_complete', label:'수호 연대기의 완성자', description:'100개의 성장과 원정 기록을 모두 완성했어요.', required:100 },
];

const newcomer = {
  id:'newcomer' as const,
  label:'첫 장을 연 수호자',
  description:'루나와 함께 첫 성장 기록을 채우고 있어요.',
  required:0,
};

export function archiveRank(rawCurrent: number) {
  const current = Number.isFinite(rawCurrent) ? Math.max(0, Math.min(100, Math.floor(rawCurrent))) : 0;
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
