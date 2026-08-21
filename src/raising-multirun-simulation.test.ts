import { describe, expect, it } from 'vitest';
import { advancedTalents } from './advanced-talents';
import { masteryLevel, type ActivityId, type MasteryState, type Personality } from './game-core';
import type { GuardianCallingId } from './guardian-callings';
import { applyTrainingIdentityEffects } from './raising-depth-effects';

const stats = {
  strength:30,
  intelligence:30,
  magic:30,
  morality:40,
  affection:45,
  stress:12,
  fatigue:18,
};

const schedule: ActivityId[] = ['hunt','magic','rest','herb'];

function emptyMastery(): MasteryState {
  return { hunt:{xp:0}, magic:{xp:0}, rest:{xp:0}, herb:{xp:0} };
}

function simulateIdentityMonths(personality: Personality, calling: GuardianCallingId, months: number) {
  let nextPersonality = { ...personality };
  let mastery = emptyMastery();
  for (let month = 0; month < months; month += 1) {
    const result = applyTrainingIdentityEffects({
      stats,
      personality:nextPersonality,
      mastery,
      schedule,
      trainingScore:500,
      activeCalling:calling,
      purchasedTraits:[],
    });
    nextPersonality = result.personality;
    mastery = result.mastery;
  }
  return advancedTalents({
    hunt:masteryLevel(mastery.hunt.xp),
    magic:masteryLevel(mastery.magic.xp),
    rest:masteryLevel(mastery.rest.xp),
    herb:masteryLevel(mastery.herb.xp),
  });
}

describe('raising multi-run identity simulation', () => {
  it('keeps four personality/calling paths distinct across the same repeated schedule', () => {
    const paths = [
      simulateIdentityMonths({ courage:70, kindness:20, curiosity:20, calmness:20 }, 'vanguard', 7),
      simulateIdentityMonths({ courage:20, kindness:20, curiosity:70, calmness:20 }, 'arcanist', 7),
      simulateIdentityMonths({ courage:20, kindness:20, curiosity:20, calmness:70 }, 'caretaker', 7),
      simulateIdentityMonths({ courage:20, kindness:20, curiosity:70, calmness:20 }, 'pathfinder', 7),
    ];

    expect(paths).toEqual([
      ['hunter_instinct'],
      ['arcane_rhythm'],
      ['steady_recovery'],
      ['field_scholar'],
    ]);
    expect(new Set(paths.map(path => path[0])).size).toBe(4);
  });
});
