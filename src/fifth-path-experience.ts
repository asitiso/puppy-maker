export type FifthPathNormalCandidate = {
  id: string;
  title: string;
  tendency: string;
  reasons: readonly string[];
};

export type FifthPathSpringPresentationInput = {
  fifthEligible: boolean;
  normalCandidates: readonly FifthPathNormalCandidate[];
  eligibilityReasons: readonly string[];
};

export type FifthPathSpringPresentation = {
  normalCandidates: readonly FifthPathNormalCandidate[];
  fifthCandidate: {
    id: 'fifth_path_candidate';
    choiceId: 'true_path';
    title: string;
    cta: string;
    reasons: readonly string[];
  } | null;
  autoSelectedCampaign: null;
};

export type FifthPathSeasonPresentationInput = {
  activeCampaign: string | null;
  season: 'summer' | 'autumn' | 'winter';
  worldSignals: readonly string[];
  bondSignals: readonly string[];
};

export type FifthPathSummerPresentation = {
  campaign: 'true_path';
  season: 'summer';
  title: string;
  objective: string;
  reveal: string;
  lyra: string;
  world: readonly string[];
  nextSeason: 'autumn';
};

export type FifthPathAutumnPresentation = {
  campaign: 'true_path';
  season: 'autumn';
  title: string;
  objective: string;
  crisis: string;
  choice: {
    id: 'rewrite_the_pattern';
    label: string;
    consequence: string;
  };
  bond: string;
  world: readonly string[];
  nextSeason: 'winter';
};

export type FifthPathWinterOutcome = 'victory' | 'costly_victory' | 'defeat';

export type FifthPathWinterPresentationInput = FifthPathSeasonPresentationInput & {
  outcome: FifthPathWinterOutcome;
};

export type FifthPathWinterPresentation = {
  campaign: 'true_path';
  season: 'winter';
  title: string;
  objective: string;
  outcome: FifthPathWinterOutcome;
  resolution: string;
  bond: string;
  world: readonly string[];
  next: 'true_ending';
};

export type FifthPathTrueEndingInput = {
  reachedTrueEnding: boolean;
  outcome: FifthPathWinterOutcome;
  worldLegacy: readonly string[];
  bondLegacy: readonly string[];
};

export type FifthPathTrueEndingPresentation = {
  id: 'true_ending';
  title: string;
  summary: string;
  worldLegacy: readonly string[];
  bondLegacy: readonly string[];
  future: string;
};

export function buildFifthPathSpringPresentation(
  input: FifthPathSpringPresentationInput,
): FifthPathSpringPresentation {
  return {
    normalCandidates: [...input.normalCandidates],
    fifthCandidate: input.fifthEligible
      ? {
          id: 'fifth_path_candidate',
          choiceId: 'true_path',
          title: '다섯 번째 길',
          cta: '이 가능성을 선택한다',
          reasons: [...input.eligibilityReasons],
        }
      : null,
    autoSelectedCampaign: null,
  };
}

export function buildFifthPathSummerPresentation(
  input: FifthPathSeasonPresentationInput,
): FifthPathSummerPresentation | null {
  if (input.activeCampaign !== 'true_path' || input.season !== 'summer') return null;

  return {
    campaign: 'true_path',
    season: 'summer',
    title: '다섯 번째 길 · Summer',
    objective: '갈라진 길들의 뒤에 있는 하나의 원인을 추적한다',
    reveal: '서로 달라 보였던 선택들이 더 깊은 하나의 현상으로 이어지기 시작해요.',
    lyra: input.bondSignals[0] ?? '리라는 설명할 수 없는 익숙함을 느껴요.',
    world: [...input.worldSignals],
    nextSeason: 'autumn',
  };
}

export function buildFifthPathAutumnPresentation(
  input: FifthPathSeasonPresentationInput,
): FifthPathAutumnPresentation | null {
  if (input.activeCampaign !== 'true_path' || input.season !== 'autumn') return null;

  return {
    campaign: 'true_path',
    season: 'autumn',
    title: '다섯 번째 길 · Autumn',
    objective: '갈라진 해법을 하나의 공동 선택으로 모은다',
    crisis: '서로 옳았던 네 길의 해법이 같은 위기에서 동시에 충돌해요.',
    choice: {
      id: 'rewrite_the_pattern',
      label: '정답을 반복하지 않고 새로운 합의를 만든다',
      consequence: '누구의 과거도 지우지 않은 채 세계가 다음 선택을 할 여지를 남겨요.',
    },
    bond: input.bondSignals[0] ?? '리라는 과거의 정답보다 함께 만드는 다음 선택을 바라봐요.',
    world: [...input.worldSignals],
    nextSeason: 'winter',
  };
}

const winterResolutions: Record<FifthPathWinterOutcome, string> = {
  victory: '긴 밤의 반복을 끊고 모두가 다음 선택을 할 수 있는 새벽을 열었어요.',
  costly_victory: '긴 밤은 끝났지만 그 선택의 흔적과 약속은 다음 삶에도 남아요.',
  defeat: '이번 밤을 완전히 이기지는 못했지만, 반복을 알아본 기억이 다음 새벽의 길이 돼요.',
};

export function buildFifthPathWinterPresentation(
  input: FifthPathWinterPresentationInput,
): FifthPathWinterPresentation | null {
  if (input.activeCampaign !== 'true_path' || input.season !== 'winter') return null;

  return {
    campaign: 'true_path',
    season: 'winter',
    title: '다섯 번째 길 · Long Night',
    objective: '긴 밤의 원인을 끝내는 대신, 세계가 스스로 다음 선택을 할 구조를 남긴다',
    outcome: input.outcome,
    resolution: winterResolutions[input.outcome],
    bond: input.bondSignals[0] ?? '리라는 이번에는 기억을 잃지 않겠다고 약속해요.',
    world: [...input.worldSignals],
    next: 'true_ending',
  };
}

const trueEndingSummaries: Record<FifthPathWinterOutcome, string> = {
  victory: '반복이 끝난 자리에서, 모두가 자기 선택을 이어갈 새벽이 시작돼요.',
  costly_victory: '대가의 흔적은 남았지만, 그 흔적까지 기억한 채 다른 봄을 선택할 수 있어요.',
  defeat: '완전한 승리는 아니었지만, 반복을 알아본 기억이 다음 삶의 자유를 남겼어요.',
};

export function buildFifthPathTrueEndingPresentation(
  input: FifthPathTrueEndingInput,
): FifthPathTrueEndingPresentation | null {
  if (!input.reachedTrueEnding) return null;

  return {
    id: 'true_ending',
    title: 'True Ending · 반복 너머의 봄',
    summary: trueEndingSummaries[input.outcome],
    worldLegacy: [...input.worldLegacy],
    bondLegacy: [...input.bondLegacy],
    future: '다음 삶은 정답을 반복하는 회차가 아니라, 스스로 선택할 수 있는 세계로 이어져요.',
  };
}
