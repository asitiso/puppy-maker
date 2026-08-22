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
