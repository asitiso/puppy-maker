import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import LayeredHome from './LayeredHome';
import { initialState } from './game';

describe('LayeredHome hierarchy', () => {
  it('surfaces the next action and essential status without opening a panel', () => {
    const html = renderToStaticMarkup(<LayeredHome state={initialState} onSchedule={vi.fn()} />);
    expect(html).toContain('이번 달 일정 짜기');
    expect(html).toContain('4월 2주차');
    expect(html).toContain('평온');
    expect(html).toContain('82 / 100');
    expect(html).toContain('Lv.');
  });

  it('uses the tired Runa presentation on a tired home state', () => {
    const html = renderToStaticMarkup(<LayeredHome state={{ ...initialState, condition: 'tired' }} onSchedule={vi.fn()} />);
    expect(html).toContain('/assets/runa/runa_tired.png');
  });
});
