import { describe, expect, it } from 'vitest';
import { applyGiftIdentityEffects, applyTrainingIdentityEffects } from './raising-depth-effects';

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

describe('Runa personality growth identity', () => {
  it('leaves a different mastery trail for different personalities on the same schedule', () => {
    const brave = applyTrainingIdentityEffects({
      stats,
      personality:{ courage:60, kindness:20, curiosity:20, calmness:20 },
      mastery,
      schedule:['hunt','rest'],
      trainingScore:500,
      activeCalling:null,
      purchasedTraits:[],
    });
    const serene = applyTrainingIdentityEffects({
      stats,
      personality:{ courage:20, kindness:20, curiosity:20, calmness:60 },
      mastery,
      schedule:['hunt','rest'],
      trainingScore:500,
      activeCalling:null,
      purchasedTraits:[],
    });

    expect(brave.mastery.hunt.xp).toBe(1);
    expect(brave.mastery.rest.xp).toBe(0);
    expect(serene.mastery.hunt.xp).toBe(0);
    expect(serene.mastery.rest.xp).toBe(1);
    expect(brave.personality.courage).toBe(61);
    expect(serene.personality.calmness).toBe(61);
  });

  it('lets Calling steer curious and balanced personalities toward different specializations', () => {
    const curiousArcanist = applyTrainingIdentityEffects({
      stats,
      personality:{ courage:20, kindness:20, curiosity:60, calmness:20 },
      mastery,
      schedule:['magic','herb'],
      trainingScore:500,
      activeCalling:'arcanist',
      purchasedTraits:[],
    });
    const curiousPathfinder = applyTrainingIdentityEffects({
      stats,
      personality:{ courage:20, kindness:20, curiosity:60, calmness:20 },
      mastery,
      schedule:['magic','herb'],
      trainingScore:500,
      activeCalling:'pathfinder',
      purchasedTraits:[],
    });
    const balancedVanguard = applyTrainingIdentityEffects({
      stats,
      personality:{ courage:50, kindness:50, curiosity:50, calmness:50 },
      mastery,
      schedule:['hunt','magic'],
      trainingScore:500,
      activeCalling:'vanguard',
      purchasedTraits:[],
    });

    expect(curiousArcanist.mastery.magic.xp).toBe(1);
    expect(curiousArcanist.mastery.herb.xp).toBe(0);
    expect(curiousPathfinder.mastery.magic.xp).toBe(0);
    expect(curiousPathfinder.mastery.herb.xp).toBe(1);
    expect(balancedVanguard.mastery.hunt.xp).toBe(1);
  });

  it('repairs malformed personality and stat values touched by training identity effects', () => {
    const gentle = applyTrainingIdentityEffects({
      stats:{ ...stats, fatigue:Number.POSITIVE_INFINITY },
      personality:{ courage:20, kindness:60, curiosity:20, calmness:Number.NaN },
      mastery,
      schedule:['rest'],
      trainingScore:500,
      activeCalling:'caretaker',
      purchasedTraits:['caretaker_rest'],
    });
    expect(gentle.personality.calmness).toBe(1);
    expect(gentle.stats.fatigue).toBe(0);

    const balancedVanguard = applyTrainingIdentityEffects({
      stats:{ ...stats, strength:Number.NaN },
      personality:{ courage:Number.NaN, kindness:Number.NaN, curiosity:Number.NaN, calmness:Number.NaN },
      mastery,
      schedule:['hunt'],
      trainingScore:500,
      activeCalling:'vanguard',
      purchasedTraits:['vanguard_power'],
    });
    expect(balancedVanguard.personality.courage).toBe(1);
    expect(balancedVanguard.stats.strength).toBe(1);
  });

  it('repairs malformed affection when favorite-gift or caretaker bonuses apply', () => {
    const favorite = applyGiftIdentityEffects({
      stats:{ ...stats, affection:Number.NaN },
      personality:{ courage:50, kindness:50, curiosity:50, calmness:50 },
      item:'herb_tea',
      activeCalling:null,
      purchasedTraits:[],
    });
    expect(favorite.stats.affection).toBe(2);

    const caretaker = applyGiftIdentityEffects({
      stats:{ ...stats, affection:Number.POSITIVE_INFINITY },
      personality:{ courage:60, kindness:20, curiosity:20, calmness:20 },
      item:'star_cookie',
      activeCalling:'caretaker',
      purchasedTraits:['caretaker_rest','caretaker_bond'],
    });
    expect(caretaker.stats.affection).toBe(1);
  });

  it('does not grant the vanguard focus mastery bonus from malformed training scores', () => {
    const result = applyTrainingIdentityEffects({
      stats,
      personality:{ courage:20, kindness:60, curiosity:20, calmness:20 },
      mastery,
      schedule:['hunt'],
      trainingScore:Number.POSITIVE_INFINITY,
      activeCalling:'vanguard',
      purchasedTraits:['vanguard_power','vanguard_focus'],
    });

    expect(result.mastery.hunt.xp).toBe(0);
  });

  it('keeps the vanguard focus threshold exact at 650', () => {
    const input = {
      stats,
      personality:{ courage:20, kindness:60, curiosity:20, calmness:20 },
      mastery,
      schedule:['hunt'] as const,
      activeCalling:'vanguard' as const,
      purchasedTraits:['vanguard_power','vanguard_focus'] as const,
    };

    expect(applyTrainingIdentityEffects({ ...input, schedule:[...input.schedule], purchasedTraits:[...input.purchasedTraits], trainingScore:649.9 }).mastery.hunt.xp).toBe(0);
    expect(applyTrainingIdentityEffects({ ...input, schedule:[...input.schedule], purchasedTraits:[...input.purchasedTraits], trainingScore:650 }).mastery.hunt.xp).toBe(1);
  });
});
