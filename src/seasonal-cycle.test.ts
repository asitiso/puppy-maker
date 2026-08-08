import { describe, expect, it } from 'vitest';
import { seasonalProfile } from './seasonal-cycle';

describe('seasonal monthly cycle', () => {
  it('maps all months into four stable seasons', () => {
    expect(seasonalProfile(4).season).toBe('spring');
    expect(seasonalProfile(7).season).toBe('summer');
    expect(seasonalProfile(10).season).toBe('autumn');
    expect(seasonalProfile(1).season).toBe('winter');
  });

  it('gives each season a distinct recommended activity and outing', () => {
    expect(seasonalProfile(4)).toMatchObject({ activity:'herb', outing:'forest' });
    expect(seasonalProfile(7)).toMatchObject({ activity:'hunt', outing:'lakeside' });
    expect(seasonalProfile(10)).toMatchObject({ activity:'magic', outing:'village' });
    expect(seasonalProfile(1)).toMatchObject({ activity:'rest', outing:'lakeside' });
  });

  it('normalizes months outside the standard range', () => {
    expect(seasonalProfile(13)).toEqual(seasonalProfile(1));
    expect(seasonalProfile(0)).toEqual(seasonalProfile(12));
  });
});
