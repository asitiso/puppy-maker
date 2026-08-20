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
  { id: 'story_witness', label: '이야기의 목격자', description: '스토리 챕터 4개 이상 해금.' },
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

export type CareerAction =
  | { type: 'training'; score: number; grade: 'S' | 'A' | 'B' | 'C' }
  | { type: 'outing' }
  | { type: 'gift' }
  | { type: 'month' };

export function recordCareerAction(records: CareerRecords, action: CareerAction): CareerRecords {
  if (action.type === 'training') {
    return {
      ...records,
      trainings: records.trainings + 1,
      bestScore: Math.max(records.bestScore, Math.max(0, Math.floor(action.score))),
      sGrades: records.sGrades + (action.grade === 'S' ? 1 : 0),
    };
  }
  if (action.type === 'outing') return { ...records, outings: records.outings + 1 };
  if (action.type === 'gift') return { ...records, gifts: records.gifts + 1 };
  return { ...records, monthsCompleted: records.monthsCompleted + 1 };
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
  const relevantStories = input.openedRaisingStories ?? input.openedStories;
  if (input.records.trainings >= 10) unlocked.add('steady_trainer');
  if (input.records.bestScore >= 900) unlocked.add('perfect_chaser');
  if (input.records.outings >= 10) unlocked.add('seasoned_explorer');
  if (input.records.gifts >= 5) unlocked.add('warm_giver');
  if (relevantStories >= 4) unlocked.add('story_witness');
  if (guardianOrder.indexOf(input.guardianRank) >= guardianOrder.indexOf('veteran')) unlocked.add('veteran_guardian');
  return careerTitleDefinitions.map(item => item.id).filter(id => unlocked.has(id));
}
