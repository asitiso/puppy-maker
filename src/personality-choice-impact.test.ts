import { describe, expect, it } from 'vitest';
import { applyTrainingIdentityEffects } from './raising-depth-effects';

const stats = {
  strength: 30,
  intelligence: 30,
  magic: 30,
  morality: 40,
  affection: 45,
  stress: 12,
  fatigue: 18,
};

const mastery = {
  hunt: { xp: 0 },
  magic: { xp: 0 },
  rest: { xp: 0 },
  herb: { xp: 0 },
};

describe('personality choice impact', () => {
  it('leaves one preferred-activity growth trace for each actual schedule choice', () => {
    const result = applyTrainingIdentityEffects({
      stats,
      personality: { courage: 60, kindness: 20, curiosity: 20, calmness: 20 },
      mastery,
      schedule: ['hunt', 'hunt', 'hunt'],
      trainingScore: 500,
      activeCalling: null,
      purchasedTraits: [],
    });

    expect(result.mastery.hunt.xp).toBe(3);
    expect(result.personality.courage).toBe(63);
  });
});
