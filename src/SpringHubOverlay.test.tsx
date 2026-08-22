import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import SpringHubOverlay, { type SpringHubViewModel } from './SpringHubOverlay';

const model: SpringHubViewModel = {
  season: '봄 · 2월',
  campaign: '아직 선택하지 않음',
  phase: '길이 열리는 중',
  primaryCta: 'Journey 열기',
  relationChange: '미라와의 신뢰가 깊어지고 있어요.',
  worldChange: '축제 준비로 광장 분위기가 달라졌어요.',
  journey: {
    objective: '봄 동안 어떤 수호자가 될지 보여 주세요.',
    events: ['루나와 첫 약속을 남겼어요.', '호숫가에서 낯선 흔적을 발견했어요.'],
    upcomingQuestion: '힘보다 지켜야 할 것을 먼저 고를 수 있을까요?',
  },
  convergence: [
    { id: 'caretaker', title: 'Caretaker', tendency: '강하게 열리는 길', reason: '보호와 책임을 택한 순간이 이어졌어요.', evidence: ['위기에서 보호를 먼저 선택함', '관계에서 책임을 나누는 약속을 남김'] },
    { id: 'pathfinder', title: 'Pathfinder', tendency: '떠오르는 가능성', reason: '새로운 장소와 단서를 따라간 기록이 있어요.', evidence: ['숨겨진 발견을 추적함', '외출에서 미지의 흔적을 조사함'] },
  ],
  bonds: [
    { id: 'mira', name: '미라', trust: '신뢰가 자라는 중', memory: '축제 준비를 함께함', promise: '혼자 짊어지지 않기로 함', conflict: '아직 풀지 못한 책임 문제' },
  ],
  vn: {
    portrait: '/assets/runa/runa_talk.png',
    name: '미라',
    dialogue: '모든 걸 혼자 지키려고 하면 결국 아무도 지킬 수 없어.',
    choices: ['같이 방법을 찾자', '내가 더 강해지면 돼'],
    log: ['미라: 오늘은 조금 늦었네.'],
    seen: true,
  },
};

describe('SpringHubOverlay', () => {
  it('keeps the home summary to season, campaign, one CTA, one relation change and one world change', () => {
    const html = renderToStaticMarkup(<SpringHubOverlay open={false} model={model} onOpen={() => undefined} onClose={() => undefined} />);
    expect(html).toContain('봄 · 2월');
    expect(html).toContain('아직 선택하지 않음');
    expect(html).toContain('Journey 열기');
    expect(html).toContain('미라와의 신뢰가 깊어지고 있어요.');
    expect(html).toContain('축제 준비로 광장 분위기가 달라졌어요.');
  });

  it('renders Journey as story memory, not a quest checklist', () => {
    const html = renderToStaticMarkup(<SpringHubOverlay open model={model} onOpen={() => undefined} onClose={() => undefined} />);
    expect(html).toContain('이야기 기록');
    expect(html).toContain('다가오는 질문');
    expect(html).not.toContain('0/3');
  });

  it('shows 2-3 convergence cards with reasons and evidence without raw affinity numbers', () => {
    const html = renderToStaticMarkup(<SpringHubOverlay open model={model} onOpen={() => undefined} onClose={() => undefined} />);
    expect(html).toContain('강하게 열리는 길');
    expect(html).toContain('위기에서 보호를 먼저 선택함');
    expect(html).not.toMatch(/affinity/i);
    expect(html).not.toContain('85');
  });

  it('presents Character Bond qualitatively and separately from affection gauges', () => {
    const html = renderToStaticMarkup(<SpringHubOverlay open model={model} onOpen={() => undefined} onClose={() => undefined} />);
    expect(html).toContain('신뢰가 자라는 중');
    expect(html).toContain('Memory');
    expect(html).toContain('Promise');
    expect(html).toContain('Conflict');
    expect(html).not.toContain('/ 100');
  });

  it('includes the Spring VN shell primitives', () => {
    const html = renderToStaticMarkup(<SpringHubOverlay open model={model} onOpen={() => undefined} onClose={() => undefined} />);
    expect(html).toContain('미라');
    expect(html).toContain('대화 기록');
    expect(html).toContain('읽은 장면 빠르게');
    expect(html).toContain('같이 방법을 찾자');
  });
});
