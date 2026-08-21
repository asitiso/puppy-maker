import { describe, expect, it } from 'vitest';
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

const mastery = {
  hunt:{ xp:0 },
  magic:{ xp:0 },
  rest:{ xp:0 },
  herb:{ xp:0 },
};

describe('personality choice impact', () => {
  it('leaves one preferred-activity growth trace for each actual schedule choice', () => {
    const result = applyTrainingIdentityEffects({
      stats,
      personality:{ courage:60, kindness:20, curiosity:20, calmness:20 },
      mastery,
      schedule:['hunt','hunt','hunt'],
      trainingScore:500,
      activeCalling:null,
      purchasedTraits:[],
    });

    expect(result.mastery.hunt.xp).toBe(3);
    expect(result.personality.courage).toBe(63);
  });

  it('sanitizes malformed identity values before applying preferred growth', () => {
    const result = applyTrainingIdentityEffects({
      stats:{ ...stats, strength:Number.NaN, fatigue:Number.POSITIVE_INFINITY },
      personality:{ courage:Number.POSITIVE_INFINITY, kindness:20, curiosity:20, calmness:20 },
      mastery:{ ...mastery, hunt:{ xp:Number.NaN } },
      schedule:['hunt'],
      trainingScore:Number.POSITIVE_INFINITY,
      activeCalling:'vanguard',
      purchasedTraits:['vanguard_power','vanguard_focus'],
    });

    expect(Object.values(result.stats).every(Number.isFinite)).toBe(true);
    expect(Object.values(result.personality).every(Number.isFinite)).toBe(true);
    expect(Object.values(result.mastery).every(entry => Number.isFinite(entry.xp))).toBe(true);
  });

  it('restores a complete mastery shape when a direct caller supplies a damaged partial object', () => {
    const result = applyTrainingIdentityEffects({
      stats,
      personality:{ courage:20, kindness:20, curiosity:60, calmness:20 },
      mastery:{ magic:{ xp:2 } } as typeof mastery,
      schedule:['magic'],
      trainingScore:500,
      activeCalling:null,
      purchasedTraits:[],
    });

    expect(result.mastery).toEqual({
      hunt:{ xp:0 },
      magic:{ xp:3 },
      rest:{ xp:0 },
      herb:{ xp:0 },
    });
  });
});
