import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import AutumnHubOverlay, { type AutumnHubViewModel } from './AutumnHubOverlay';

const model: AutumnHubViewModel = {
  season: '가을 · 1월',
  campaign: 'Caretaker',
  phase: 'Great Expedition 이후',
  primaryCta: 'Major Choice 확인하기',
  relationshipChange: '미라와 책임을 나누는 방식이 달라졌어요.',
  expeditionResult: '대원들은 살아 돌아왔지만 선택의 책임이 남았어요.',
  journey: {
    title: '누구를 지킬 것인가',
    objective: 'Great Expedition에서 얻은 결과를 바탕으로 한 번의 Major Choice를 결정한다.',
    framing: 'Great Expedition의 결과가 가을의 결정을 피할 수 없게 만들었어요.',
    beats: ['한 사람을 지키는 일과 모두의 위험을 나누는 일이 충돌했어요.'],
    nextAction: '미라와 마지막 선택을 정리하기',
  },
  majorChoice: {
    prompt: '누구의 위험을 감당할 것인가?',
    committedChoiceId: null,
    options: [
      { id: 'save-critical-person', label: '한 사람을 끝까지 지킨다', description: '가장 위험한 사람을 우선 보호해요.', available: true },
      { id: 'spread-risk', label: '위험을 모두에게 나눈다', description: '전체 생존 가능성을 높이는 쪽을 택해요.', available: true },
      { id: 'team-solution', label: '모두가 함께 감당할 방법을 찾는다', description: '지금까지 쌓인 관계와 현장 경험이 다른 길을 보여줘요.', available: false, lockedHint: '아직 이 길을 확신할 만큼 관계와 현장 경험이 모이지 않았어요.' },
    ],
  },
  bond: {
    id: 'mira',
    name: '미라',
    relationship: '책임을 함께 나누는 동료',
    memories: ['Great Expedition에서 끝까지 서로를 놓치지 않은 기억'],
    promises: [],
    conflicts: ['누구를 먼저 지킬지에 대한 갈등'],
  },
  vn: {
    portrait: '',
    name: '미라',
    dialogue: '이제는 결과보다 우리가 어떤 책임을 선택했는지가 남을 거야.',
    choices: ['한 사람을 지킨다', '위험을 나눈다'],
    log: ['미라: 이번에는 선택을 미룰 수 없어.'],
    seen: true,
  },
};

describe('AutumnHubOverlay', () => {
  it('keeps Autumn Home compressed to campaign, one CTA, one relationship change and one Great Expedition result', () => {
    const html = renderToStaticMarkup(<AutumnHubOverlay open={false} model={model} onOpen={() => undefined} onClose={() => undefined} onCommitChoice={() => undefined} />);
    expect(html).toContain('가을 · 1월');
    expect(html).toContain('Caretaker');
    expect(html).toContain('미라와 책임을 나누는 방식이 달라졌어요.');
    expect(html).toContain('대원들은 살아 돌아왔지만 선택의 책임이 남았어요.');
    expect((html.match(/Major Choice 확인하기/g) ?? []).length).toBe(1);
  });

  it('renders Journey as Great Expedition reflection and exposes two base Major Choices plus one qualitative locked earned option', () => {
    const html = renderToStaticMarkup(<AutumnHubOverlay open model={model} onOpen={() => undefined} onClose={() => undefined} onCommitChoice={() => undefined} />);
    expect(html).toContain('누구를 지킬 것인가');
    expect(html).toContain('Great Expedition');
    expect(html).toContain('한 사람을 끝까지 지킨다');
    expect(html).toContain('위험을 모두에게 나눈다');
    expect(html).toContain('모두가 함께 감당할 방법을 찾는다');
    expect(html).toContain('아직 이 길을 확신할 만큼 관계와 현장 경험이 모이지 않았어요.');
    expect(html).not.toMatch(/affinity|trust\s*[:=]|\d+\s*\/\s*100/i);
  });

  it('shows Character Bond as qualitative relationship plus Memory Promise Conflict', () => {
    const html = renderToStaticMarkup(<AutumnHubOverlay open model={model} onOpen={() => undefined} onClose={() => undefined} onCommitChoice={() => undefined} />);
    expect(html).toContain('책임을 함께 나누는 동료');
    expect(html).toContain('Memory');
    expect(html).toContain('Promise');
    expect(html).toContain('Conflict');
    expect(html).not.toContain('/ 100');
  });

  it('includes an Autumn VN shell without rendering an empty portrait src', () => {
    const html = renderToStaticMarkup(<AutumnHubOverlay open model={model} onOpen={() => undefined} onClose={() => undefined} onCommitChoice={() => undefined} />);
    expect(html).toContain('AUTUMN SCENE');
    expect(html).toContain('미라');
    expect(html).toContain('어떤 책임을 선택했는지가 남을 거야');
    expect(html).toContain('대화 기록');
    expect(html).not.toContain('src=""');
  });
});
