import { describe, expect, it } from 'vitest';
import { seasonStampDefinitions, stampForOuting } from './season-stamps';

describe('seasonal outing stamps', () => {
  it('awards a stamp only at the recommended seasonal outing', () => {
    expect(stampForOuting(4, 'forest')).toBe('spring');
    expect(stampForOuting(4, 'village')).toBeNull();
    expect(stampForOuting(7, 'lakeside')).toBe('summer');
    expect(stampForOuting(10, 'village')).toBe('autumn');
    expect(stampForOuting(1, 'lakeside')).toBe('winter');
  });

  it('defines four reusable seasonal stamp labels', () => {
    expect(seasonStampDefinitions.map(item => item.id)).toEqual(['spring','summer','autumn','winter']);
    expect(seasonStampDefinitions.every(item => item.rewardGems === 1)).toBe(true);
  });
});
