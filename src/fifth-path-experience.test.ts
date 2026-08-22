import { describe, expect, it } from 'vitest';
import {
  buildFifthPathAutumnPresentation,
  buildFifthPathSpringPresentation,
  buildFifthPathSummerPresentation,
} from './fifth-path-experience';

const normalCandidates = [
  { id: 'caretaker', title: 'Caretaker', tendency: '떠오르는 가능성', reasons: ['이번 봄의 행동이 이 길을 열었어요.'] },
  { id: 'pathfinder', title: 'Pathfinder', tendency: '희미하게 보이는 길', reasons: ['현재 회차의 선택이 이 방향을 가리켜요.'] },
] as const;

describe('Fifth Path Spring presentation contract', () => {
  it('keeps normal paths and adds an explicit true_path choice only when canonical eligibility is provided', () => {
    const eligible = buildFifthPathSpringPresentation({ fifthEligible: true, normalCandidates, eligibilityReasons: ['여러 삶의 단서가 하나의 더 깊은 가능성으로 이어져요.'] });
    expect(eligible.normalCandidates).toHaveLength(2);
    expect(eligible.normalCandidates.map(candidate => candidate.id)).toEqual(['caretaker', 'pathfinder']);
    expect(eligible.fifthCandidate).toEqual({ id: 'fifth_path_candidate', choiceId: 'true_path', title: '다섯 번째 길', cta: '이 가능성을 선택한다', reasons: ['여러 삶의 단서가 하나의 더 깊은 가능성으로 이어져요.'] });
    expect(eligible.autoSelectedCampaign).toBeNull();

    const ineligible = buildFifthPathSpringPresentation({ fifthEligible: false, normalCandidates, eligibilityReasons: [] });
    expect(ineligible.normalCandidates).toHaveLength(2);
    expect(ineligible.fifthCandidate).toBeNull();
    expect(ineligible.autoSelectedCampaign).toBeNull();
  });
});

describe('Fifth Path Summer presentation contract', () => {
  it('reveals the deeper phenomenon only for an explicitly active true_path run', () => {
    const summer = buildFifthPathSummerPresentation({ activeCampaign: 'true_path', season: 'summer', worldSignals: ['서로 다른 캠페인의 흔적이 같은 균열을 가리켜요.'], bondSignals: ['리라가 반복되는 장면을 먼저 알아차렸어요.'] });
    expect(summer).toEqual({ campaign: 'true_path', season: 'summer', title: '다섯 번째 길 · Summer', objective: '갈라진 길들의 뒤에 있는 하나의 원인을 추적한다', reveal: '서로 달라 보였던 선택들이 더 깊은 하나의 현상으로 이어지기 시작해요.', lyra: '리라가 반복되는 장면을 먼저 알아차렸어요.', world: ['서로 다른 캠페인의 흔적이 같은 균열을 가리켜요.'], nextSeason: 'autumn' });
    expect(buildFifthPathSummerPresentation({ activeCampaign: 'caretaker', season: 'summer', worldSignals: [], bondSignals: [] })).toBeNull();
  });
});

describe('Fifth Path Autumn presentation contract', () => {
  it('turns the discovered cause into a qualitative convergence choice with world and bond consequences', () => {
    const autumn = buildFifthPathAutumnPresentation({
      activeCampaign: 'true_path',
      season: 'autumn',
      worldSignals: ['각 진영의 해결 방식이 같은 밤에 서로 충돌해요.'],
      bondSignals: ['리라는 모두를 살리려면 기존의 정답 하나를 포기해야 한다고 말해요.'],
    });

    expect(autumn).toEqual({
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
      bond: '리라는 모두를 살리려면 기존의 정답 하나를 포기해야 한다고 말해요.',
      world: ['각 진영의 해결 방식이 같은 밤에 서로 충돌해요.'],
      nextSeason: 'winter',
    });
  });
});
