import { describe, expect, it } from 'vitest';
import { emptyCallingMastery } from './calling-mastery';
import {
  applyBossGrowthPointReward,
  incrementCallingMonthMastery,
  monthGrowthPointReward,
  reconcileBondSceneRewards,
} from './raising-depth-rewards';

describe('Raising reward corruption boundaries', () => {
  it('does not treat non-finite training score as an S-month bonus', () => {
    expect(monthGrowthPointReward(Number.POSITIVE_INFINITY)).toBe(1);
    expect(monthGrowthPointReward(Number.NaN)).toBe(1);
  });

  it('repairs malformed active Calling mastery before incrementing it', () => {
    const mastery = { ...emptyCallingMastery(), vanguard:Number.NaN };
    expect(incrementCallingMonthMastery(mastery, 'vanguard').vanguard).toBe(1);
  });

  it('sanitizes boss growth points and canonicalizes rewarded boss ids', () => {
    const result = applyBossGrowthPointReward(
      'forest_guardian',
      true,
      ['forest_guardian','forest_guardian'],
      Number.POSITIVE_INFINITY,
    );
    expect(result.points).toBe(0);
    expect(result.rewarded).toEqual(['forest_guardian']);
  });

  it('repairs non-finite bond currency without paying the same scene again', () => {
    const progress = {
      affection:55,
      outings:0,
      trainings:0,
      gifts:0,
      guardianRank:'trainee' as const,
      bossClears:0,
      annualRecords:0,
      unlocked:['first_trust' as const],
      rewarded:['first_trust' as const],
      gold:Number.NaN,
      gems:Number.POSITIVE_INFINITY,
    };
    const result = reconcileBondSceneRewards(progress, progress);
    expect(result.changed).toBe(true);
    expect(result.gold).toBe(0);
    expect(result.gems).toBe(0);
    expect(result.rewarded).toEqual(['first_trust']);
  });
});
