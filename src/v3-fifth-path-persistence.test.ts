import {describe,expect,it} from 'vitest';
import {hydrateV3PersistentState,type V3PersistentState} from './v3-persistent-state';
import {commitFifthPathEnding,commitFifthPathOutcome,resolveFifthPathOutcome,resolveFifthTrueEnding} from './fifth-path-ending';
import {hydrateGameState,initialState,reducer} from './game';

function winterReady():V3PersistentState{
  return hydrateV3PersistentState({
    campaignRun:{
      runNumber:5,
      phase:'winter',
      activeCampaign:'true_path',
      activeRoute:'normal',
      campaignAffinities:{caretaker:0,pathfinder:0,vanguard:0,arcanist:0},
      dangerState:{score:0,behaviors:[]},
      seasonMilestones:['path_convergence','summer_resolved','autumn_resolved'],
      majorChoices:{},
      majorOutcomes:{},
      failForwardOutcomes:[],
      claimedCampaignRewards:[],
      claimedSeasonalObjectives:[
        '5-summer:true_path:fifth_summer_echo_convergence',
        '5-autumn:true_path:fifth_autumn_world_reweave',
        '5-winter:true_path:fifth_winter_last_possibility',
      ],
    },
    worldHistory:{
      currentFacts:['true_path_echoes_aligned','true_path_world_rewoven'],
      inheritedFacts:['festival_saved'],
    },
    legacy:{
      completedRuns:4,
      completedCampaigns:['caretaker','pathfinder','vanguard','arcanist'],
      endingCollection:[],
      careerCollection:[],
      trueClues:['caretaker_life_anomaly','pathfinder_world_route','vanguard_hidden_conflict_record','arcanist_rift_cycle'],
      legacyWorldFacts:['festival_saved'],
      relationshipEchoes:{mira:['mira_first_commitment']},
      ngPlusUnlocks:['past_life_dialogue','relationship_reunion','world_echo','fifth_path_candidate'],
      runSummaries:[
        {runNumber:1,campaign:'caretaker',route:'normal',ending:'v3:caretaker:b:w:c',career:'c',majorWorldOutcomes:['festival_saved'],keyBondMemories:[{characterId:'mira',memoryId:'mira_first_commitment'}],trueClues:['caretaker_life_anomaly'],truePathEvidence:['significant_fail_forward','sanctuary_history']},
        {runNumber:2,campaign:'pathfinder',route:'normal',ending:'v3:pathfinder:b:w:c',career:'c',majorWorldOutcomes:['ancient_route_opened'],keyBondMemories:[],trueClues:['pathfinder_world_route'],truePathEvidence:['astral_history']},
        {runNumber:3,campaign:'vanguard',route:'normal',ending:'v3:vanguard:b:w:c',career:'c',majorWorldOutcomes:['regional_alliance'],keyBondMemories:[],trueClues:['vanguard_hidden_conflict_record'],truePathEvidence:['celestial_history']},
        {runNumber:4,campaign:'arcanist',route:'normal',ending:'v3:arcanist:b:w:c',career:'c',majorWorldOutcomes:['rift_stabilized'],keyBondMemories:[],trueClues:['arcanist_rift_cycle'],truePathEvidence:['rift_history']},
      ],
    },
  });
}

function completedTruePath():V3PersistentState{
  const outcome=resolveFifthPathOutcome({battleResult:'victory',cost:'none'});
  expect(outcome.accepted).toBe(true);
  if(!outcome.accepted)throw new Error('expected valid Fifth outcome');
  const outcomeCommit=commitFifthPathOutcome(winterReady(),outcome);
  expect(outcomeCommit.committed).toBe(true);
  if(!outcomeCommit.committed)throw new Error('expected Fifth outcome commit');
  const ending=resolveFifthTrueEnding({
    bondResolution:'lyra_choose_this_life',
    worldResolution:'cycle_rejoined',
    careerResolution:'guardian_of_possibility',
  });
  expect(ending.accepted).toBe(true);
  if(!ending.accepted)throw new Error('expected valid Fifth ending');
  const endingCommit=commitFifthPathEnding(outcomeCommit.state,ending.ending);
  expect(endingCommit.committed).toBe(true);
  if(!endingCommit.committed)throw new Error('expected Fifth ending commit');
  return endingCommit.state;
}

