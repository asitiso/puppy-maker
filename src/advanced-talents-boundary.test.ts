import { describe, expect, it } from 'vitest';
import { advancedTalents, applyAdvancedTalentBonuses } from './advanced-talents';

const stats = { strength:50, intelligence:50, magic:50, morality:50, affection:50, stress:50, fatigue:50 };
const personality = { courage:50, kindness:50, curiosity:50, calmness:50 };

describe('advanced talent corruption boundaries', () => {
  it('applies a duplicated talent only once', () => {
    const result = applyAdvancedTalentBonuses(stats, personality, ['hunter_instinct','hunter_instinct'], ['hunt']);
    expect(result.stats.strength).toBe(52);
  });

  it('sanitizes non-finite stats and personality before applying bonuses', () => {
    const result = applyAdvancedTalentBonuses(
      { ...stats, strength:Number.NaN, fatigue:Number.POSITIVE_INFINITY },
      { ...personality, courage:Number.NEGATIVE_INFINITY },
      ['hunter_instinct','steady_recovery','guardian_strike'],
      ['hunt','rest'],
    );
    expect(result.stats.strength).toBe(2);
    expect(result.stats.fatigue).toBe(0);
    expect(result.personality.courage).toBe(1);
    expect(Object.values(result.stats).every(Number.isFinite)).toBe(true);
    expect(Object.values(result.personality).every(Number.isFinite)).toBe(true);
  });

  it('does not unlock talents from NaN or Infinity mastery levels', () => {
    expect(advancedTalents({ hunt:Number.POSITIVE_INFINITY, magic:Number.NaN, rest:0, herb:0 })).toEqual([]);
  });
});
