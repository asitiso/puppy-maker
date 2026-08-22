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
