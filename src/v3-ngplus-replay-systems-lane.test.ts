import {describe,expect,it} from 'vitest';
import {commitLongNightOutcome,commitWinterEnding,resolveLongNightOutcome,resolveModularEnding} from './campaign-winter-season';
import {hydrateGameState,initialState,reducer,type GameState} from './game';

function completedWinterGameState():GameState{
  const longNight=resolveLongNightOutcome({campaign:'caretaker',outcome:'victory'});
  expect(longNight.accepted).toBe(true);
  if(!longNight.accepted)throw new Error('expected Long Night outcome');
  const outcome=commitLongNightOutcome({
    ...initialState.campaignRun,
    phase:'winter',
    activeCampaign:'caretaker',
    seasonMilestones:['autumn_resolved'],
  },longNight);
  expect(outcome.committed).toBe(true);
  if(!outcome.committed)throw new Error('expected Long Night commit');

  const ending=resolveModularEnding({
    campaignResolution:'shared_guardianship',
    bondResolution:'mira_shared_future',
    worldResolution:'survived_together',
    careerResolution:'guardian_mentor',
  });
  expect(ending.accepted).toBe(true);
  if(!ending.accepted)throw new Error('expected modular ending');

  const committed=commitWinterEnding({...initialState,campaignRun:outcome.state},ending.ending,{
    majorWorldOutcomes:['festival_saved'],
    keyBondMemories:[{characterId:'mira',memoryId:'mira_winter_victory'}],
    trueClues:['caretaker_life_anomaly'],
  });
  expect(committed.committed).toBe(true);
  if(!committed.committed)throw new Error('expected Winter ending commit');
  return committed.state as GameState;
}

describe('V3 NG+ Macro B authoritative replay transition',()=>{
  it('makes NEW_RUN consume the committed ending exactly once without re-archiving it',()=>{
    const completed=completedWinterGameState();
    const next=reducer(completed,{type:'NEW_RUN'});

    expect(next.campaignRun).toMatchObject({
      runNumber:2,
      phase:'spring_exploration',
      activeCampaign:null,
      activeRoute:'normal',
      seasonMilestones:[],
      majorChoices:{},
      majorOutcomes:{},
      failForwardOutcomes:[],
      claimedCampaignRewards:[],
      claimedSeasonalObjectives:[],
    });
    expect(next.legacy.completedRuns).toBe(1);
    expect(next.legacy.runSummaries).toHaveLength(1);
    expect(next.worldHistory.currentFacts).toEqual([]);
    expect(next.worldHistory.inheritedFacts).toEqual(['festival_saved']);
    expect(next.legacy.relationshipEchoes).toEqual({mira:['mira_winter_victory']});
    expect(next.legacy.trueClues).toEqual(['caretaker_life_anomaly']);

    const replayed=reducer(next,{type:'NEW_RUN'});
    expect(replayed).toEqual(next);
    expect(replayed.campaignRun.runNumber).toBe(2);
    expect(replayed.legacy.completedRuns).toBe(1);
    expect(replayed.legacy.runSummaries).toHaveLength(1);
  });

  it('resets raw growth, currencies, Season/weekly and Tactical run state for clean Spring replay',()=>{
    const completed=completedWinterGameState();
    const dirty:GameState={
      ...completed,
      gold:999999,
      gems:99999,
      stats:{...completed.stats,strength:100,intelligence:100,magic:100},
      mastery:{hunt:{xp:999},magic:{xp:999},rest:{xp:999},herb:{xp:999}},
      weeklyDirectiveKey:'1-4-2',
      weeklyDirectiveProgress:{steady_training:99,field_patrol:99},
      rewardedWeeklyDirectives:['1-4-2:steady_training'],
      seasonJourneyScores:{'1-spring':999},
      claimedSeasonJourneyTiers:['1-spring:1'],
      seasonTokenBalances:{'1-spring':999},
      tacticalBattleRecords:{training_ground:{grade:'S',bestRounds:2,clearCount:9}},
      claimedTacticalFirstClears:['training_ground'],
      selectedTacticalCompanions:['wolf','cat'],
      tacticalCompanionBonds:{
        bear:{xp:120,level:3},owl:{xp:80,level:2},wolf:{xp:300,level:4},cat:{xp:220,level:4},
      },
      tacticalAutoBattle:true,
      tacticalBattleSpeed:2,
    };
    const next=reducer(dirty,{type:'NEW_RUN'});

    expect(next.gold).toBe(initialState.gold);
    expect(next.gems).toBe(initialState.gems);
    expect(next.stats).toEqual(initialState.stats);
    expect(next.mastery).toEqual(initialState.mastery);
    expect(next.weeklyDirectiveKey).toBeNull();
    expect(next.weeklyDirectiveProgress).toEqual({});
    expect(next.rewardedWeeklyDirectives).toEqual([]);
    expect(next.seasonJourneyScores).toEqual({});
    expect(next.claimedSeasonJourneyTiers).toEqual([]);
    expect(next.seasonTokenBalances).toEqual({});
    expect(next.tacticalBattleRecords).toEqual({});
    expect(next.claimedTacticalFirstClears).toEqual([]);
    expect(next.selectedTacticalCompanions).toEqual([]);
    expect(next.tacticalCompanionBonds).toEqual(initialState.tacticalCompanionBonds);
    expect(next.tacticalAutoBattle).toBe(true);
    expect(next.tacticalBattleSpeed).toBe(2);
  });

  it('stays save/load/reload idempotent after the authoritative start',()=>{
    const completed=completedWinterGameState();
    const next=reducer(completed,{type:'NEW_RUN'});
    const loaded=hydrateGameState(JSON.parse(JSON.stringify(next)));
    const reloaded=hydrateGameState(JSON.parse(JSON.stringify(loaded)));

    expect(reloaded).toEqual(loaded);
    expect(reloaded.campaignRun.runNumber).toBe(2);
    expect(reloaded.legacy.completedRuns).toBe(1);
    expect(reloaded.legacy.runSummaries).toHaveLength(1);
    expect(reducer(reloaded,{type:'NEW_RUN'})).toEqual(reloaded);
  });
});
