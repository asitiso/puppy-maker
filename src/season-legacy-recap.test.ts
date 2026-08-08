import { describe, expect, it } from 'vitest';
import { initialState, reducer } from './game';
import { seasonLegacyRecap } from './season-legacy-recap';

describe('season legacy recap', () => {
  it('summarizes lifetime legacy progress and the next passive milestone', () => {
    const state = {
      ...initialState,
      seasonJourneyHistory:[{ key:'1-spring' as const, score:1300, tiersCompleted:10, tokensEarned:120 }],
      claimedSeasonCompletionHonors:['first_complete' as const],
      unlockedSeasonLegacyNodes:['chronicle_seed' as const],
    };
    const recap = seasonLegacyRecap(state);
    expect(recap.earnedPoints).toBe(2);
    expect(recap.spentPoints).toBe(1);
    expect(recap.availablePoints).toBe(1);
    expect(recap.unlockedCount).toBe(1);
    expect(recap.nextAffordable?.id).toBe('bond_seed');
    expect(recap.activeBonuses.monthlyJourneyBonus).toBe(3);
  });

  it('automatically unlocks affordable seed milestones at month rollover without extra taps', () => {
    const key = '1-spring' as const;
    const ready = {
      ...initialState,
      screen:'result' as const,
      month:3,
      seasonJourneyHistory:[{ key, score:1300, tiersCompleted:10, tokensEarned:120 }],
      claimedSeasonCompletionHonors:['first_complete' as const],
      unlockedSeasonLegacyNodes:[],
    };
    const next = reducer(ready,{ type:'NEXT_MONTH' });
    expect(next.unlockedSeasonLegacyNodes.length).toBeGreaterThan(0);
  });
});
