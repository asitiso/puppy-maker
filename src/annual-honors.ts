import type { AnnualRecord } from './annual-records';

export type AnnualHonorId = 'four_seasons' | 'training_ace' | 'trailblazer' | 'heart_keeper' | 'balanced_guardian';

export type AnnualHonor = {
  id: AnnualHonorId;
  label: string;
  description: string;
};

export const annualHonorDefinitions: Record<AnnualHonorId, AnnualHonor> = {
  four_seasons: { id:'four_seasons', label:'사계의 수호자', description:'한 해의 네 계절 인장을 모두 모은 기록.' },
  training_ace: { id:'training_ace', label:'훈련의 별', description:'강한 훈련 성과와 높은 등급을 남긴 기록.' },
  trailblazer: { id:'trailblazer', label:'길을 여는 탐험가', description:'많은 외출과 발견으로 세계를 넓힌 기록.' },
  heart_keeper: { id:'heart_keeper', label:'마음을 지킨 사람', description:'선물과 기억으로 루나와의 관계를 깊게 만든 기록.' },
  balanced_guardian: { id:'balanced_guardian', label:'균형의 수호자', description:'한쪽에 치우치지 않고 꾸준히 성장한 기록.' },
};

export function annualHonor(record: AnnualRecord): AnnualHonor {
  if (record.seasonStamps >= 4) return annualHonorDefinitions.four_seasons;
  if (record.trainings >= 15 || record.sGrades >= 4 || record.bestScore >= 1200) return annualHonorDefinitions.training_ace;
  if (record.outings >= 12 || record.discoveries >= 6) return annualHonorDefinitions.trailblazer;
  if (record.gifts >= 8 || record.memories >= 11) return annualHonorDefinitions.heart_keeper;
  return annualHonorDefinitions.balanced_guardian;
}
