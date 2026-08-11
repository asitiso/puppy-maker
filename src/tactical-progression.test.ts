import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game';

describe('tactical battle progression', () => {
  it('hydrates only valid tactical records and first-clear keys', () => {
    const hydrated = hydrateGameState({
      ...initialState,
      tacticalBattleRecords:{
        training_ground:{ grade:'A', bestRounds:5, clearCount:2 },
        bad:{ grade:'S', bestRounds:1, clearCount:99 },
        rift_vanguard:{ grade:'X', bestRounds:-2, clearCount:0 },
      },
      claimedTacticalFirstClears:['training_ground','bad','training_ground'],
    });
    expect(hydrated.tacticalBattleRecords).toEqual({ training_ground:{ grade:'A', bestRounds:5, clearCount:2 } });
    expect(hydrated.claimedTacticalFirstClears).toEqual(['training_ground']);
  });

  it('grants a first-clear reward and stores the first best record', () => {
    const next = reducer(initialState,{
      type:'COMPLETE_TACTICAL_BATTLE', encounterId:'training_ground', result:'victory', rounds:4, survivingAllies:3, damageTaken:90,
    });
    expect(next.tacticalBattleRecords.training_ground).toEqual({ grade:'A', bestRounds:4, clearCount:1 });
    expect(next.claimedTacticalFirstClears).toEqual(['training_ground']);
    expect(next.gold).toBeGreaterThan(initialState.gold);
    expect(next.gems).toBeGreaterThanOrEqual(initialState.gems + 1);
  });

  it('uses replay rewards without duplicating the first-clear key', () => {
    const first = reducer(initialState,{
      type:'COMPLETE_TACTICAL_BATTLE', encounterId:'training_ground', result:'victory', rounds:5, survivingAllies:2, damageTaken:120,
    });
    const second = reducer(first,{
      type:'COMPLETE_TACTICAL_BATTLE', encounterId:'training_ground', result:'victory', rounds:3, survivingAllies:3, damageTaken:60,
    });
    expect(second.claimedTacticalFirstClears).toEqual(['training_ground']);
    expect(second.tacticalBattleRecords.training_ground).toEqual({ grade:'S', bestRounds:3, clearCount:2 });
    expect(second.gold).toBeGreaterThan(first.gold);
    expect(second.gems).toBe(first.gems);
  });

  it('does not claim a first clear on defeat', () => {
    const next = reducer(initialState,{
      type:'COMPLETE_TACTICAL_BATTLE', encounterId:'training_ground', result:'defeat', rounds:4, survivingAllies:0, damageTaken:300,
    });
    expect(next).toBe(initialState);
  });
});
