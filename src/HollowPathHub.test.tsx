import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import HollowPathHub, { type HollowPathHubViewModel } from './HollowPathHub';
import {
  buildHollowCampaignPresentation,
  buildHollowChoiceAftermathPresentation,
  buildHollowEndingPresentation,
  buildHollowTemptationPresentation,
} from './hollow-path-experience';

const baseModel: HollowPathHubViewModel = {
  temptation: buildHollowTemptationPresentation({
    dangerTier: 'fractured',
    currentRouteLabel: 'Caretaker',
    inheritedEcho: false,
    finalChoiceAvailable: false,
  }),
  aftermath: null,
  current: null,
  vn: {
    name: '베이르',
    dialogue: '더 빠른 길이 있는데 굳이 돌아갈 필요가 있을까?',
    choices: ['계속 듣는다'],
  },
};

const offerModel: HollowPathHubViewModel = {
  ...baseModel,
  temptation: buildHollowTemptationPresentation({
    dangerTier: 'hollow_candidate',
    currentRouteLabel: 'True Path',
    inheritedEcho: true,
    finalChoiceAvailable: true,
  }),
};

const hollowModel: HollowPathHubViewModel = {
  ...offerModel,
  aftermath: buildHollowChoiceAftermathPresentation({
    result: 'accepted',
    activeRoute: 'hollow',
    currentRouteLabel: 'True Path',
  }),
  current: buildHollowCampaignPresentation({
    activeRoute: 'hollow',
    chapter: 'autumn',
    objective: '분열된 동맹을 다시 움직인다',
    worldSignals: ['동맹은 움직였지만 약속의 의미가 달라졌어요.'],
    bondSignals: ['리라는 베이르의 말이 점점 당신의 말과 닮아간다고 느껴요.'],
  }),
  vn: {
    name: '리라',
    dialogue: '빠른 답보다 네가 무엇을 남기는지 보고 있어.',
    choices: ['내 선택을 끝까지 본다'],
  },
};

const endingModel: HollowPathHubViewModel = {
  ...hollowModel,
  current: buildHollowEndingPresentation({
    reachedHollowEnding: true,
    outcome: 'costly_victory',
    worldLegacy: ['세계는 지름길로 바뀐 약속을 기억해요.'],
    bondLegacy: ['리라는 끝까지 당신을 선택의 주체로 기억해요.'],
  }),
};

describe('HollowPathHub', () => {
  it('keeps the current route visible while atmosphere and Veyr temptation change without exposing hidden internals', () => {
    const html = renderToStaticMarkup(
      <HollowPathHub
        open
        model={baseModel}
        onOpen={() => undefined}
        onClose={() => undefined}
        onAcceptHollow={() => undefined}
        onRefuseHollow={() => undefined}
      />,
    );

    expect(html).toContain('Caretaker');
    expect(html).toContain(baseModel.temptation.atmosphere);
    expect(html).toContain(baseModel.temptation.veyr);
    expect(html).toContain(baseModel.temptation.temptation.shortTermBenefit);
    expect(html).not.toContain('베이르의 손을 잡는다');
    expect(html).not.toMatch(/stable|fractured|hollow_candidate|danger|score|threshold|affinity|trust\s*[:=]|\d+\s*\/\s*100/i);
  });

  it('renders the final offer as explicit accept/refuse actions and never auto-selects Hollow', () => {
    const html = renderToStaticMarkup(
      <HollowPathHub
        open
        model={offerModel}
        onOpen={() => undefined}
        onClose={() => undefined}
        onAcceptHollow={() => undefined}
        onRefuseHollow={() => undefined}
      />,
    );

    expect(html).toContain('True Path');
    expect(html).toContain('지난 삶');
    expect(html).toContain('베이르의 손을 잡는다');
    expect(html).toContain('여기서 멈추고 지금의 길을 지킨다');
    expect(html).not.toContain('자동 선택');
  });

  it('keeps refusal/pending authoritative and renders Hollow chapters only from authoritative presentation data', () => {
    const refusedModel: HollowPathHubViewModel = {
      ...offerModel,
      aftermath: buildHollowChoiceAftermathPresentation({
        result: 'refused',
        activeRoute: 'true_path',
        currentRouteLabel: 'True Path',
      }),
    };
    const pendingModel: HollowPathHubViewModel = {
      ...offerModel,
      aftermath: buildHollowChoiceAftermathPresentation({
        result: 'accepted',
        activeRoute: 'true_path',
        currentRouteLabel: 'True Path',
      }),
    };

    const refusedHtml = renderToStaticMarkup(
      <HollowPathHub open model={refusedModel} onOpen={() => undefined} onClose={() => undefined} onAcceptHollow={() => undefined} onRefuseHollow={() => undefined} />,
    );
    const pendingHtml = renderToStaticMarkup(
      <HollowPathHub open model={pendingModel} onOpen={() => undefined} onClose={() => undefined} onAcceptHollow={() => undefined} onRefuseHollow={() => undefined} />,
    );
    const hollowHtml = renderToStaticMarkup(
      <HollowPathHub open model={hollowModel} onOpen={() => undefined} onClose={() => undefined} onAcceptHollow={() => undefined} onRefuseHollow={() => undefined} />,
    );

    expect(refusedHtml).toContain('손을 놓은 뒤');
    expect(refusedHtml).toContain('True Path');
    expect(pendingHtml).toContain('선택이 세계에 닿기 전');
    expect(pendingHtml).not.toContain('Hollow Path · Summer');
    expect(hollowHtml).toContain('Hollow Path · Autumn');
    expect(hollowHtml).toContain('동맹은 움직였지만 약속의 의미가 달라졌어요.');
    expect(hollowHtml).toContain('리라는 베이르의 말이 점점 당신의 말과 닮아간다고 느껴요.');
  });

  it('renders Hollow Ending qualitatively with World/Bond legacy and no hidden optimization values', () => {
    const html = renderToStaticMarkup(
      <HollowPathHub open model={endingModel} onOpen={() => undefined} onClose={() => undefined} onAcceptHollow={() => undefined} onRefuseHollow={() => undefined} />,
    );

    expect(html).toContain('Hollow Ending · 빈자리 이후');
    expect(html).toContain('세계는 지름길로 바뀐 약속을 기억해요.');
    expect(html).toContain('리라는 끝까지 당신을 선택의 주체로 기억해요.');
    expect(html).toContain('다음 삶');
    expect(html).not.toMatch(/danger|score|threshold|affinity|trust\s*[:=]|rank|\d+\s*\/\s*100/i);
  });

  it('provides a modal Journey shell with Veyr/Lyra VN and omits an empty portrait image', () => {
    const html = renderToStaticMarkup(
      <HollowPathHub open model={hollowModel} onOpen={() => undefined} onClose={() => undefined} onAcceptHollow={() => undefined} onRefuseHollow={() => undefined} />,
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('리라');
    expect(html).toContain('빠른 답보다 네가 무엇을 남기는지 보고 있어.');
    expect(html).not.toContain('src=""');
  });

  it('keeps the closed Home compressed to a single Journey CTA', () => {
    const html = renderToStaticMarkup(
      <HollowPathHub open={false} model={endingModel} onOpen={() => undefined} onClose={() => undefined} onAcceptHollow={() => undefined} onRefuseHollow={() => undefined} />,
    );

    expect(html).toContain('Hollow Path');
    expect(html).toContain('Hollow Ending · 빈자리 이후');
    expect((html.match(/Journey 열기/g) ?? []).length).toBe(1);
  });
});
