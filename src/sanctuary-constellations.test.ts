import { describe, expect, it } from 'vitest';
import {
  availableConstellationNodes,
  constellationEffects,
  constellationProgress,
  constellationRecommendation,
  canUnlockConstellationNode,
} from './sanctuary-constellations';

const matureSanctuary = {
  levels:{ training_hall:3, archive_library:3, herb_garden:3, observatory:3 } as const,
  specializationCount:4,
  masterworkCount:4,
  prestige:180,
};

describe('sanctuary constellations', () => {
  it('turns mature sanctuary progress into a bounded constellation score', () => {
    expect(constellationProgress(matureSanctuary)).toBe(65);
  });

  it('reveals only nodes whose progress and prerequisites are satisfied', () => {
    expect(availableConstellationNodes(25,[]).map(node => node.id)).toEqual(['dawn_compass']);
    expect(availableConstellationNodes(45,['dawn_compass']).map(node => node.id)).toContain('scholar_star');
  });

  it('prevents unlocking nodes without prerequisites or enough progress', () => {
    expect(canUnlockConstellationNode('scholar_star',[],45).accepted).toBe(false);
    expect(canUnlockConstellationNode('scholar_star',['dawn_compass'],45).accepted).toBe(true);
  });

  it('combines unlocked effects without adding another spendable currency', () => {
    expect(constellationEffects(['dawn_compass','scholar_star'])).toEqual(expect.objectContaining({
      monthlyJourneyBonus:2,
      trainingPercent:5,
      expeditionJourneyBonus:1,
    }));
  });

  it('recommends one immediately useful next unlock to reduce menu scanning', () => {
    expect(constellationRecommendation(65,[])).toBe('dawn_compass');
    expect(constellationRecommendation(65,['dawn_compass'])).toBe('scholar_star');
  });
});
