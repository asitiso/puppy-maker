import type { ActivityId, Personality, PersonalityKey, TrainingQuality } from '../game';

// Post-training dialogue used to be one fixed line regardless of how the
// week went, which activity it even was, or who Runa has become — this
// gives it three axes of real variety: how well it went, what she
// actually just did, and (via personalityFlavorLine below) which trait
// she's grown into the most.
const TRAINING_RESULT_LINES: Record<ActivityId, Record<TrainingQuality, string>> = {
  hunt: {
    PERFECT: '표적이 빛나는 순간을 하나도 놓치지 않았어요! 사냥꾼이 다 됐죠?',
    GREAT: '오늘 사냥 훈련, 몸이 가볍게 잘 움직였어요!',
    GOOD: '몇 번은 타이밍을 놓쳤지만, 그래도 감은 잡혀가요.',
    NORMAL: '오늘은 자꾸 헛손질했어요… 그래도 다음엔 더 잘할 수 있어요.',
  },
  magic: {
    PERFECT: '마력이 완벽하게 안정됐어요! 손끝이 아직도 따뜻해요.',
    GREAT: '주문을 외울 때마다 조금씩 더 선명하게 느껴져요.',
    GOOD: '집중이 자꾸 흐트러졌지만, 마력은 조금 늘어난 것 같아요.',
    NORMAL: '오늘은 마력이 마음대로 안 움직였어요… 어려운 하루였어요.',
  },
  rest: {
    PERFECT: '숨을 고르니까 몸도 마음도 완전히 편안해졌어요.',
    GREAT: '오늘은 정말 푹 쉰 것 같아요. 덕분에 개운해요.',
    GOOD: '조금 뒤척이긴 했지만, 그래도 쉬고 나니 나아졌어요.',
    NORMAL: '왠지 오늘은 잘 쉬어지지가 않았어요… 그래도 곁에 있어줘서 고마워요.',
  },
  herb: {
    PERFECT: '반짝이는 약초를 하나도 놓치지 않고 다 찾았어요!',
    GREAT: '오늘 채집한 약초들, 냄새가 참 좋아요.',
    GOOD: '몇 개는 놓쳤지만, 바구니가 그래도 꽤 찼어요.',
    NORMAL: '오늘은 눈에 잘 안 띄었어요… 그래도 숲을 걷는 건 즐거웠어요.',
  },
};

export function trainingResultLine(quality: TrainingQuality, activity: ActivityId): string {
  return TRAINING_RESULT_LINES[activity][quality];
}

// Result-screen (monthly) retrospective — deliberately different wording
// from trainingResultLine's dialogue reaction so the two screens the
// player sees back-to-back (Dialogue → Result) don't repeat themselves.
export function monthlySummaryLine(quality: TrainingQuality): string {
  switch (quality) {
    case 'PERFECT':
      return '이번 달, 루나는 스스로도 놀랄 만큼 크게 성장했어요.';
    case 'GREAT':
      return '이번 달도 루나는 착실하게 한 걸음 더 나아갔어요.';
    case 'GOOD':
      return '조금 서툴렀지만, 루나는 꾸준히 자기 몫을 해냈어요.';
    case 'NORMAL':
      return '힘든 순간도 있었지만, 함께 보낸 한 달은 루나에게 남았어요.';
  }
}

// Fixed priority order (courage > kindness > curiosity > calmness) so a
// tie between traits always resolves the same way run to run — no
// hidden randomness in what should be a deterministic read of the
// character sheet.
const TRAIT_PRIORITY: PersonalityKey[] = ['courage', 'kindness', 'curiosity', 'calmness'];

export function dominantTrait(personality: Personality): PersonalityKey {
  return TRAIT_PRIORITY.reduce((best, key) => (personality[key] > personality[best] ? key : best));
}

export function personalityFlavorLine(personality: Personality): string {
  switch (dominantTrait(personality)) {
    case 'courage':
      return '다음엔 더 어려운 것에도 도전해보고 싶어요!';
    case 'kindness':
      return '주인님 덕분에 마음이 따뜻해졌어요.';
    case 'curiosity':
      return '오늘 배운 걸로 또 뭘 할 수 있을지 궁금해요!';
    case 'calmness':
      return '차분하게, 우리 페이스대로 가면 될 것 같아요.';
  }
}
