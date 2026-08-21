import type { GuardianRankId } from './guardian-rank';

export type CareerRecords = {
  trainings: number;
  bestScore: number;
  sGrades: number;
  outings: number;
  gifts: number;
  monthsCompleted: number;
};

export type CareerTitleId =
  | 'steady_trainer'
  | 'perfect_chaser'
  | 'seasoned_explorer'
  | 'warm_giver'
  | 'story_witness'
  | 'veteran_guardian';

export const careerTitleDefinitions: Array<{ id: CareerTitleId; label: string; description: string }> = [
  { id: 'steady_trainer', label: '꾸준한 수련가', description: '누적 훈련 10회 이상.' },
  { id: 'perfect_chaser', label: '완벽을 좇는 자', description: '최고 훈련 점수 900 이상.' },
  { id: 'seasoned_explorer', label: '노련한 탐험가', description: '누적 외출 10회 이상.' },
  { id: 'warm_giver', label: '따뜻한 선물가', description: '누적 선물 5회 이상.' },
  { id: 'story_witness', label: '이야기의 목격자', description: '육성 스토리 챕터 4개 이상 해금.' },
  { id: 'veteran_guardian', label: '숙련 수호자의 증표', description: '숙련 수호자 이상.' },
];

export const emptyCareerRecords = (): CareerRecords => ({
  trainings: 0,
  bestScore: 0,
  sGrades: 0,
  outings: 0,
  gifts: 0,
  monthsCompleted: 0,
});

function safeNonNegativeInt(value:number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function canonicalCareerRecords(records:CareerRecords): CareerRecords {
  return {
    trainings:safeNonNegativeInt(records.trainings),
    bestScore:safeNonNegativeInt(records.bestScore),
    sGrades:safeNonNegativeInt(records.sGrades),
    outings:safeNonNegativeInt(records.outings),
    gifts:safeNonNegativeInt(records.gifts),
    monthsCompleted:safeNonNegativeInt(records.monthsCompleted),
  };
}

export type CareerAction =
  | { type: 'training'; score: number; grade: 'S' | 'A' | 'B' | 'C' }
  | { type: 'outing' }
  | { type: 'gift' }
  | { type: 'month' };

export function recordCareerAction(records: CareerRecords, action: CareerAction): CareerRecords {
  const current = canonicalCareerRecords(records);
  if (action.type === 'training') {
    const score = safeNonNegativeInt(action.score);
    return {
      ...current,
      trainings: current.trainings + 1,
      bestScore: Math.max(current.bestScore, score),
      sGrades: current.sGrades + (action.grade === 'S' ? 1 : 0),
    };
  }
  if (action.type === 'outing') return { ...current, outings: current.outings + 1 };
  if (action.type === 'gift') return { ...current, gifts: current.gifts + 1 };
  return { ...current, monthsCompleted: current.monthsCompleted + 1 };
}

const guardianOrder: GuardianRankId[] = ['trainee', 'junior', 'guardian', 'veteran', 'starlight'];

export type CareerTitleProgress = {
  records: CareerRecords;
  guardianRank: GuardianRankId;
  openedStories: number;
  openedRaisingStories?: number;
};

export function careerTitles(input: CareerTitleProgress): CareerTitleId[] {
  const unlocked = new Set<CareerTitleId>();
  const records = canonicalCareerRecords(input.records);
  const relevantStories = safeNonNegativeInt(input.openedRaisingStories ?? input.openedStories);
  if (records.trainings >= 10) unlocked.add('steady_trainer');
  if (records.bestScore >= 900) unlocked.add('perfect_chaser');
  if (records.outings >= 10) unlocked.add('seasoned_explorer');
  if (records.gifts >= 5) unlocked.add('warm_giver');
  if (relevantStories >= 4) unlocked.add('story_witness');
  if (guardianOrder.indexOf(input.guardianRank) >= guardianOrder.indexOf('veteran')) unlocked.add('veteran_guardian');
  return careerTitleDefinitions.map(item => item.id).filter(id => unlocked.has(id));
}
