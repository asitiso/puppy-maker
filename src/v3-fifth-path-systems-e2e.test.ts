import {describe,expect,it} from 'vitest';
import {resolveFifthPathEligibility} from './fifth-path-eligibility';
import {commitFifthSeasonObjective,resolveFifthSeasonObjective} from './fifth-path-runtime';
import {fifthPathTacticalScenarios,resolveFifthTacticalTerminalResult} from './fifth-path-tactical';
import {commitFifthPathEnding,commitFifthPathOutcome,resolveFifthPathOutcome,resolveFifthTrueEnding} from './fifth-path-ending';
import {hydrateLegacyState} from './legacy-state';
import {hydrateV3PersistentState,pickV3PersistentState} from './v3-persistent-state';
import {hydrateGameState,initialState,reducer} from './game';

const clues=[
  'caretaker_life_anomaly',
  'pathfinder_world_route',
  'vanguard_hidden_conflict_record',
  'arcanist_rift_cycle',
] as const;

function eligibleLegacy(){
  return hydrateLegacyState({
    completedRuns:4,
    completedCampaigns:['caretaker','pathfinder','vanguard','arcanist'],
    endingCollection:[],careerCollection:[],
    trueClues:clues,
    legacyWorldFacts:['festival_saved','ancient_route_opened','regional_alliance','rift_stabilized'],
    relationshipEchoes:{mira:['mira_first_commitment']},
    ngPlusUnlocks:['past_life_dialogue','relationship_reunion','world_echo','fifth_path_candidate'],
    runSummaries:[
      {runNumber:1,campaign:'caretaker',route:'normal',ending:'v3:caretaker:bond:world:career',career:'career',majorWorldOutcomes:['festival_saved'],keyBondMemories:[{characterId:'mira',memoryId:'mira_first_commitment'}],trueClues:['caretaker_life_anomaly'],truePathEvidence:['significant_fail_forward','sanctuary_history']},
      {runNumber:2,campaign:'pathfinder',route:'normal',ending:'v3:pathfinder:bond:world:career',career:'career',majorWorldOutcomes:['ancient_route_opened'],keyBondMemories:[],trueClues:['pathfinder_world_route'],truePathEvidence:['astral_history']},
      {runNumber:3,campaign:'vanguard',route:'normal',ending:'v3:vanguard:bond:world:career',career:'career',majorWorldOutcomes:['regional_alliance'],keyBondMemories:[],trueClues:['vanguard_hidden_conflict_record'],truePathEvidence:['celestial_history']},
      {runNumber:4,campaign:'arcanist',route:'normal',ending:'v3:arcanist:bond:world:career',career:'career',majorWorldOutcomes:['rift_stabilized'],keyBondMemories:[],trueClues:['arcanist_rift_cycle'],truePathEvidence:['rift_history']},
    ],
  });
}

