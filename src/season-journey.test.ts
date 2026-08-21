import { describe, expect, it } from 'vitest';
import {
  seasonJourneyKey,
  seasonJourneyPoints,
  seasonJourneyTiers,
  newlyEarnedJourneyTiers,
} from './season-journey';

describe('season journey', () => {
  it('uses the existing four-season calendar for stable journey keys', () => {
    expect(seasonJourneyKey(1,4)).toBe('1-spring');
    expect(seasonJourneyKey(1,7)).toBe('1-summer');
    expect(seasonJourneyKey(2,1)).toBe('2-winter');
  });

  it('awards account-wide journey points for core play actions', () => {
    expect(seasonJourneyPoints({ kind:'month_complete', grade:'B' })).toBe(25);
    expect(seasonJourneyPoints({ kind:'month_complete', grade:'S' })).toBe(35);
    expect(seasonJourneyPoints({ kind:'outing' })).toBe(10);
    expect(seasonJourneyPoints({ kind:'gift' })).toBe(5);
    expect(seasonJourneyPoints({ kind:'expedition', grade:'B', bossFirstClear:false })).toBe(10);
    expect(seasonJourneyPoints({ kind:'expedition', grade:'S', bossFirstClear:true })).toBe(40);
  });

  it('defines ten escalating journey reward tiers', () => {
    expect(seasonJourneyTiers).toHaveLength(10);
    expect(seasonJourneyTiers[0]).toMatchObject({ tier:1, threshold:50 });
    expect(seasonJourneyTiers[9]).toMatchObject({ tier:10, threshold:1250 });
    expect(seasonJourneyTiers[9].reward.gems).toBeGreaterThan(0);
    expect(seasonJourneyTiers[9].reward.tokens).toBeGreaterThan(seasonJourneyTiers[0].reward.tokens);
  });

  it('returns only newly crossed tiers in ascending order without a season claim key', () => {
    expect(newlyEarnedJourneyTiers(40,180,[]).map(tier => tier.tier)).toEqual([1,2,3]);
    expect(newlyEarnedJourneyTiers(180,300,['1-spring:1','1-spring:2','1-spring:3']).map(tier => tier.tier)).toEqual([4]);
  });

  it('recovers reached but unclaimed tiers when a season claim key is supplied', () => {
    expect(newlyEarnedJourneyTiers(
      180,
      200,
      ['1-spring:1'],
      '1-spring',
    ).map(tier => tier.tier)).toEqual([2,3]);
  });

  it('never returns already claimed season tiers during recovery', () => {
    expect(newlyEarnedJourneyTiers(
      180,
      200,
      ['1-spring:1','1-spring:2','1-spring:3'],
      '1-spring',
    )).toEqual([]);
  });

  it('does not unlock every reward tier from non-finite journey scores', () => {
    expect(newlyEarnedJourneyTiers(Number.NaN,Number.NaN,[],'1-spring')).toEqual([]);
    expect(newlyEarnedJourneyTiers(40,Number.POSITIVE_INFINITY,[],'1-spring')).toEqual([]);
    expect(newlyEarnedJourneyTiers(Number.NEGATIVE_INFINITY,60,[],'1-spring').map(tier => tier.tier)).toEqual([1]);
  });
});
