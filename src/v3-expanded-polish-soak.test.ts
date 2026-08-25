import {describe,expect,it} from 'vitest';
import {emptyV3PersistentState,type V3PersistentState} from './v3-persistent-state';
import {prepareNewPossibilityV3State} from './ngplus-replay';
import type {CampaignId,CampaignRoute} from './campaign-model';

function finishCurrentRun(
  input:V3PersistentState,
  campaign:CampaignId,
  route:CampaignRoute,
  endingCampaign:'caretaker'|'true_path'|'hollow',
  worldOutcome:'festival_saved'|'true_path_world_rewoven'|'hollow_shortcut_taken',
):V3PersistentState{
  const state=structuredClone(input);
  const runNumber=state.campaignRun.runNumber;
  const ending=`v3:${endingCampaign}:bond_remembered:world_changed:guardian`;
  state.campaignRun={
    ...state.campaignRun,
    phase:'ending',
    activeCampaign:campaign,
    activeRoute:route,
    seasonMilestones:['winter_resolved','ending_committed'],
    majorOutcomes:{long_night:'defeat'},
    failForwardOutcomes:['long_night'],
    dangerState:route==='hollow'
      ? {score:3,behaviors:['accepted_veyr_power'],evidence:['veyr_power'],finalChoiceResolution:'accepted'}
      : {score:0,behaviors:[],evidence:[]},
  };
  state.worldHistory.currentFacts=[worldOutcome];
  state.legacy={
    ...state.legacy,
    completedRuns:state.legacy.completedRuns+1,
    completedCampaigns:[...state.legacy.completedCampaigns,campaign],
    endingCollection:[...state.legacy.endingCollection,ending],
    careerCollection:[...state.legacy.careerCollection,'guardian'],
    runSummaries:[...state.legacy.runSummaries,{
      runNumber,
      campaign,
      route,
      ending,
      career:'guardian',
      majorWorldOutcomes:[worldOutcome],
      keyBondMemories:[],
      trueClues:[],
    }],
  };
  return state;
}

function expectCleanNextRun(state:V3PersistentState,runNumber:number){
  expect(state.campaignRun).toMatchObject({
    runNumber,
    phase:'spring_exploration',
    activeCampaign:null,
    activeRoute:'normal',
  });
  expect(state.campaignRun.dangerState).toMatchObject({score:0,behaviors:[],evidence:[]});
  expect(state.campaignRun.dangerState.finalChoiceResolution).toBeUndefined();
  expect(state.campaignRun.majorOutcomes).toEqual({});
  expect(state.campaignRun.seasonMilestones).toEqual([]);
  expect(state.worldHistory.currentFacts).toEqual([]);
}

describe('Expanded Polish multi-cycle V3 soak',()=>{
  it('keeps one canonical lineage clean across normal -> True -> Hollow -> new possibility',()=>{
    const initial=emptyV3PersistentState();

    const run1=finishCurrentRun(initial,'caretaker','normal','caretaker','festival_saved');
    const next2=prepareNewPossibilityV3State(run1);
    expect(next2.started).toBe(true);
    if(!next2.started)return;
    expectCleanNextRun(next2.state,2);
    expect(next2.state.legacy.completedRuns).toBe(1);
    expect(next2.state.worldHistory.inheritedFacts).toContain('festival_saved');
    expect(prepareNewPossibilityV3State(next2.state).started).toBe(false);

    const run2=finishCurrentRun(next2.state,'true_path','normal','true_path','true_path_world_rewoven');
    const next3=prepareNewPossibilityV3State(run2);
    expect(next3.started).toBe(true);
    if(!next3.started)return;
    expectCleanNextRun(next3.state,3);
    expect(next3.state.legacy.completedRuns).toBe(2);
    expect(next3.state.legacy.runSummaries.map(summary=>summary.runNumber)).toEqual([1,2]);
    expect(next3.state.worldHistory.inheritedFacts).toEqual(expect.arrayContaining(['festival_saved','true_path_world_rewoven']));

    const run3=finishCurrentRun(next3.state,'true_path','hollow','hollow','hollow_shortcut_taken');
    const next4=prepareNewPossibilityV3State(run3);
    expect(next4.started).toBe(true);
    if(!next4.started)return;
    expectCleanNextRun(next4.state,4);
    expect(next4.state.legacy.completedRuns).toBe(3);
    expect(next4.state.legacy.runSummaries.map(summary=>summary.runNumber)).toEqual([1,2,3]);
    expect(next4.state.worldHistory.inheritedFacts).toEqual(expect.arrayContaining([
      'festival_saved','true_path_world_rewoven','hollow_shortcut_taken',
    ]));
    expect(next4.state.campaignRun.dangerState.evidence).toEqual([]);
    expect(prepareNewPossibilityV3State(next4.state).started).toBe(false);
  });
});
