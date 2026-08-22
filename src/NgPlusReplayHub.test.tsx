import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import NgPlusReplayHub, { type NgPlusReplayViewModel } from './NgPlusReplayHub';

const model: NgPlusReplayViewModel = {
  entry: {
    title: '새로운 가능성',
    previousRun: '지난 삶은 하나의 기억으로 남았어요.',
    currentRun: '이번 봄은 새로운 선택으로 시작해요.',
    cta: '새로운 봄 시작',
  },
  home: {
    season: '봄 · 새로운 가능성',
    runLabel: '현재 회차',
    echoSummary: '익숙한 기억이 희미하게 따라와요.',
    primaryCta: 'Journey 돌아보기',
  },
  journey: {
    pastLife: ['지난 Caretaker의 삶이 희미하게 떠올라요.'],
    reunions: ['미라와 다시 마주쳤어요.'],
    worldEchoes: ['예전 세계의 흔적이 현재와 분리되어 보여요.'],
    currentRun: ['이번 봄의 행동은 새로 기록돼요.'],
  },
  normalCandidates: [
    {
      id: 'caretaker',
      title: 'Caretaker',
      tendency: '떠오르는 가능성',
      reasons: ['이번 회차의 행동이 이 길을 열었어요.'],
    },
    {
      id: 'pathfinder',
      title: 'Pathfinder',
      tendency: '희미하게 보이는 길',
      reasons: ['현재 봄의 선택이 이 방향을 가리켜요.'],
    },
  ],
  specialCandidate: {
    id: 'fifth_path_candidate',
    title: '아직 이름 붙지 않은 가능성',
    reasons: ['몇 번의 삶이 겹쳐 보여요.'],
  },
  vn: {
    name: '미라',
    dialogue: '처음 만나는 것 같은데, 이상하게 익숙해.',
    choices: ['다시 시작하자'],
    log: [],
    seen: false,
  },
};

describe('NgPlusReplayHub', () => {
  it('keeps the replay home compressed and distinguishes the current run from inherited memory', () => {
    const html = renderToStaticMarkup(
      <NgPlusReplayHub open={false} model={model} onOpen={() => undefined} onClose={() => undefined} />,
    );

    expect(html).toContain('봄 · 새로운 가능성');
    expect(html).toContain('현재 회차');
    expect(html).toContain('익숙한 기억이 희미하게 따라와요.');
    expect((html.match(/Journey 돌아보기/g) ?? []).length).toBe(1);
    expect(html).toContain('새로운 가능성');
  });

  it('renders inherited and current-run Journey sections separately', () => {
    const html = renderToStaticMarkup(
      <NgPlusReplayHub open model={model} onOpen={() => undefined} onClose={() => undefined} />,
    );

    expect(html).toContain('지난 삶의 기억');
    expect(html).toContain('다시 만난 관계');
    expect(html).toContain('이어진 세계의 메아리');
    expect(html).toContain('이번 회차의 기록');
    expect(html).toContain('지난 Caretaker의 삶이 희미하게 떠올라요.');
    expect(html).toContain('이번 봄의 행동은 새로 기록돼요.');
  });

  it('keeps at least two ordinary Path candidates and makes the special candidate additive only', () => {
    const html = renderToStaticMarkup(
      <NgPlusReplayHub open model={model} onOpen={() => undefined} onClose={() => undefined} />,
    );

    expect(html).toContain('Caretaker');
    expect(html).toContain('Pathfinder');
    expect(html).toContain('아직 이름 붙지 않은 가능성');
    expect(html).toContain('추가로 보이는 가능성');
    expect(html).not.toContain('Fifth Path 시작');
  });

  it('renders the reunion VN without optimization values or empty portrait source', () => {
    const html = renderToStaticMarkup(
      <NgPlusReplayHub open model={model} onOpen={() => undefined} onClose={() => undefined} />,
    );

    expect(html).toContain('처음 만나는 것 같은데, 이상하게 익숙해.');
    expect(html).not.toMatch(/affinity|trust\s*[:=]|rawScore|careerScore|legacyPower|threshold|\d+\s*\/\s*100/i);
    expect(html).not.toContain('src=""');
  });
});
