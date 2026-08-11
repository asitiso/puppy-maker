import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { GameApp } from './App';
import { initialState } from './game';

describe('GameApp home rendering', () => {
  it('can suppress the legacy hub when the layered home owns the hub screen', () => {
    const html = renderToStaticMarkup(<GameApp state={initialState} dispatch={vi.fn()} renderHub={false} />);
    expect(html).not.toContain('hub-screen');
  });

  it('keeps the legacy hub available for standalone GameApp consumers', () => {
    const html = renderToStaticMarkup(<GameApp state={initialState} dispatch={vi.fn()} />);
    expect(html).toContain('hub-screen');
  });

  it('shows four editable schedule weeks with condition-aware consequences', () => {
    const html = renderToStaticMarkup(<GameApp state={{ ...initialState, screen: 'schedule' }} dispatch={vi.fn()} />);
    expect((html.match(/WEEK/g) ?? [])).toHaveLength(4);
    expect(html).toContain('현재 컨디션');
    expect(html).toContain('피로');
    expect(html).toContain('스트레스');
    expect(html).toContain('↻');
  });

  it('changes training presentation for the scheduled activity and exposes quality feedback', () => {
    const html = renderToStaticMarkup(<GameApp state={{ ...initialState, screen: 'training', week: 2 }} dispatch={vi.fn()} />);
    expect(html).toContain('마법 수업');
    expect(html).toContain('집중 타이밍');
    expect(html).toContain('NORMAL');
    expect(html).toContain('/assets/runa/runa_training_ready.png');
  });
});
