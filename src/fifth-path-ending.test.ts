import {describe,expect,it} from 'vitest';
import {hydrateV3PersistentState,type V3PersistentState} from './v3-persistent-state';
import {hydrateLegacyState} from './legacy-state';
import {commitFifthPathEnding,commitFifthPathOutcome,resolveFifthPathOutcome,resolveFifthTrueEnding} from './fifth-path-ending';

function winterReady():V3PersistentState{
  const base=hydrateV3PersistentState({
    campaignRun:{
      runNumber:5,
      phase:'winter',
      activeCampaign:'true_path',
      activeRoute:'normal',
      campaignAffinities:{caretaker:0,pathfinder:0,vanguard:0,arcanist:0},
      dangerState:{score:0,behaviors:[]},
      seasonMilestones:['path_convergence','summer_resolved','autumn_resolved'],
      majorChoices:{},majorOutcomes:{},failForwardOutcomes:[],claimedCampaignRewards:[],
      claimedSeasonalObjectives:[
        '5-summer:true_path:fifth_summer_echo_convergence',
        '5-autumn:true_path:fifth_autumn_world_reweave',
        '5-winter:true_path:fifth_winter_last_possibility',
      ],
    },
    worldHistory:{currentFacts:['true_path_echoes_aligned','true_path_world_rewoven'],inheritedFacts:['festival_saved']},
  });
  return {
    ...base,
    legacy:hydrateLegacyState({
      completedRuns:4,
      completedCampaigns:['caretaker','pathfinder','vanguard','arcanist'],
      trueClues:['caretaker_life_anomaly','pathfinder_world_route','vanguard_hidden_conflict_record','arcanist_rift_cycle'],
      runSummaries:[
        {runNumber:1,campaign:'caretaker',route:'normal',ending:'v3:a:b:c:d',career:'d',majorWorldOutcomes:['festival_saved'],keyBondMemories:[{characterId:'mira',memoryId:'mira_winter_victory'}],trueClues:['caretaker_life_anomaly'],truePathEvidence:['significant_fail_forward','sanctuary_history']},
        {runNumber:2,campaign:'pathfinder',route:'normal',ending:'v3:a:b:c:d',career:'d',majorWorldOutcomes:['ancient_route_opened'],keyBondMemories:[],trueClues:['pathfinder_world_route'],truePathEvidence:['astral_history']},
        {runNumber:3,campaign:'vanguard',route:'normal',ending:'v3:a:b:c:d',career:'d',majorWorldOutcomes:['regional_alliance'],keyBondMemories:[],trueClues:['vanguard_hidden_conflict_record'],truePathEvidence:['celestial_history']},
        {runNumber:4,campaign:'arcanist',route:'normal',ending:'v3:a:b:c:d',career:'d',majorWorldOutcomes:['rift_stabilized'],keyBondMemories:[],trueClues:['arcanist_rift_cycle'],truePathEvidence:['rift_history']},
      ],
    }),
  };
}

describe('V3 Fifth Path outcome, reward and ending persistence',()=>{
  it.each([
    ['victory','none','victory','lyra_true_path_victory','true_path_cycle_rejoined'],
    ['victory','high','costly_victory','lyra_true_path_costly_victory','true_path_cost_borne'],
    ['defeat','high','defeat','lyra_true_path_defeat','true_path_cost_borne'],
  ] as const)('commits %s/%s as fail-forward outcome with qualitative reward once', (battleResult,cost,outcome,memoryId,worldFact)=>{
    const resolved=resolveFifthPathOutcome({battleResult,cost});
    expect(resolved).toEqual({accepted:true,outcome,memoryId,worldFact,failForward:battleResult==='defeat'});
    const first=commitFifthPathOutcome(winterReady(),resolved);
    expect(first.committed).toBe(true);
    if(!first.committed)return;
    expect(first.state.campaignRun.phase).toBe('ending');
    expect(first.state.campaignRun.majorOutcomes.long_night).toBe(outcome);
    expect(first.state.campaignRun.seasonMilestones).toContain('winter_resolved');
    expect(first.state.campaignRun.claimedCampaignRewards).toEqual(['winter_resolved']);
    expect(first.state.campaignRun.failForwardOutcomes.includes('long_night')).toBe(battleResult==='defeat');
    expect(first.state.worldHistory.currentFacts).toContain(worldFact);
    expect(first.state.characterBonds.lyra.memories).toEqual([memoryId]);
    expect(first.reward).toEqual({kind:'true_path_memory',memoryId});
    const duplicate=commitFifthPathOutcome(first.state,resolved);
    expect(duplicate).toEqual({committed:false,state:first.state,reason:'already_committed'});
  });

  it('requires the true_path Winter claim before committing an outcome',()=>{
    const state=winterReady();
    const missing={...state,campaignRun:{...state.campaignRun,claimedSeasonalObjectives:state.campaignRun.claimedSeasonalObjectives.filter(key=>!key.includes('fifth_winter'))}};
    const resolved=resolveFifthPathOutcome({battleResult:'victory',cost:'none'});
    expect(resolved.accepted).toBe(true);
    if(!resolved.accepted)return;
    expect(commitFifthPathOutcome(missing,resolved)).toEqual({committed:false,state:missing,reason:'not_ready'});
  });

  it('commits one semantic True ending into the existing Legacy archive and rejects duplicates',()=>{
    const outcome=resolveFifthPathOutcome({battleResult:'victory',cost:'none'});
    expect(outcome.accepted).toBe(true);
    if(!outcome.accepted)return;
    const resolved=commitFifthPathOutcome(winterReady(),outcome);
    expect(resolved.committed).toBe(true);
    if(!resolved.committed)return;
    const ending=resolveFifthTrueEnding({
      bondResolution:'lyra_choose_this_life',
      worldResolution:'cycle_rejoined',
      careerResolution:'guardian_of_possibility',
    });
    expect(ending.accepted).toBe(true);
    if(!ending.accepted)return;
    expect(ending.ending.id).toBe('v3:true_path:lyra_choose_this_life:cycle_rejoined:guardian_of_possibility');
    const committed=commitFifthPathEnding(resolved.state,ending.ending);
    expect(committed.committed).toBe(true);
    if(!committed.committed)return;
    expect(committed.state.campaignRun.seasonMilestones).toContain('ending_committed');
    expect(committed.state.legacy.completedRuns).toBe(5);
    expect(committed.state.legacy.completedCampaigns).toContain('true_path');
    expect(committed.state.legacy.endingCollection).toContain(ending.ending.id);
    expect(committed.state.legacy.careerCollection).toContain('guardian_of_possibility');
    expect(committed.state.legacy.runSummaries.at(-1)).toEqual(expect.objectContaining({
      runNumber:5,
      campaign:'true_path',
      route:'normal',
      ending:ending.ending.id,
      career:'guardian_of_possibility',
      majorWorldOutcomes:['true_path_cycle_rejoined'],
      keyBondMemories:[{characterId:'lyra',memoryId:'lyra_true_path_victory'}],
    }));
    expect(commitFifthPathEnding(committed.state,ending.ending)).toEqual({committed:false,state:committed.state,reason:'already_committed'});
  });

  it('rejects malformed outcome/ending semantics instead of storing arbitrary IDs',()=>{
    expect(resolveFifthPathOutcome({battleResult:'unknown',cost:'none'})).toEqual({accepted:false,reason:'invalid_outcome'});
    expect(resolveFifthTrueEnding({bondResolution:'Lyra Score 999',worldResolution:'x',careerResolution:'y'})).toEqual({accepted:false,reason:'invalid_dimension'});
  });
});
