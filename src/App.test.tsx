import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { GameApp } from './App';
import { initialState } from './game';

describe('GameApp home rendering', () => {
  it('can suppress the legacy hub when the layered home owns the hub screen', () => {
    const html = renderToStaticMarkup(
      <GameApp state={initialState} dispatch={vi.fn()} renderHub={false} />,
    );

    expect(html).not.toContain('hub-screen');
  });

  it('keeps the legacy hub available for standalone GameApp consumers', () => {
    const html = renderToStaticMarkup(
      <GameApp state={initialState} dispatch={vi.fn()} />,
    );

    expect(html).toContain('hub-screen');
  });
});
