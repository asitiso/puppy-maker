import { describe, expect, it } from 'vitest';
import { initialState, reducer, type GameState } from './game';
import { parseSavedGame, serializeSavedGame } from './save-schema';
import { seasonJourneyKey } from './season-journey';

const roundTrip = (state:GameState) => parseSavedGame(serializeSavedGame(state));

function expectUnique(values:string[]) {
  expect(new Set(values).size).toBe(values.length);
}

describe('global release candidate long-run and transition matrix', () => {
  it('archives a completed season exactly once and isolates the next season weekly state', () => {
    const springKey = seasonJourneyKey(1,5);
    const state:GameState = {
      ...initialState,
      year:1,
      month:5,
      week:4,
      screen:'result',
      seasonJourneyScores:{ ...initialState.seasonJourneyScores, [springKey]:120 },
      weeklyDirectiveKey:'1-5-4',
      weeklyDirectiveProgress:{ training_pair:2 },
      rewardedWeeklyDirectives:['1-5-4:training_pair'],
    };
    const summer = reducer(state,{ type:'NEXT_MONTH' });
    expect(summer.month).toBe(6);
    expect(seasonJourneyKey(summer.year,summer.month)).not.toBe(springKey);
    const archives = summer.seasonJourneyHistory.filter(entry=>entry.key===springKey);
    expect(archives).toHaveLength(1);
    expect(archives[0].score).toBe(summer.seasonJourneyScores[springKey]);
    expect(summer.weeklyDirectiveKey).toBeNull();
    expect(summer.weeklyDirectiveProgress).toEqual({});
    expect(summer.rewardedWeeklyDirectives).toContain('1-5-4:training_pair');
  });

  it('keeps season archive idempotent when old archived progress is reloaded later', () => {
    const springKey = seasonJourneyKey(1,5);
    let state:GameState = {
      ...initialState,
      year:1,
      month:5,
      week:4,
      screen:'result',
      seasonJourneyScores:{ ...initialState.seasonJourneyScores, [springKey]:300 },
    };
    state = reducer(state,{ type:'NEXT_MONTH' });
    state = roundTrip(state);
    const archiveCount = state.seasonJourneyHistory.filter(entry=>entry.key===springKey).length;
    state = reducer({ ...state, month:5, screen:'result' },{ type:'NEXT_MONTH' });
    expect(state.seasonJourneyHistory.filter(entry=>entry.key===springKey)).toHaveLength(archiveCount);
  });

  it('survives fifty mixed Raising/World/Tactical/month/save cycles without reward-ledger inflation or numeric corruption', () => {
    let state:GameState = {
      ...initialState,
      activeCalling:'pathfinder',
      purchasedTraits:['pathfinder_herb','pathfinder_eye','pathfinder_supply'],
    };
    for (let cycle=0; cycle<50; cycle+=1) {
      state = reducer(state,{ type:'GO_OUTING', location:'forest', eventRoll:0.5 });
      state = reducer(state,{ type:'FINISH_EXPEDITION_STAGE', stageId:'forest_path', score:900, actionKinds:{ attack:0,dodge:0,charge:2 } });
      state = reducer(state,{ type:'SET_TACTICAL_PARTY', companions:['bear','owl'] });
      state = reducer(state,{ type:'COMPLETE_TACTICAL_BATTLE', encounterId:'training_ground', result:'victory', rounds:4, survivingAllies:3, damageTaken:40, companions:['bear','owl'] });
      state = reducer({ ...state, screen:'result' },{ type:'NEXT_MONTH' });
      state = roundTrip(state);

      expect(state.screen).toBe('hub');
      expect(Number.isFinite(state.gold)).toBe(true);
      expect(Number.isFinite(state.gems)).toBe(true);
      expect(Number.isFinite(state.year)).toBe(true);
      expect(Number.isFinite(state.month)).toBe(true);
      expect(state.claimedTacticalFirstClears.filter(id=>id==='training_ground')).toHaveLength(1);
      expectUnique(state.rewardedRenownLevels);
      expectUnique(state.claimedExpeditionSeasonTiers);
      expectUnique(state.rewardedWorldContracts);
      expectUnique(state.claimedSeasonJourneyTiers);
      expectUnique(state.rewardedWeeklyDirectives);
      expectUnique(state.claimedTacticalFirstClears);
    }
  });
});
