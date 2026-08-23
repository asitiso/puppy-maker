import {describe,expect,it} from 'vitest';
import {emptyV3PersistentState} from './v3-persistent-state';
import {hydrateLegacyState} from './legacy-state';
import {commitTruePath} from './fifth-path-state';
import {initialState,reducer,type GameState} from './game';

const eligibleLegacy=()=>hydrateLegacyState({
  completedRuns:4,
  completedCampaigns:['caretaker','pathfinder','vanguard','arcanist'],
  trueClues:['caretaker_life_anomaly','pathfinder_world_route','vanguard_hidden_conflict_record','arcanist_rift_cycle'],
  runSummaries:[
    {runNumber:1,campaign:'caretaker',route:'normal',ending:'v3:a:b:c:d',career:'d',majorWorldOutcomes:['festival_saved'],keyBondMemories:[{characterId:'mira',memoryId:'mira_winter_victory'}],trueClues:['caretaker_life_anomaly'],truePathEvidence:['significant_fail_forward','sanctuary_history']},
    {runNumber:2,campaign:'pathfinder',route:'normal',ending:'v3:a:b:c:d',career:'d',majorWorldOutcomes:['ancient_route_opened'],keyBondMemories:[],trueClues:['pathfinder_world_route'],truePathEvidence:['astral_history']},
    {runNumber:3,campaign:'vanguard',route:'normal',ending:'v3:a:b:c:d',career:'d',majorWorldOutcomes:['regional_alliance'],keyBondMemories:[],trueClues:['vanguard_hidden_conflict_record'],truePathEvidence:['celestial_history']},
    {runNumber:4,campaign:'arcanist',route:'normal',ending:'v3:a:b:c:d',career:'d',majorWorldOutcomes:['rift_stabilized'],keyBondMemories:[],trueClues:['arcanist_rift_cycle'],truePathEvidence:['rift_history']},
  ],
});

function eligiblePersistent(){
  const base=emptyV3PersistentState();
  return {...base,campaignRun:{...base.campaignRun,runNumber:5},legacy:eligibleLegacy()};
}

describe('V3 Fifth Path explicit authoritative commit',()=>{
  it('commits an eligible clean Spring run into true_path Summer exactly once',()=>{
    const before=eligiblePersistent();
    expect(before.campaignRun.activeCampaign).toBeNull();
    const result=commitTruePath(before);
    expect(result.committed).toBe(true);
    if(!result.committed)return;
    expect(result.state.campaignRun).toMatchObject({
      runNumber:5,
      activeCampaign:'true_path',
      activeRoute:'normal',
      phase:'summer',
      seasonMilestones:['path_convergence'],
    });
    const replay=commitTruePath(result.state);
    expect(replay).toEqual({committed:false,state:result.state,reason:'not_ready'});
  });

  it('rejects explicit selection when canonical eligibility is absent or Spring is not clean',()=>{
    const ineligible=emptyV3PersistentState();
    expect(commitTruePath(ineligible)).toEqual({committed:false,state:ineligible,reason:'ineligible'});
    const eligible=eligiblePersistent();
    const dirty={...eligible,campaignRun:{...eligible.campaignRun,activeCampaign:'caretaker' as const,phase:'summer' as const}};
    expect(commitTruePath(dirty)).toEqual({committed:false,state:dirty,reason:'not_ready'});
  });

  it('does not select true_path merely because eligibility exists',()=>{
    const eligible=eligiblePersistent();
    expect(eligible.campaignRun.activeCampaign).toBeNull();
    expect(eligible.campaignRun.phase).toBe('spring_exploration');
  });

  it('wires the explicit reducer action without disturbing other GameState fields',()=>{
    const state:GameState={...initialState,campaignRun:{...initialState.campaignRun,runNumber:5},legacy:eligibleLegacy(),gold:4321};
    const next=reducer(state,{type:'COMMIT_TRUE_PATH'});
    expect(next.gold).toBe(4321);
    expect(next.campaignRun.activeCampaign).toBe('true_path');
    expect(next.campaignRun.phase).toBe('summer');
    expect(next.campaignRun.seasonMilestones).toEqual(['path_convergence']);
    expect(reducer(next,{type:'COMMIT_TRUE_PATH'})).toEqual(next);
  });
});
