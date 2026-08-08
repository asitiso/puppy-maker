import type { MemoryId } from './game-core';
import type { OutingLocationId } from './adventure';
import type { GuardianRankId } from './guardian-rank';

export type MailRewardId = 'welcome' | 'first_training' | 'explorer' | 'guardian_appointment';

export type MailDefinition = {
  id: MailRewardId;
  title: string;
  message: string;
  reward: { gold: number; gems: number };
};

export type MailProgress = {
  memories: MemoryId[] | string[];
  visitedOutings: OutingLocationId[] | string[];
  guardianRank: GuardianRankId;
};

export const mailDefinitions: MailDefinition[] = [
  {
    id: 'welcome',
    title: '루나와의 첫날을 환영해요',
    message: '새로운 수호자 생활에 도움이 되도록 작은 준비금을 보냈어요.',
    reward: { gold: 300, gems: 0 },
  },
  {
    id: 'first_training',
    title: '첫 훈련 완료 축하',
    message: '첫 훈련을 무사히 끝냈네요. 다음 성장에 보태 쓰세요.',
    reward: { gold: 200, gems: 0 },
  },
  {
    id: 'explorer',
    title: '세상을 넓게 본 수호자에게',
    message: '세 곳의 외출 장소를 모두 둘러본 것을 축하해요.',
    reward: { gold: 250, gems: 1 },
  },
  {
    id: 'guardian_appointment',
    title: '정식 수호자 임명 축하',
    message: '정식 수호자로 성장한 루나와 당신에게 특별 보상을 보냅니다.',
    reward: { gold: 0, gems: 2 },
  },
];

const guardianRankOrder: GuardianRankId[] = ['trainee', 'junior', 'guardian', 'veteran', 'starlight'];

function rankAtLeast(rank: GuardianRankId, target: GuardianRankId): boolean {
  return guardianRankOrder.indexOf(rank) >= guardianRankOrder.indexOf(target);
}

export function availableMail(progress: MailProgress): MailRewardId[] {
  const result: MailRewardId[] = ['welcome'];
  if (progress.memories.includes('first_training')) result.push('first_training');
  if (['forest', 'village', 'lakeside'].every(id => progress.visitedOutings.includes(id))) result.push('explorer');
  if (rankAtLeast(progress.guardianRank, 'guardian')) result.push('guardian_appointment');
  return result;
}
