import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game';

const complete = (key:'1-spring'|'1-summer'|'1-autumn'|'1-winter') => ({ key, score:1300, tiersCompleted:10, tokensEarned:120 });

describe('season legacy reducer progression', () => {
  it('hydrates only valid unlocked legacy nodes', () => {
    const hydrated = hydrateGameState({
      ...initialState,
      unlockedSeasonLegacyNodes:['chronicle_seed','bad','chronicle_seed','expedition_crown'],
    });
    expect(hydrated.unlockedSeasonLegacyNodes).toEqual(['chronicle_seed','expedition_crown']);
  });

  it('unlocks an affordable root node and grants its reward once', () => {
    const ready = {
      ...initialState,
      seasonJourneyHistory:[complete('1-spring')],
      claimedSeasonCompletionHonors:['first_complete'] as ('first_complete')[],
    };
    const next = reducer(ready,{ type:'UNLOCK_SEASON_LEGACY_NODE', nodeId:'chronicle_seed' });
    expect(next.unlockedSeasonLegacyNodes).toEqual(['chronicle_seed']);
    expect(next.gold).toBe(ready.gold + 150);
    const duplicate = reducer(next,{ type:'UNLOCK_SEASON_LEGACY_NODE', nodeId:'chronicle_seed' });
    expect(duplicate).toBe(next);
  });

  it('rejects a deeper node without its prerequisite', () => {
    const ready = {
      ...initialState,
      seasonJourneyHistory:[complete('1-spring'),complete('1-summer')],
      claimedSeasonCompletionHonors:['first_complete','four_seasons'] as ('first_complete'|'four_seasons')[],
    };
    const next = reducer(ready,{ type:'UNLOCK_SEASON_LEGACY_NODE', nodeId:'chronicle_keeper' });
    expect(next).toBe(ready);
  });
});
