import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import WinterEndingHub, { type WinterEndingViewModel } from './WinterEndingHub';

const model: WinterEndingViewModel = {
  season: '겨울 · Long Night',
  campaign: 'Caretaker',
  longNightResult: '끝까지 모두를 지키지는 못했지만, 책임을 나누며 밤을 건넜어요.',
  primaryCta: '마지막 기록 보기',
  endingCommitted: true,
  axes: [
    { id: 'campaign', label: 'Campaign Resolution', title: '함께 버틴 수호자', summary: '보호는 혼자 감당하는 일이 아니라는 결론에 닿았어요.' },
    { id: 'bond', label: 'Character Bond Resolution', title: '미라와 나눈 책임', summary: '서로를 대신 구하는 관계에서 서로의 결정을 믿는 관계로 바뀌었어요.' },
    { id: 'world', label: 'World Resolution', title: '상처 입었지만 이어지는 세계', summary: 'Long Night의 피해는 남았지만 공동체는 다음 계절을 준비해요.' },
    { id: 'career', label: 'Career Resolution', title: '현장에서 증명된 길', summary: '지금까지의 Raising과 Career 기록이 마지막 역할로 이어졌어요.' },
  ],
  epilogue: {
    title: '밤이 끝난 자리에서',
    body: ['새벽이 오자 가장 먼저 들린 것은 환호가 아니라 서로의 이름을 부르는 목소리였어요.'],
    next: '이 결말은 한 번의 기록으로 남아요.',
  },
  vn: {
    portrait: '',
    name: '미라',
    dialogue: '우리가 모두를 구하지 못했어도, 끝까지 서로에게 책임을 미루지 않았다는 건 남아.',
    choices: ['같이 돌아가자'],
    log: ['미라: 이제 밤이 끝났어.'],
    seen: true,
  },
};

describe('WinterEndingHub', () => {
  it('keeps the Winter home compressed to campaign, Long Night result and one ending CTA', () => {
    const html = renderToStaticMarkup(<WinterEndingHub open={false} model={model} onOpen={() => undefined} onClose={() => undefined} />);
    expect(html).toContain('겨울 · Long Night');
    expect(html).toContain('Caretaker');
    expect(html).toContain('책임을 나누며 밤을 건넜어요');
    expect((html.match(/마지막 기록 보기/g) ?? []).length).toBe(1);
  });

  it('renders exactly four qualitative ending dimensions without raw scores or numeric trust', () => {
    const html = renderToStaticMarkup(<WinterEndingHub open model={model} onOpen={() => undefined} onClose={() => undefined} />);
    expect(html).toContain('Campaign Resolution');
    expect(html).toContain('Character Bond Resolution');
    expect(html).toContain('World Resolution');
    expect(html).toContain('Career Resolution');
    expect(html).toContain('미라와 나눈 책임');
    expect(html).not.toMatch(/affinity|trust\s*[:=]|rawScore|careerScore|\d+\s*\/\s*100/i);
  });

  it('treats defeat as a resolved fail-forward ending rather than a retry-only dead end', () => {
    const defeat = { ...model, longNightResult: '패배했지만 Long Night의 결과는 결말로 기록되었어요.', endingCommitted: true };
    const html = renderToStaticMarkup(<WinterEndingHub open model={defeat} onOpen={() => undefined} onClose={() => undefined} />);
    expect(html).toContain('패배했지만 Long Night의 결과는 결말로 기록되었어요.');
    expect(html).toContain('결말 기록 완료');
    expect(html).not.toMatch(/retry|재도전만|다시 싸워야/i);
  });

  it('includes a final epilogue and VN shell without rendering an empty portrait source', () => {
    const html = renderToStaticMarkup(<WinterEndingHub open model={model} onOpen={() => undefined} onClose={() => undefined} />);
    expect(html).toContain('밤이 끝난 자리에서');
    expect(html).toContain('서로의 이름을 부르는 목소리');
    expect(html).toContain('WINTER EPILOGUE');
    expect(html).toContain('미라');
    expect(html).toContain('대화 기록');
    expect(html).not.toContain('src=""');
  });
});
