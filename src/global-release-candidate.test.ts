import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer, type GameState } from './game';
import { hydrateSavedGame, parseSavedGame, serializeSavedGame } from './save-schema';

const roundTrip = (state:GameState) => parseSavedGame(serializeSavedGame(state));

function completeCoreMonth(state:GameState):GameState {
  let next = reducer(state,{ type:'GO', screen:'schedule' });
  next = reducer(next,{ type:'GO', screen:'training' });
  next = reducer(next,{ type:'TRAIN', kind:'attack', accuracy:0.8 });
  next = reducer(next,{ type:'FINISH_TRAINING', eventRoll:0.999 });
  next = reducer(next,{ type:'CHOOSE', choice:'hug' });
  return reducer(next,{ type:'NEXT_MONTH' });
}

describe('global release candidate save and regression matrix', () => {
  it('sanitizes non-finite wrapper counters instead of propagating NaN or Infinity', () => {
    for (const monthsCompleted of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const hydrated = hydrateGameState({ ...initialState, monthsCompleted });
      expect(Number.isFinite(hydrated.monthsCompleted ?? 0)).toBe(true);
      expect(hydrated.monthsCompleted ?? 0).toBe(0);
    }
  });

  it('best-effort hydrates a partially corrupt legacy state while dropping stale ids', () => {
    const hydrated = hydrateSavedGame({ schemaVersion:1, state:{
      ...initialState,
      screen:'stale-screen',
      condition:'stale-condition',
      gold:Number.POSITIVE_INFINITY,
      gems:Number.NaN,
      claimedAchievements:['first_steps','stale-achievement'],
      discoveries:['stale-discovery'],
      rewardedMonthlyMissions:['training_once','stale-mission'],
      seasonStamps:['spring','stale-season'],
      selectedTacticalCompanions:['bear','stale-companion'],
      claimedTacticalFirstClears:['training_ground','stale-encounter'],
      tacticalBattleRecords:{
        training_ground:{ grade:'S',bestRounds:4,clearCount:1 },
        stale_encounter:{ grade:'S',bestRounds:1,clearCount:99 },
      },
    }});
    expect(hydrated.screen).toBe(initialState.screen);
    expect(hydrated.condition).toBe(initialState.condition);
    expect(hydrated.gold).toBe(initialState.gold);
    expect(hydrated.gems).toBe(initialState.gems);
    expect(hydrated.claimedAchievements).toEqual(['first_steps']);
    expect(hydrated.discoveries).toEqual([]);
    expect(hydrated.rewardedMonthlyMissions).toEqual(['training_once']);
    expect(hydrated.seasonStamps).toEqual(['spring']);
    expect(hydrated.selectedTacticalCompanions).toEqual(['bear']);
    expect(hydrated.claimedTacticalFirstClears).toEqual(['training_ground']);
    expect(Object.keys(hydrated.tacticalBattleRecords)).toEqual(['training_ground']);
  });

  it('round-trips cross-feature persistent state repeatedly without value drift', () => {
    let state = reducer(initialState,{ type:'SET_TACTICAL_PARTY', companions:['bear','owl'] });
    state = reducer(state,{ type:'COMPLETE_TACTICAL_BATTLE', encounterId:'training_ground', result:'victory', rounds:4, survivingAllies:3, damageTaken:40, companions:['bear','owl'] });
    state = { ...state, seasonStamps:['spring'], monthlyCounters:{ trainings:1,outings:2,gifts:1 } };
    const snapshot = {
      gold:state.gold,
      gems:state.gems,
      firstClears:[...state.claimedTacticalFirstClears],
      records:JSON.stringify(state.tacticalBattleRecords),
      bonds:JSON.stringify(state.tacticalCompanionBonds),
      stamps:[...state.seasonStamps],
    };
    for (let index=0; index<25; index+=1) state = roundTrip(state);
    expect(state.gold).toBe(snapshot.gold);
    expect(state.gems).toBe(snapshot.gems);
    expect(state.claimedTacticalFirstClears).toEqual(snapshot.firstClears);
    expect(JSON.stringify(state.tacticalBattleRecords)).toBe(snapshot.records);
    expect(JSON.stringify(state.tacticalCompanionBonds)).toBe(snapshot.bonds);
    expect(state.seasonStamps).toEqual(snapshot.stamps);
  });

  it('does not regrant a tactical first-clear reward after reload and re-entry', () => {
    const ready = reducer(initialState,{ type:'SET_TACTICAL_PARTY', companions:['bear','owl'] });
    const first = reducer(ready,{ type:'COMPLETE_TACTICAL_BATTLE', encounterId:'training_ground', result:'victory', rounds:4, survivingAllies:3, damageTaken:40, companions:['bear','owl'] });
    const firstGoldReward = first.gold - ready.gold;
    const loaded = roundTrip(first);
    const second = reducer(loaded,{ type:'COMPLETE_TACTICAL_BATTLE', encounterId:'training_ground', result:'victory', rounds:4, survivingAllies:3, damageTaken:40, companions:['bear','owl'] });
    expect(second.claimedTacticalFirstClears.filter(id=>id==='training_ground')).toHaveLength(1);
    expect(second.gold - loaded.gold).toBeLessThan(firstGoldReward);
  });

  it('resets monthly progression without clearing tactical permanent state', () => {
    let state = reducer(initialState,{ type:'SET_TACTICAL_PARTY', companions:['bear','owl'] });
    state = reducer(state,{ type:'COMPLETE_TACTICAL_BATTLE', encounterId:'training_ground', result:'victory', rounds:4, survivingAllies:3, damageTaken:40, companions:['bear','owl'] });
    const beforeBonds = JSON.stringify(state.tacticalCompanionBonds);
    const beforeRecords = JSON.stringify(state.tacticalBattleRecords);
    state = {
      ...state,
      screen:'result',
      monthlyCounters:{ trainings:1,outings:2,gifts:1 },
      rewardedMonthlyMissions:['training_once','outing_twice','gift_once'],
      monthlyFocus:'training',
    };
    const next = reducer(state,{ type:'NEXT_MONTH' });
    expect(next.monthlyCounters).toEqual({ trainings:0,outings:0,gifts:0 });
    expect(next.rewardedMonthlyMissions).toEqual([]);
    expect(next.monthlyFocus).toBe('balanced');
    expect(next.claimedTacticalFirstClears).toEqual(['training_ground']);
    expect(JSON.stringify(next.tacticalCompanionBonds)).toBe(beforeBonds);
    expect(JSON.stringify(next.tacticalBattleRecords)).toBe(beforeRecords);
  });

  it('crosses year and season boundaries without clearing permanent progression', () => {
    let state = reducer(initialState,{ type:'SET_TACTICAL_PARTY', companions:['bear','owl'] });
    state = reducer(state,{ type:'COMPLETE_TACTICAL_BATTLE', encounterId:'training_ground', result:'victory', rounds:4, survivingAllies:3, damageTaken:40, companions:['bear','owl'] });
    state = { ...state, year:1, month:12, week:4, screen:'result', seasonStamps:['spring','summer','autumn'] };
    const next = reducer(state,{ type:'NEXT_MONTH' });
    expect(next.year).toBe(2);
    expect(next.month).toBe(1);
    expect(next.week).toBe(1);
    expect(next.screen).toBe('hub');
    expect(next.seasonStamps).toEqual(['spring','summer','autumn']);
    expect(next.claimedTacticalFirstClears).toEqual(['training_ground']);
    expect(next.annualRecords.some(record=>record.year===1)).toBe(true);
  });

  it('keeps claimed achievement rewards idempotent across save reloads', () => {
    const trained = reducer(initialState,{ type:'FINISH_TRAINING', eventRoll:0.999 });
    const first = reducer(trained,{ type:'CLAIM_ACHIEVEMENT', achievement:'first_steps' });
    const loaded = roundTrip(first);
    const repeat = reducer(loaded,{ type:'CLAIM_ACHIEVEMENT', achievement:'first_steps' });
    expect(repeat.gold).toBe(loaded.gold);
    expect(repeat.gems).toBe(loaded.gems);
    expect(repeat.claimedAchievements.filter(id=>id==='first_steps')).toHaveLength(1);
  });

  it('repeats the full hub core loop ten times without stale screen state', () => {
    let state = initialState;
    for (let cycle=0; cycle<10; cycle+=1) {
      state = completeCoreMonth(state);
      expect(state.screen).toBe('hub');
      expect(state.week).toBe(1);
      expect(Number.isFinite(state.gold)).toBe(true);
      expect(Number.isFinite(state.gems)).toBe(true);
      const schedule = reducer(state,{ type:'GO', screen:'schedule' });
      expect(schedule.screen).toBe('schedule');
      state = { ...schedule, screen:'hub' };
    }
  });

  it('survives one hundred month/save cycles without numeric corruption or duplicate ids', () => {
    let state = initialState;
    for (let cycle=0; cycle<100; cycle+=1) {
      state = reducer({ ...state, screen:'result' },{ type:'NEXT_MONTH' });
      state = roundTrip(state);
      expect(Number.isFinite(state.year)).toBe(true);
      expect(Number.isFinite(state.month)).toBe(true);
      expect(Number.isFinite(state.week)).toBe(true);
      expect(Number.isFinite(state.gold)).toBe(true);
      expect(Number.isFinite(state.gems)).toBe(true);
      expect(new Set(state.memories).size).toBe(state.memories.length);
      expect(new Set(state.claimedAchievements).size).toBe(state.claimedAchievements.length);
      expect(new Set(state.claimedTacticalFirstClears).size).toBe(state.claimedTacticalFirstClears.length);
    }
  });
});
