import type { MemoryId } from './game-core';
import type { OutingLocationId } from './adventure';
import type { GuardianRankId } from './guardian-rank';

export type StoryChapterId = 'first_step' | 'wide_world' | 'trusted_bond' | 'guardian_oath' | 'starlight_road';

export type StoryChapterDefinition = {
  id: StoryChapterId;
  title: string;
  summary: string;
  unlockHint: string;
  rewardGems: number;
};

export type StoryProgress = {
  memories: MemoryId[] | string[];
  visitedOutings: OutingLocationId[] | string[];
  affection: number;
  guardianRank: GuardianRankId;
  discoveries: number;
};

export const storyChapterDefinitions: StoryChapterDefinition[] = [
  {
    id: 'first_step',
    title: '첫 발걸음',
    summary: '루나는 처음으로 수호자 훈련을 마쳤다. 작은 한 걸음이 앞으로 이어질 긴 여정의 시작이 되었다.',
    unlockHint: '첫 훈련을 완료하면 열려요.',
    rewardGems: 0,
  },
  {
    id: 'wide_world',
    title: '넓어진 세계',
    summary: '별빛 숲과 마법 마을, 바람 호숫가를 돌아본 루나는 집 밖의 세계가 생각보다 훨씬 넓다는 걸 알게 되었다.',
    unlockHint: '세 곳의 외출 장소를 모두 방문하면 열려요.',
    rewardGems: 1,
  },
  {
    id: 'trusted_bond',
    title: '마음을 나누는 사이',
    summary: '함께 보낸 시간이 쌓이며 루나는 조심스럽게 마음속 이야기를 꺼내기 시작했다.',
    unlockHint: '루나와 가까운 친구가 되면 열려요.',
    rewardGems: 1,
  },
  {
    id: 'guardian_oath',
    title: '수호자의 맹세',
    summary: '쌓아온 기억과 숙련은 이제 우연이 아니다. 루나는 정식 수호자로서 자신의 길을 선택한다.',
    unlockHint: '정식 수호자 등급에 도달하면 열려요.',
    rewardGems: 2,
  },
  {
    id: 'starlight_road',
    title: '별빛으로 가는 길',
    summary: '숨겨진 흔적들이 하나의 방향을 가리킨다. 루나는 더 먼 곳에서 자신을 부르는 별빛을 느낀다.',
    unlockHint: '숙련 수호자 이상 + 숨겨진 발견물 4개가 필요해요.',
    rewardGems: 3,
  },
];

export const storyChapterIds = storyChapterDefinitions.map(chapter => chapter.id);

const guardianRankOrder: GuardianRankId[] = ['trainee', 'junior', 'guardian', 'veteran', 'starlight'];

function rankAtLeast(rank: GuardianRankId, target: GuardianRankId): boolean {
  return guardianRankOrder.indexOf(rank) >= guardianRankOrder.indexOf(target);
}

export function eligibleStoryChapters(progress: StoryProgress): StoryChapterId[] {
  const unlocked = new Set<StoryChapterId>();
  if (progress.memories.includes('first_training')) unlocked.add('first_step');
  if (['forest', 'village', 'lakeside'].every(id => progress.visitedOutings.includes(id))) unlocked.add('wide_world');
  if (progress.affection >= 75) unlocked.add('trusted_bond');
  if (rankAtLeast(progress.guardianRank, 'guardian')) unlocked.add('guardian_oath');
  if (rankAtLeast(progress.guardianRank, 'veteran') && progress.discoveries >= 4) unlocked.add('starlight_road');
  return storyChapterIds.filter(id => unlocked.has(id));
}
