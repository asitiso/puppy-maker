import { describe, expect, it } from 'vitest';
import { advancedTalents, applyAdvancedTalentBonuses, talentDefinitions } from './advanced-talents';

describe('advanced training talents', () => {
  it('unlocks two talents per mastery line at levels three and five', () => {
    expect(talentDefinitions).toHaveLength(8);
    expect(advancedTalents({ hunt: 2, magic: 2, rest: 2, herb: 2 })).toEqual([]);
    expect(advancedTalents({ hunt: 3, magic: 5, rest: 2, herb: 2 })).toEqual([
      'hunter_instinct', 'arcane_rhythm', 'star_channel',
    ]);
    expect(advancedTalents({ hunt: 5, magic: 5, rest: 5, herb: 5 })).toHaveLength(8);
  });

  it('applies only talents whose activity appears in the current schedule', () => {
    const result = applyAdvancedTalentBonuses(
      { strength: 20, intelligence: 20, magic: 20, morality: 20, affection: 50, stress: 30, fatigue: 30 },
      { courage: 20, kindness: 20, curiosity: 20, calmness: 20 },
      ['hunter_instinct', 'guardian_strike', 'arcane_rhythm', 'star_channel'],
      ['hunt', 'rest', 'herb', 'rest'],
    );
    expect(result.stats.strength).toBe(22);
    expect(result.personality.courage).toBe(21);
    expect(result.stats.magic).toBe(20);
    expect(result.stats.intelligence).toBe(20);
  });

  it('does not apply the same talent twice when the input list is duplicated', () => {
    const result = applyAdvancedTalentBonuses(
      { strength: 20, intelligence: 20, magic: 20, morality: 20, affection: 50, stress: 30, fatigue: 30 },
      { courage: 20, kindness: 20, curiosity: 20, calmness: 20 },
      ['hunter_instinct', 'hunter_instinct', 'guardian_strike', 'guardian_strike'],
      ['hunt'],
    );
    expect(result.stats.strength).toBe(22);
    expect(result.personality.courage).toBe(21);
  });

  it('repairs malformed touched values instead of propagating NaN or Infinity', () => {
    const result = applyAdvancedTalentBonuses(
      { strength:Number.NaN, intelligence:20, magic:20, morality:20, affection:50, stress:Number.POSITIVE_INFINITY, fatigue:Number.NaN },
      { courage:Number.POSITIVE_INFINITY, kindness:20, curiosity:20, calmness:20 },
      ['hunter_instinct','guardian_strike','steady_recovery','deep_rest'],
      ['hunt','rest'],
    );
    expect(result.stats.strength).toBe(2);
    expect(result.personality.courage).toBe(1);
    expect(result.stats.fatigue).toBe(0);
    expect(result.stats.stress).toBe(0);
  });

  it('stacks late talents in small bounded increments', () => {
    const result = applyAdvancedTalentBonuses(
      { strength: 99, intelligence: 99, magic: 99, morality: 99, affection: 99, stress: 2, fatigue: 2 },
      { courage: 99, kindness: 99, curiosity: 99, calmness: 99 },
      talentDefinitions.map(item => item.id),
      ['hunt', 'magic', 'rest', 'herb'],
    );
    expect(result.stats.strength).toBe(100);
    expect(result.stats.magic).toBe(100);
    expect(result.stats.intelligence).toBe(100);
    expect(result.stats.stress).toBe(0);
    expect(result.stats.fatigue).toBe(0);
    expect(result.personality.curiosity).toBe(100);
  });
});
