import {describe,expect,it} from 'vitest';
import {hydrateV3PersistentState,emptyV3PersistentState,type V3PersistentState} from './v3-persistent-state';
import {prepareNewPossibilityV3State} from './ngplus-replay';

function completedRun(input:{campaign:'caretaker'|'true_path';route:'normal'|'hollow';endingCampaign:'caretaker'|'true_path'|'hollow';runNumber?:number}):V3PersistentState{
  const runNumber=input.runNumber??1;
  const state=emptyV3PersistentState();
  state.campaignRun={
    ...state.campaignRun,
    runNumber,
    phase:'ending',
    activeCampaign:input.campaign,
    activeRoute:input.route,
    seasonMilestones:['winter_resolved','ending_committed'],
    majorOutcomes:{long_night:'defeat'},
    failForwardOutcomes:['long_night'],
    dangerState:input.route==='hollow'
      ? {score:3,behaviors:['accepted_veyr_power'],evidence:['veyr_power'],finalChoiceResolution:'accepted'}
      : {score:0,behaviors:[],evidence:[]},
  };
  const ending=`v3:${input.endingCampaign}:bond_kept:world_remembered:guardian`;
  state.worldHistory={currentFacts:['festival_saved'],inheritedFacts:['ancient_route_opened']};
  state.legacy={
    ...state.legacy,
    completedRuns:runNumber,
    completedCampaigns:[input.campaign],
    endingCollection:[ending],
    careerCollection:['guardian'],
    legacyWorldFacts:['ancient_route_opened'],
    runSummaries:[{
      runNumber,
      campaign:input.campaign,
      route:input.route,
      ending,
      career:'guardian',
      majorWorldOutcomes:['festival_saved'],
      keyBondMemories:[],
      trueClues:[],
    }],
  };
  return state;
}

describe('Expanded Polish V3 persistence hardening',()=>{
  it('sanitizes malformed numeric/current-run authority and canonicalizes registered lists',()=>{
    const hydrated=hydrateV3PersistentState({
      campaignRun:{
        runNumber:Infinity,
        campaignAffinities:{caretaker:NaN,pathfinder:-1,vanguard:4.7,arcanist:2},
        dangerState:{
          score:Infinity,
          behaviors:['accepted_veyr_power','accepted_veyr_power','unknown_behavior'],
          evidence:['veyr_power','veyr_power','unknown_evidence'],
        },
      },
      worldHistory:{
        currentFacts:['rift_unstable','rift_unstable','unknown_fact'],
        inheritedFacts:['festival_saved','festival_saved'],
      },
      legacy:{completedRuns:Infinity},
      characterBonds:null,
    });
    expect(hydrated.campaignRun.runNumber).toBe(1);
    expect(hydrated.campaignRun.campaignAffinities).toEqual({caretaker:0,pathfinder:0,vanguard:4,arcanist:2});
    expect(hydrated.campaignRun.dangerState.score).toBe(0);
    expect(hydrated.campaignRun.dangerState.behaviors).toEqual(['accepted_veyr_power']);
    expect(hydrated.campaignRun.dangerState.evidence).toEqual(['veyr_power']);
    expect(hydrated.worldHistory.currentFacts).toEqual(['rift_unstable']);
    expect(hydrated.worldHistory.inheritedFacts).toEqual(['festival_saved']);
    expect(hydrated.legacy.completedRuns).toBe(0);
  });

  it('is idempotent across hydrate -> JSON save -> hydrate',()=>{
    const once=hydrateV3PersistentState(completedRun({campaign:'caretaker',route:'normal',endingCampaign:'caretaker'}));
    const twice=hydrateV3PersistentState(JSON.parse(JSON.stringify(once)));
    expect(twice).toEqual(once);
  });

  it('starts a clean next possibility exactly once while preserving compact world echoes',()=>{
    const current=completedRun({campaign:'caretaker',route:'normal',endingCampaign:'caretaker'});
    const first=prepareNewPossibilityV3State(current);
    expect(first.started).toBe(true);
    if(!first.started)return;
    expect(first.nextRunNumber).toBe(2);
    expect(first.state.campaignRun).toMatchObject({runNumber:2,phase:'spring_exploration',activeCampaign:null,activeRoute:'normal'});
    expect(first.state.campaignRun.dangerState.evidence).toEqual([]);
    expect(first.state.worldHistory.currentFacts).toEqual([]);
    expect(first.state.worldHistory.inheritedFacts).toEqual(expect.arrayContaining(['ancient_route_opened','festival_saved']));
    const second=prepareNewPossibilityV3State(first.state);
    expect(second.started).toBe(false);
    expect(second.state).toBe(first.state);
  });

  it('clears Hollow current authority on NEW_RUN and rejects arbitrary non-canonical manual echoes',()=>{
    const current=completedRun({campaign:'true_path',route:'hollow',endingCampaign:'hollow'});
    current.legacy.relationshipEchoes={veyr:['hollow_bond_memory']};
    const next=prepareNewPossibilityV3State(current);
    expect(next.started).toBe(true);
    if(!next.started)return;
    expect(next.state.campaignRun.activeRoute).toBe('normal');
    expect(next.state.campaignRun.activeCampaign).toBeNull();
    expect(next.state.campaignRun.dangerState).toMatchObject({score:0,behaviors:[],evidence:[]});
    expect(next.state.campaignRun.dangerState.finalChoiceResolution).toBeUndefined();
    expect(next.state.legacy.relationshipEchoes.veyr).toBeUndefined();
  });
});
