import { describe, expect, it } from 'vitest';
import {
  buildFifthPathSpringPresentation,
  buildFifthPathSummerPresentation,
} from './fifth-path-experience';

const normalCandidates = [
  { id: 'caretaker', title: 'Caretaker', tendency: '떠오르는 가능성', reasons: ['이번 봄의 행동이 이 길을 열었어요.'] },
  { id: 'pathfinder', title: 'Pathfinder', tendency: '희미하게 보이는 길', reasons: ['현재 회차의 선택이 이 방향을 가리켜요.'] },
] as const;

describe('Fifth Path Spring presentation contract', () => {
  it('keeps normal paths and adds an explicit true_path choice only when canonical eligibility is provided', () => {
    const eligible = buildFifthPathSpringPresentation({
      fifthEligible: true,
      normalCandidates,
      eligibilityReasons: ['여러 삶의 단서가 하나의 더 깊은 가능성으로 이어져요.'],
    });

    expect(eligible.normalCandidates).toHaveLength(2);
    expect(eligible.normalCandidates.map(candidate => candidate.id)).toEqual(['caretaker', 'pathfinder']);
    expect(eligible.fifthCandidate).toEqual({
      id: 'fifth_path_candidate',
      choiceId: 'true_path',
      title: '다섯 번째 길',
      cta: '이 가능성을 선택한다',
      reasons: ['여러 삶의 단서가 하나의 더 깊은 가능성으로 이어져요.'],
    });
    expect(eligible.autoSelectedCampaign).toBeNull();

    const ineligible = buildFifthPathSpringPresentation({
      fifthEligible: false,
      normalCandidates,
      eligibilityReasons: [],
    });

    expect(ineligible.normalCandidates).toHaveLength(2);
    expect(ineligible.fifthCandidate).toBeNull();
    expect(ineligible.autoSelectedCampaign).toBeNull();
  });
});

describe('Fifth Path Summer presentation contract', () => {
  it('reveals the deeper phenomenon only for an explicitly active true_path run', () => {
    const summer = buildFifthPathSummerPresentation({
      activeCampaign: 'true_path',
      season: 'summer',
      worldSignals: ['서로 다른 캠페인의 흔적이 같은 균열을 가리켜요.'],
      bondSignals: ['리라가 반복되는 장면을 먼저 알아차렸어요.'],
    });

    expect(summer).toEqual({
      campaign: 'true_path',
      season: 'summer',
      title: '다섯 번째 길 · Summer',
      objective: '갈라진 길들의 뒤에 있는 하나의 원인을 추적한다',
      reveal: '서로 달라 보였던 선택들이 더 깊은 하나의 현상으로 이어지기 시작해요.',
      lyra: '리라가 반복되는 장면을 먼저 알아차렸어요.',
      world: ['서로 다른 캠페인의 흔적이 같은 균열을 가리켜요.'],
      nextSeason: 'autumn',
    });

    expect(buildFifthPathSummerPresentation({
      activeCampaign: 'caretaker',
      season: 'summer',
      worldSignals: [],
      bondSignals: [],
    })).toBeNull();
  });
});
