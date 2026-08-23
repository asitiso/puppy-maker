import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import FifthPathHub, { type FifthPathHubViewModel } from './FifthPathHub';

const model: FifthPathHubViewModel = {
  spring: {
    normalCandidates: [
      { id: 'caretaker', title: 'Caretaker', tendency: '떠오르는 가능성', reasons: ['이번 봄의 행동이 이 길을 열었어요.'] },
      { id: 'pathfinder', title: 'Pathfinder', tendency: '희미하게 보이는 길', reasons: ['현재 회차의 선택이 이 방향을 가리켜요.'] },
    ],
    fifthCandidate: {
      id: 'fifth_path_candidate',
      choiceId: 'true_path',
      title: '다섯 번째 길',
      cta: '이 가능성을 선택한다',
      reasons: ['여러 삶의 단서가 하나의 더 깊은 가능성으로 이어져요.'],
    },
    autoSelectedCampaign: null,
  },
  selected: false,
  current: null,
  vn: {
    name: '리라',
    dialogue: '이 장면… 처음이 아닌 것 같아.',
    choices: ['이번에는 다른 답을 찾아보자'],
  },
};

const endingModel: FifthPathHubViewModel = {
  ...model,
  selected: true,
  current: {
    id: 'true_ending',
    title: 'True Ending · 반복 너머의 봄',
    summary: '반복이 끝난 자리에서, 모두가 자기 선택을 이어갈 새벽이 시작돼요.',
    worldLegacy: ['세계는 여러 답을 함께 품을 수 있게 되었어요.'],
    bondLegacy: ['리라는 다음 만남에서도 이번 선택을 기억하겠다고 약속했어요.'],
    future: '다음 삶은 정답을 반복하는 회차가 아니라, 스스로 선택할 수 있는 세계로 이어져요.',
  },
};

describe('FifthPathHub', () => {
  it('keeps ordinary Spring paths visible while presenting Fifth Path as an explicit additive choice', () => {
    const html = renderToStaticMarkup(
      <FifthPathHub open model={model} onOpen={() => undefined} onClose={() => undefined} onSelectTruePath={() => undefined} />,
    );

    expect(html).toContain('Caretaker');
    expect(html).toContain('Pathfinder');
    expect(html).toContain('다섯 번째 길');
    expect(html).toContain('이 가능성을 선택한다');
    expect(html).toContain('추가로 열린 가능성');
    expect(html).not.toContain('자동 선택');
  });

  it('renders selected seasonal story and True Ending qualitatively without hidden optimization values', () => {
    const seasonal: FifthPathHubViewModel = {
      ...model,
      selected: true,
      current: {
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
        bond: '리라는 기존의 정답 하나를 포기해야 한다고 말해요.',
        world: ['각 진영의 해결 방식이 같은 밤에 서로 충돌해요.'],
        nextSeason: 'winter',
      },
    };

    const seasonalHtml = renderToStaticMarkup(
      <FifthPathHub open model={seasonal} onOpen={() => undefined} onClose={() => undefined} onSelectTruePath={() => undefined} />,
    );
    const endingHtml = renderToStaticMarkup(
      <FifthPathHub open model={endingModel} onOpen={() => undefined} onClose={() => undefined} onSelectTruePath={() => undefined} />,
    );

    expect(seasonalHtml).toContain('다섯 번째 길 · Autumn');
    expect(seasonalHtml).toContain('리라는 기존의 정답 하나를 포기해야 한다고 말해요.');
    expect(seasonalHtml).toContain('각 진영의 해결 방식이 같은 밤에 서로 충돌해요.');
    expect(endingHtml).toContain('True Ending · 반복 너머의 봄');
    expect(endingHtml).toContain('세계는 여러 답을 함께 품을 수 있게 되었어요.');
    expect(endingHtml).toContain('리라는 다음 만남에서도 이번 선택을 기억하겠다고 약속했어요.');
    expect(`${seasonalHtml}${endingHtml}`).not.toMatch(/affinity|trust\s*[:=]|score|threshold|legacyPower|\d+\s*\/\s*100/i);
  });

  it('provides a modal Journey shell with Lyra VN and omits an empty portrait image', () => {
    const html = renderToStaticMarkup(
      <FifthPathHub open model={model} onOpen={() => undefined} onClose={() => undefined} onSelectTruePath={() => undefined} />,
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('리라');
    expect(html).toContain('이 장면… 처음이 아닌 것 같아.');
    expect(html).not.toContain('src=""');
  });

  it('keeps the closed Home compressed to a single Journey CTA', () => {
    const html = renderToStaticMarkup(
      <FifthPathHub open={false} model={endingModel} onOpen={() => undefined} onClose={() => undefined} onSelectTruePath={() => undefined} />,
    );

    expect(html).toContain('다섯 번째 길');
    expect(html).toContain('True Ending · 반복 너머의 봄');
    expect((html.match(/Journey 열기/g) ?? []).length).toBe(1);
  });
});
