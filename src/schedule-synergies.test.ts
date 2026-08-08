import { describe, expect, it } from 'vitest';
import { applyScheduleSynergyBonuses, scheduleSynergies } from './schedule-synergies';

describe('schedule synergy rules', () => {
  it('recognizes meaningful four-slot plan combinations', () => {
    expect(scheduleSynergies(['hunt', 'magic', 'rest', 'herb'])).toEqual(['balanced_guardian', 'recovery_rhythm']);
    expect(scheduleSynergies(['hunt', 'hunt', 'rest', 'herb'])).toEqual(['hunt_focus', 'recovery_rhythm']);
    expect(scheduleSynergies(['magic', 'magic', 'hunt', 'rest'])).toEqual(['magic_focus']);
    expect(scheduleSynergies(['herb', 'herb', 'rest', 'hunt'])).toEqual(['herb_focus', 'recovery_rhythm']);
  });

  it('applies small additive bonuses without replacing core training effects', () => {
    const result = applyScheduleSynergyBonuses(
      { strength: 20, intelligence: 20, magic: 20, morality: 20, affection: 50, stress: 30, fatigue: 30 },
      { courage: 20, kindness: 20, curiosity: 20, calmness: 20 },
      ['hunt_focus', 'recovery_rhythm'],
    );
    expect(result.stats.strength).toBe(23);
    expect(result.stats.stress).toBe(25);
    expect(result.stats.fatigue).toBe(25);
    expect(result.personality.courage).toBe(22);
  });

  it('clamps stat and personality bonuses to normal game bounds', () => {
    const result = applyScheduleSynergyBonuses(
      { strength: 99, intelligence: 99, magic: 99, morality: 99, affection: 99, stress: 2, fatigue: 2 },
      { courage: 99, kindness: 99, curiosity: 99, calmness: 99 },
      ['hunt_focus', 'magic_focus', 'herb_focus', 'recovery_rhythm'],
    );
    expect(result.stats.strength).toBe(100);
    expect(result.stats.magic).toBe(100);
    expect(result.stats.stress).toBe(0);
    expect(result.personality.courage).toBe(100);
    expect(result.personality.curiosity).toBe(100);
  });
});