describe('V3 Fifth Path persistence and NG+ reset',()=>{
  it('round-trips a completed True Path exactly and blocks replay after reload',()=>{
    const completed=completedTruePath();
    const reloaded=hydrateV3PersistentState(JSON.parse(JSON.stringify(completed)));
    expect(reloaded).toEqual(completed);

    const outcome=resolveFifthPathOutcome({battleResult:'victory',cost:'none'});
    expect(outcome.accepted).toBe(true);
    if(!outcome.accepted)return;
    expect(commitFifthPathOutcome(reloaded,outcome)).toEqual({
      committed:false,
      state:reloaded,
      reason:'already_committed',
    });

    const ending=resolveFifthTrueEnding({
      bondResolution:'lyra_choose_this_life',
      worldResolution:'cycle_rejoined',
      careerResolution:'guardian_of_possibility',
    });
    expect(ending.accepted).toBe(true);
    if(!ending.accepted)return;
    expect(commitFifthPathEnding(reloaded,ending.ending)).toEqual({
      committed:false,
      state:reloaded,
      reason:'already_committed',
    });
  });

  it('sanitizes malformed Fifth data and refuses a forged completed-run handoff',()=>{
    const raw=JSON.parse(JSON.stringify(completedTruePath()));
    raw.campaignRun.claimedSeasonalObjectives=[
      '5-winter:true_path:fifth_winter_last_possibility',
      '5-winter:true_path:fifth_winter_last_possibility',
      '5-winter:true_path:stale_objective',
      'NaN-winter:true_path:fifth_winter_last_possibility',
    ];
    raw.worldHistory.currentFacts=['true_path_cycle_rejoined','true_path_cycle_rejoined','forged_fact'];
    raw.characterBonds.lyra.memories=['lyra_true_path_victory','lyra_true_path_victory','forged_memory'];
    raw.campaignRun.runNumber=Number.POSITIVE_INFINITY;
    raw.legacy.runSummaries=[{
      ...raw.legacy.runSummaries.at(-1),
      runNumber:1,
      ending:'forged-ending',
      career:'guardian_of_possibility',
    }];

    const hydrated=hydrateV3PersistentState(raw);
    expect(hydrated.campaignRun.runNumber).toBe(1);
    expect(hydrated.campaignRun.claimedSeasonalObjectives).toEqual(['5-winter:true_path:fifth_winter_last_possibility']);
    expect(hydrated.worldHistory.currentFacts).toEqual(['true_path_cycle_rejoined']);
    expect(hydrated.characterBonds.lyra.memories).toEqual(['lyra_true_path_victory']);

    const game=hydrateGameState({...initialState,...hydrated});
    const next=reducer(game,{type:'NEW_RUN'});
    expect(next).toBe(game);
    expect(next.campaignRun.runNumber).toBe(1);
    expect(next.campaignRun.activeCampaign).toBe('true_path');
  });

  it('starts one clean Spring run after the completed True ending while preserving Legacy and non-power Tactical preferences',()=>{
    const completed=completedTruePath();
    const game=hydrateGameState({
      ...initialState,
      ...completed,
      tacticalBattleRecords:{training_ground:{grade:'S',bestRounds:2,clearCount:9}},
      claimedTacticalFirstClears:['training_ground'],
      selectedTacticalCompanions:['wolf','cat'],
      tacticalCompanionBonds:{
        bear:{xp:120,level:3},owl:{xp:80,level:2},wolf:{xp:300,level:4},cat:{xp:220,level:4},
      },
      tacticalAutoBattle:true,
      tacticalBattleSpeed:2,
    });

    const next=reducer(game,{type:'NEW_RUN'});
    expect(next.campaignRun.runNumber).toBe(6);
    expect(next.campaignRun.phase).toBe('spring_exploration');
    expect(next.campaignRun.activeCampaign).toBeNull();
    expect(next.campaignRun.seasonMilestones).toEqual([]);
    expect(next.campaignRun.majorOutcomes).toEqual({});
    expect(next.campaignRun.claimedCampaignRewards).toEqual([]);
    expect(next.campaignRun.claimedSeasonalObjectives).toEqual([]);
    expect(next.worldHistory.currentFacts).toEqual([]);
    expect(next.worldHistory.inheritedFacts).toContain('true_path_cycle_rejoined');
    expect(next.characterBonds.lyra).toEqual({trust:0,conflicts:[],promises:[],memories:[]});
    expect(next.legacy.completedRuns).toBe(5);
    expect(next.legacy.completedCampaigns).toContain('true_path');
    expect(next.legacy.runSummaries.filter(summary=>summary.runNumber===5&&summary.campaign==='true_path')).toHaveLength(1);
    expect(next.tacticalBattleRecords).toEqual({});
    expect(next.claimedTacticalFirstClears).toEqual([]);
    expect(next.selectedTacticalCompanions).toEqual([]);
    expect(Object.values(next.tacticalCompanionBonds).every(bond=>bond.xp===0&&bond.level===1)).toBe(true);
    expect(next.tacticalAutoBattle).toBe(true);
    expect(next.tacticalBattleSpeed).toBe(2);

    const replay=reducer(next,{type:'NEW_RUN'});
    expect(replay).toBe(next);
    expect(replay.campaignRun.runNumber).toBe(6);
  });
});
