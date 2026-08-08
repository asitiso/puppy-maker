import { describe, expect, it } from 'vitest';
import {
  expeditionSeasonClaimKey,
  expeditionSeasonKey,
  expeditionSeasonPoints,
  expeditionSeasonTiers,
  earnedExpeditionSeasonTiers,
} from './expedition-season';

describe('expedition season', () => {
  it('groups months into stable year-season keys', () => {
    expect(expeditionSeasonKey(1, 3)).toBe('1-spring');
    expect(expeditionSeasonKey(1, 8)).toBe('1-summer');
    expect(expeditionSeasonKey(2, 10)).toBe('2-autumn');
    expect(expeditionSeasonKey(2, 12)).toBe('2-winter');
    expect(expeditionSeasonKey(3, 1)).toBe('3-winter');
  });

  it('awards season points by grade plus first boss clear', () => {
    expect(expeditionSeasonPoints('C', false)).toBe(0);
    expect(expeditionSeasonPoints('B', false)).toBe(10);
    expect(expeditionSeasonPoints('A', false)).toBe(20);
    expect(expeditionSeasonPoints('S', false)).toBe(30);
    expect(expeditionSeasonPoints('S', true)).toBe(50);
  });

  it('defines four cumulative reward tiers', () => {
    expect(expeditionSeasonTiers).toEqual([
      { tier:1, threshold:50, reward:{ gold:150, gems:0 } },
      { tier:2, threshold:120, reward:{ gold:0, gems:1 } },
      { tier:3, threshold:220, reward:{ gold:250, gems:0 } },
      { tier:4, threshold:350, reward:{ gold:0, gems:2 } },
    ]);
    expect(earnedExpeditionSeasonTiers(49)).toEqual([]);
    expect(earnedExpeditionSeasonTiers(220)).toEqual([1,2,3]);
  });

  it('creates stable per-season reward claim keys', () => {
    expect(expeditionSeasonClaimKey('2-autumn', 3)).toBe('2-autumn:3');
  });
});
