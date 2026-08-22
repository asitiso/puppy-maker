import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import SummerHubOverlay, { type SummerHubViewModel } from './SummerHubOverlay';

const model: SummerHubViewModel = {
  season: '여름 · 1월',
  campaign: 'Caretaker',
  phase: 'Guardian Festival 이후',
  primaryCta: 'Journey 돌아보기',
  relationshipChange: '미라와 책임을 나누는 관계가 되었어요.',
  festivalResult: '값비싼 승리 뒤에도 이야기는 계속돼요.',
  journey: {
    title: '함께 지키는 여름',
    objective: '혼자 짊어지지 않고 모두가 지킬 수 있는 방법을 찾는다.',
    framing: 'Guardian Festival에서 보호와 책임 분담을 선택했어요.',
    beats: ['축제의 위기를 함께 버텼어요.', '결과보다 누구를 지켰는지가 기억에 남았어요.'],
    nextAction: '미라와 축제 뒤의 약속을 확인하기',
  },
  bond: {
    id: 'mira',
    name: '미라',
    relationship: '책임을 함께 나누는 동료',
    memories: ['축제의 위기를 함께 버틴 기억'],
    promises: ['다음에는 혼자 뛰어들지 않기로 한 약속'],
    conflicts: ['무리한 구조가 남긴 갈등'],
  },
  vn: {
    portrait: '/assets/runa/runa_talk.png',
    name: '미라',
    dialogue: '이겼다고 끝난 건 아니야. 우리가 어떻게 지켰는지가 남는 거야.',
    choices: ['다음에는 같이 판단하자', '그래도 누군가는 먼저 뛰어들어야 해'],
    log: ['미라: 축제는 끝났지만 아직 할 말이 있어.'],
    seen: true,
  },
};

describe('SummerHubOverlay', () => {
  it('keeps Summer Home compressed to campaign, one CTA, one relationship change and one festival result', () => {
    const html = renderToStaticMarkup(<SummerHubOverlay open={false} model={model} onOpen={() => undefined} onClose={() => undefined} />);
    expect(html).toContain('여름 · 1월');
    expect(html).toContain('Caretaker');
    expect(html).toContain('Journey 돌아보기');
    expect(html).toContain('미라와 책임을 나누는 관계가 되었어요.');
    expect(html).toContain('값비싼 승리 뒤에도 이야기는 계속돼요.');
    expect((html.match(/Journey 돌아보기/g) ?? []).length).toBe(1);
  });

  it('renders Journey as campaign story reflection with Guardian Festival framing and next action', () => {
    const html = renderToStaticMarkup(<SummerHubOverlay open model={model} onOpen={() => undefined} onClose={() => undefined} />);
    expect(html).toContain('함께 지키는 여름');
    expect(html).toContain('Guardian Festival');
    expect(html).toContain('축제의 위기를 함께 버텼어요.');
    expect(html).toContain('다음 행동');
    expect(html).toContain('미라와 축제 뒤의 약속을 확인하기');
    expect(html).not.toContain('0/3');
  });

  it('shows Character Bond as qualitative relationship plus Memory Promise Conflict without a numeric gauge', () => {
    const html = renderToStaticMarkup(<SummerHubOverlay open model={model} onOpen={() => undefined} onClose={() => undefined} />);
    expect(html).toContain('책임을 함께 나누는 동료');
    expect(html).toContain('Memory');
    expect(html).toContain('Promise');
    expect(html).toContain('Conflict');
    expect(html).not.toContain('/ 100');
    expect(html).not.toMatch(/affinity/i);
  });

  it('includes the Summer VN shell and fail-forward dialogue surface', () => {
    const html = renderToStaticMarkup(<SummerHubOverlay open model={model} onOpen={() => undefined} onClose={() => undefined} />);
    expect(html).toContain('SUMMER SCENE');
    expect(html).toContain('미라');
    expect(html).toContain('이겼다고 끝난 건 아니야');
    expect(html).toContain('대화 기록');
    expect(html).toContain('읽은 장면 빠르게');
    expect(html).toContain('다음에는 같이 판단하자');
  });
});
