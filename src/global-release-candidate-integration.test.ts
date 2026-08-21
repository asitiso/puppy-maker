import { describe, expect, it } from 'vitest';
import { initialState, reducer, type GameState } from './game';
import { parseSavedGame, serializeSavedGame } from './save-schema';
import { seasonJourneyKey } from './season-journey';

const roundTrip = (state:GameState) => parseSavedGame(serializeSavedGame(state));

function finishCoreMonthToResult(state:GameState):GameState {
  let next = reducer(state,{ type:'GO', screen:'schedule' });
  next = reducer(next,{ type:'GO', screen:'training' });
  next = reducer(next,{ type:'TRAIN', kind:'attack', accuracy:0.8 });
  next = reducer(next,{ type:'FINISH_TRAINING', eventRoll:0.999 });
  return reducer(next,{ type:'CHOOSE', choice:'hug' });
}

describe('global release candidate cross-feature integration', () => {
  it('awards month-completion Season Journey points only once through the normal core loop', () => {
    const key = seasonJourneyKey(initialState.year,initialState.month);
    const result = finishCoreMonthToResult(initialState);
    const scoreAtResult = result.seasonJourneyScores[key] ?? 0;
    expect(scoreAtResult).toBeGreaterThan(0);
    const nextMonth = reducer(result,{ type:'NEXT_MONTH' });
    expect(nextMonth.seasonJourneyScores[key]).toBe(scoreAtResult);
  });

  it('keeps permanent World reward ledgers unique across repeated clears and reload', () => {
    const first = reducer(initialState,{ type:'FINISH_EXPEDITION_STAGE', stageId:'forest_path', score:900 });
    const loaded = roundTrip(first);
    const second = reducer(loaded,{ type:'FINISH_EXPEDITION_STAGE', stageId:'forest_path', score:900 });
    expect(new Set(second.rewardedRenownLevels).size).toBe(second.rewardedRenownLevels.length);
    expect(new Set(second.claimedExpeditionSeasonTiers).size).toBe(second.claimedExpeditionSeasonTiers.length);
    expect(new Set(second.rewardedWorldContracts).size).toBe(second.rewardedWorldContracts.length);
    expect(new Set(second.claimedSeasonJourneyTiers).size).toBe(second.claimedSeasonJourneyTiers.length);
    expect(second.expeditionRecords.forest_path.clearCount).toBe(2);
  });

  it('survives Raising to World to Season to Tactical progression and a save round-trip', () => {
    let state:GameState = {
      ...initialState,
      activeCalling:'pathfinder',
      purchasedTraits:['pathfinder_herb','pathfinder_eye','pathfinder_supply'],
    };
    state = reducer(state,{ type:'GO_OUTING', location:'forest', eventRoll:0.5 });
    state = reducer(state,{ type:'FINISH_EXPEDITION_STAGE', stageId:'forest_path', score:900, actionKinds:{ attack:0,dodge:0,charge:2 } });
    const key = seasonJourneyKey(state.year,state.month);
    expect(state.seasonJourneyScores[key]).toBeGreaterThan(0);
    expect(state.lastWorldProgress).not.toBeNull();
    state = reducer(state,{ type:'SET_TACTICAL_PARTY', companions:['bear','owl'] });
    state = reducer(state,{ type:'COMPLETE_TACTICAL_BATTLE', encounterId:'training_ground', result:'victory', rounds:4, survivingAllies:3, damageTaken:40, companions:['bear','owl'] });
    const loaded = roundTrip(state);
    expect(loaded.activeCalling).toBe('pathfinder');
    expect(loaded.purchasedTraits).toEqual(state.purchasedTraits);
    expect(loaded.expeditionRecords.forest_path.cleared).toBe(true);
    expect(loaded.seasonJourneyScores[key]).toBe(state.seasonJourneyScores[key]);
    expect(loaded.claimedTacticalFirstClears).toEqual(['training_ground']);
    expect(loaded.selectedTacticalCompanions).toEqual(['bear','owl']);
  });

  it('clears transient World/live-ops feedback on reload while preserving permanent progress', () => {
    const finished = reducer(initialState,{ type:'FINISH_EXPEDITION_STAGE', stageId:'forest_path', score:900 });
    expect(finished.lastExpeditionResult).not.toBeNull();
    expect(finished.lastWorldProgress).not.toBeNull();
    expect(finished.lastLiveOpsProgress).not.toBeNull();
    const loaded = roundTrip(finished);
    expect(loaded.lastWorldProgress).toBeNull();
    expect(loaded.lastLiveOpsProgress).toBeNull();
    expect(loaded.expeditionRecords.forest_path.cleared).toBe(true);
  });

  it('keeps tactical rewards and records finite when completion telemetry is malformed', () => {
    const ready = reducer(initialState,{ type:'SET_TACTICAL_PARTY', companions:['bear','owl'] });
    const next = reducer(ready,{
      type:'COMPLETE_TACTICAL_BATTLE',
      encounterId:'training_ground',
      result:'victory',
      rounds:Number.NaN,
      survivingAllies:Number.POSITIVE_INFINITY,
      damageTaken:Number.NEGATIVE_INFINITY,
      companions:['bear','owl'],
    });
    expect(Number.isFinite(next.gold)).toBe(true);
    expect(Number.isFinite(next.gems)).toBe(true);
    expect(Number.isFinite(next.tacticalBattleRecords.training_ground?.bestRounds ?? 0)).toBe(true);
    expect(Number.isFinite(next.tacticalBattleRecords.training_ground?.clearCount ?? 0)).toBe(true);
  });
});
