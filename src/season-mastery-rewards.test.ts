import { describe, expect, it } from 'vitest';
import {
  newlyEarnedSeasonMasteryRewards,
  seasonMasteryRewards,
} from './season-mastery-rewards';

describe('season mastery rewards', () => {
  it('defines one-time rewards for each promoted mastery rank', () => {
    expect(seasonMasteryRewards.map(item => [item.rank,item.threshold,item.reward])).toEqual([
      ['traveler',5,{ gold:200, gems:0 }],
      ['chronicler',12,{ gold:0, gems:1 }],
      ['guardian',24,{ gold:500, gems:2 }],
      ['eternal',40,{ gold:1000, gems:5 }],
    ]);
  });

  it('returns every crossed unclaimed rank reward', () => {
    expect(newlyEarnedSeasonMasteryRewards(25,[]).map(item => item.rank)).toEqual([
      'traveler','chronicler','guardian',
    ]);
  });

  it('skips rewards already claimed', () => {
    expect(newlyEarnedSeasonMasteryRewards(40,['traveler','guardian']).map(item => item.rank)).toEqual([
      'chronicler','eternal',
    ]);
  });
});