describe('V3 Fifth Path Macro B connected E2E',()=>{
  it('runs eligibility -> explicit True Path -> seasons/world/tactical -> fail-forward ending -> save/reload -> clean NG+',()=>{
    const legacy=eligibleLegacy();
    expect(resolveFifthPathEligibility(legacy).eligible).toBe(true);

    const start=hydrateGameState({
      ...initialState,
      campaignRun:{...initialState.campaignRun,runNumber:5},
      worldHistory:{currentFacts:[],inheritedFacts:[...legacy.legacyWorldFacts]},
      legacy,
      tacticalAutoBattle:true,
      tacticalBattleSpeed:2,
    });

    const selected=reducer(start,{type:'COMMIT_TRUE_PATH'});
    expect(selected).not.toBe(start);
    expect(selected.campaignRun.activeCampaign).toBe('true_path');
    expect(selected.campaignRun.phase).toBe('summer');

    let persistent=pickV3PersistentState(selected);
    const summer=resolveFifthSeasonObjective({year:5,season:'summer',source:'echo_convergence',state:persistent});
    expect(summer.accepted).toBe(true);
    if(!summer.accepted)throw new Error('Summer Fifth objective must resolve');
    const summerCommit=commitFifthSeasonObjective(persistent,summer);
    expect(summerCommit.committed).toBe(true);
    if(!summerCommit.committed)throw new Error('Summer Fifth objective must commit');
    persistent=summerCommit.state;
    expect(persistent.worldHistory.currentFacts).toContain('true_path_echoes_aligned');

    const autumn=resolveFifthSeasonObjective({year:5,season:'autumn',source:'world_reweave',state:persistent});
    expect(autumn.accepted).toBe(true);
    if(!autumn.accepted)throw new Error('Autumn Fifth objective must resolve');
    const autumnCommit=commitFifthSeasonObjective(persistent,autumn);
    expect(autumnCommit.committed).toBe(true);
    if(!autumnCommit.committed)throw new Error('Autumn Fifth objective must commit');
    persistent=autumnCommit.state;
    expect(persistent.worldHistory.currentFacts).toContain('true_path_world_rewoven');

    const scenario=fifthPathTacticalScenarios.find(item=>item.season==='winter');
    expect(scenario).toBeDefined();
    if(!scenario)throw new Error('Winter Fifth tactical scenario missing');
    const terminal=resolveFifthTacticalTerminalResult(scenario,{
      attemptKey:'run-5-last-possibility',
      battleResult:'defeat',
      rounds:12,
      survivingAllies:1,
      damageTaken:999,
    });
    expect(terminal).toEqual(expect.objectContaining({
      campaign:'true_path',season:'winter',objectiveResult:'failure',battleResult:'defeat',failForward:true,
    }));

    const winter=resolveFifthSeasonObjective({year:5,season:'winter',source:'tactical_last_possibility',state:persistent});
    expect(winter.accepted).toBe(true);
    if(!winter.accepted)throw new Error('Winter Fifth objective must resolve');
    const winterCommit=commitFifthSeasonObjective(persistent,winter);
    expect(winterCommit.committed).toBe(true);
    if(!winterCommit.committed)throw new Error('Winter Fifth objective must commit');
    persistent=winterCommit.state;

    const outcome=resolveFifthPathOutcome({battleResult:terminal.battleResult,cost:'high'});
    expect(outcome.accepted).toBe(true);
    if(!outcome.accepted)throw new Error('Fifth fail-forward outcome must resolve');
    expect(outcome.failForward).toBe(true);
    const outcomeCommit=commitFifthPathOutcome(persistent,outcome);
    expect(outcomeCommit.committed).toBe(true);
    if(!outcomeCommit.committed)throw new Error('Fifth fail-forward outcome must commit');
    persistent=outcomeCommit.state;
    expect(persistent.campaignRun.failForwardOutcomes).toContain('long_night');
    expect(persistent.campaignRun.claimedCampaignRewards).toEqual(['winter_resolved']);
    expect(persistent.characterBonds.lyra.memories).toEqual(['lyra_true_path_defeat']);

    const ending=resolveFifthTrueEnding({
      bondResolution:'lyra_choose_this_life',
      worldResolution:'cycle_bears_cost',
      careerResolution:'guardian_of_possibility',
    });
    expect(ending.accepted).toBe(true);
    if(!ending.accepted)throw new Error('True ending must resolve');
    const endingCommit=commitFifthPathEnding(persistent,ending.ending);
    expect(endingCommit.committed).toBe(true);
    if(!endingCommit.committed)throw new Error('True ending must commit');
    persistent=endingCommit.state;
    expect(persistent.legacy.runSummaries.filter(item=>item.runNumber===5&&item.campaign==='true_path')).toHaveLength(1);

    const saved=JSON.parse(JSON.stringify({...selected,...persistent}));
    const reloaded=hydrateGameState(saved);
    expect(reloaded.campaignRun.activeCampaign).toBe('true_path');
    expect(reloaded.campaignRun.seasonMilestones).toContain('ending_committed');
    expect(reloaded.legacy.runSummaries.filter(item=>item.runNumber===5&&item.campaign==='true_path')).toHaveLength(1);

    const next=reducer(reloaded,{type:'NEW_RUN'});
    expect(next.campaignRun.runNumber).toBe(6);
    expect(next.campaignRun.phase).toBe('spring_exploration');
    expect(next.campaignRun.activeCampaign).toBeNull();
    expect(next.campaignRun.seasonMilestones).toEqual([]);
    expect(next.campaignRun.claimedSeasonalObjectives).toEqual([]);
    expect(next.campaignRun.claimedCampaignRewards).toEqual([]);
    expect(next.worldHistory.currentFacts).toEqual([]);
    expect(next.worldHistory.inheritedFacts).toContain('true_path_cost_borne');
    expect(next.characterBonds.lyra).toEqual({trust:0,conflicts:[],promises:[],memories:[]});
    expect(next.legacy.completedRuns).toBe(5);
    expect(next.legacy.completedCampaigns).toContain('true_path');
    expect(next.legacy.runSummaries.filter(item=>item.runNumber===5&&item.campaign==='true_path')).toHaveLength(1);
    expect(next.tacticalAutoBattle).toBe(true);
    expect(next.tacticalBattleSpeed).toBe(2);

    const replay=reducer(next,{type:'NEW_RUN'});
    expect(replay).toBe(next);
    expect(replay.campaignRun.runNumber).toBe(6);
  });
});
