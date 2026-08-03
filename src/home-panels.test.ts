import { describe, expect, it } from 'vitest';
import { getHomePanel } from './home-panels';

describe('home panel navigation', () => {
  it('returns the inventory panel for the bag menu', () => {
    expect(getHomePanel('bag')).toEqual({
      title: '가방',
      eyebrow: 'INVENTORY',
      items: ['별빛 간식', '회복 물약', '초보자 부적'],
    });
  });

  it('returns the quest panel for the quest menu', () => {
    expect(getHomePanel('quest').title).toBe('퀘스트');
  });

  it('returns no panel for the schedule menu', () => {
    expect(getHomePanel('schedule')).toBeNull();
  });
});
