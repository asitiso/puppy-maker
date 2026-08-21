import { describe, expect, it } from 'vitest';
import { applyBossGrowthPointReward, incrementCallingMonthMastery, monthGrowthPointReward, reconcileBondSceneRewards } from './raising-depth-rewards';

describe('raising depth pure reward boundaries', () => {
  it('keeps the S-month bonus threshold exact and ignores malformed training scores', () => {
    expect(monthGrowthPointReward(899.9)).toBe(1);
    expect(monthGrowthPointReward(900)).toBe(2);
    expect(monthGrowthPointReward(9999)).toBe(2);
    expect(monthGrowthPointReward(Number.NaN)).toBe(1);
    expect(monthGrowthPointReward(Number.POSITIVE_INFINITY)).toBe(1);
    expect(monthGrowthPointReward(Number.NEGATIVE_INFINITY)).toBe(1);
  });

  it('repairs the active Calling mastery counter before incrementing it', () => {
    const base = { vanguard:Number.NaN, arcanist:2.9, caretaker:Number.POSITIVE_INFINITY, pathfinder:-3 };

    expect(incrementCallingMonthMastery(base, 'vanguard')).toEqual({ ...base, vanguard:1 });
    expect(incrementCallingMonthMastery(base, 'arcanist')).toEqual({ ...base, arcanist:3 });
    expect(incrementCallingMonthMastery(base, 'caretaker')).toEqual({ ...base, caretaker:1 });
    expect(incrementCallingMonthMastery(base, 'pathfinder')).toEqual({ ...base, pathfinder:1 });
    expect(incrementCallingMonthMastery(base, null)).toBe(base);
  });

  it('normalizes malformed Bond reward currency before applying rewards', () => {
    const base = {
      affection:55,
      outings:0,
      trainings:0,
      gifts:0,
      guardianRank:'trainee' as const,
      bossClears:0,
      annualRecords:0,
      unlocked:[],
      rewarded:[],
    };

    const malformed = reconcileBondSceneRewards(
      { ...base, gold:Number.NaN, gems:Number.POSITIVE_INFINITY },
      { ...base, gold:Number.NaN, gems:Number.POSITIVE_INFINITY },
    );
    expect(malformed.gold).toBe(100);
    expect(malformed.gems).toBe(0);

    const fractional = reconcileBondSceneRewards(
      { ...base, gold:500.9, gems:2.9 },
      { ...base, gold:500.9, gems:2.9 },
    );
    expect(fractional.gold).toBe(600);
    expect(fractional.gems).toBe(2);
  });

  it('normalizes Growth Points and does not duplicate boss first-clear rewards', () => {
    expect(applyBossGrowthPointReward('forest_guardian', true, [], Number.NaN)).toEqual({
      points:1,
      rewarded:['forest_guardian'],
    });
    expect(applyBossGrowthPointReward('forest_guardian', false, [], Number.POSITIVE_INFINITY)).toEqual({
      points:0,
      rewarded:[],
    });
    expect(applyBossGrowthPointReward('forest_guardian', true, ['forest_guardian'], -4)).toEqual({
      points:0,
      rewarded:['forest_guardian'],
    });
    expect(applyBossGrowthPointReward('forest_guardian', true, [], 2.9)).toEqual({
      points:3,
      rewarded:['forest_guardian'],
    });
  });
});
