import { describe, expect, it } from 'vitest';
import { advancedTalents } from './advanced-talents';
import { masteryLevel } from './game-core';
import { applyTrainingIdentityEffects } from './raising-depth-effects';

const stats = {
  strength:30, intelligence:30, magic:30, morality:40,
  affection:45, stress:12, fatigue:18,
};

function talentsFromMastery(mastery: { hunt:{xp:number}; magic:{xp:number}; rest:{xp:number}; herb:{xp:number} }) {
  return advancedTalents({
    hunt:masteryLevel(mastery.hunt.xp),
    magic:masteryLevel(mastery.magic.xp),
    rest:masteryLevel(mastery.rest.xp),
    herb:masteryLevel(mastery.herb.xp),
  });
}

describe('raising path diversity', () => {
  it('turns the same hunt/rest schedule into different Advanced Talent paths by personality', () => {
    const mastery = { hunt:{xp:6}, magic:{xp:0}, rest:{xp:6}, herb:{xp:0} };
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

    expect(talentsFromMastery(brave.mastery)).toContain('hunter_instinct');
    expect(talentsFromMastery(brave.mastery)).not.toContain('steady_recovery');
    expect(talentsFromMastery(serene.mastery)).toContain('steady_recovery');
    expect(talentsFromMastery(serene.mastery)).not.toContain('hunter_instinct');
  });

  it('lets Calling choice split a curious build into magic or herb Advanced Talents', () => {
    const mastery = { hunt:{xp:0}, magic:{xp:6}, rest:{xp:0}, herb:{xp:6} };
    const personality = { courage:20, kindness:20, curiosity:60, calmness:20 };
    const arcanist = applyTrainingIdentityEffects({
      stats, personality, mastery,
      schedule:['magic','herb'], trainingScore:500,
      activeCalling:'arcanist', purchasedTraits:[],
    });
    const pathfinder = applyTrainingIdentityEffects({
      stats, personality, mastery,
      schedule:['magic','herb'], trainingScore:500,
      activeCalling:'pathfinder', purchasedTraits:[],
    });

    expect(talentsFromMastery(arcanist.mastery)).toContain('arcane_rhythm');
    expect(talentsFromMastery(arcanist.mastery)).not.toContain('field_scholar');
    expect(talentsFromMastery(pathfinder.mastery)).toContain('field_scholar');
    expect(talentsFromMastery(pathfinder.mastery)).not.toContain('arcane_rhythm');
  });
});
