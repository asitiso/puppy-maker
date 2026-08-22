import {describe,expect,it} from 'vitest';
import {commitLongNightOutcome,commitWinterEnding,resolveLongNightOutcome,resolveModularEnding} from './campaign-winter-season';
import {hydrateGameState,initialState,reducer,type GameState} from './game';

function completeCaretakerWinter(state:GameState):GameState{
  const longNight=resolveLongNightOutcome({campaign:'caretaker',outcome:'victory'});
  expect(longNight.accepted).toBe(true);
  if(!longNight.accepted)throw new Error('expected Long Night outcome');
  const outcome=commitLongNightOutcome({
    ...state.campaignRun,
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

  const committed=commitWinterEnding({...state,campaignRun:outcome.state},ending.ending,{
    majorWorldOutcomes:['festival_saved'],
    keyBondMemories:[{characterId:'mira',memoryId:'mira_winter_victory'}],
    trueClues:['caretaker_life_anomaly'],
  });
  expect(committed.committed).toBe(true);
  if(!committed.committed)throw new Error('expected Winter ending commit');
  return committed.state as GameState;
}

describe('V3 NG+ Macro B repeated replay stability',()=>{
  it('survives three complete ending -> NEW_RUN -> save/load cycles without archive duplication or raw-power inflation',()=>{
    let state:GameState=initialState;

    for(let cycle=1;cycle<=3;cycle+=1){
      const completed=completeCaretakerWinter(state);
      expect(completed.legacy.completedRuns).toBe(cycle);
      expect(completed.legacy.runSummaries.map(item=>item.runNumber)).toEqual(
        Array.from({length:cycle},(_,index)=>index+1),
      );

      const next=reducer(completed,{type:'NEW_RUN'});
      expect(next.campaignRun.runNumber).toBe(cycle+1);
      expect(next.campaignRun.phase).toBe('spring_exploration');
      expect(next.campaignRun.activeCampaign).toBeNull();
      expect(next.campaignRun.claimedSeasonalObjectives).toEqual([]);
      expect(next.campaignRun.majorOutcomes).toEqual({});
      expect(next.worldHistory.currentFacts).toEqual([]);
      expect(next.gold).toBe(initialState.gold);
      expect(next.gems).toBe(initialState.gems);
      expect(next.stats).toEqual(initialState.stats);
      expect(next.mastery).toEqual(initialState.mastery);
      expect(next.tacticalBattleRecords).toEqual({});
      expect(next.claimedTacticalFirstClears).toEqual([]);
      expect(next.selectedTacticalCompanions).toEqual([]);
      expect(next.tacticalCompanionBonds).toEqual(initialState.tacticalCompanionBonds);
      expect(next.legacy.completedRuns).toBe(cycle);
      expect(next.legacy.runSummaries).toHaveLength(cycle);

      state=hydrateGameState(JSON.parse(JSON.stringify(next)));
      expect(state).toEqual(next);
      expect(reducer(state,{type:'NEW_RUN'})).toEqual(state);
    }

    expect(state.campaignRun.runNumber).toBe(4);
    expect(state.legacy.completedRuns).toBe(3);
    expect(state.legacy.runSummaries.map(item=>item.runNumber)).toEqual([1,2,3]);
    expect(state.legacy.legacyWorldFacts).toEqual(['festival_saved']);
    expect(state.legacy.relationshipEchoes).toEqual({mira:['mira_winter_victory']});
    expect(state.legacy.trueClues).toEqual(['caretaker_life_anomaly']);
  });
});
