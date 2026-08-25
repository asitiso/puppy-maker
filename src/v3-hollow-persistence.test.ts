import {describe,expect,it} from 'vitest';
import type {CampaignId} from './campaign-model';
import {hydrateV3PersistentState,type V3PersistentState} from './v3-persistent-state';
import {commitHollowEnding,commitHollowOutcome,resolveHollowEnding,resolveHollowOutcome} from './hollow-ending';
import {hydrateGameState,initialState,reducer} from './game';

function winterReady(campaign:CampaignId='caretaker'):V3PersistentState{
  return hydrateV3PersistentState({
    campaignRun:{
      runNumber:2,
      phase:'winter',
      activeCampaign:campaign,
      activeRoute:'hollow',
      campaignAffinities:{caretaker:0,pathfinder:0,vanguard:0,arcanist:0},
      dangerState:{
        score:999,
        behaviors:[],
        evidence:['instrumental_bond','civilian_tradeoff','veyr_power'],
        finalChoiceResolution:'accepted',
      },
      seasonMilestones:['summer_resolved','autumn_resolved'],
      majorChoices:{},
      majorOutcomes:{},
      failForwardOutcomes:[],
      claimedCampaignRewards:[],
      claimedSeasonalObjectives:[
        '2-summer:hollow:hollow_summer_predatory_shortcut',
        '2-autumn:hollow:hollow_autumn_rift_bargain',
        '2-winter:hollow:hollow_winter_veyr_convergence',
      ],
    },
    worldHistory:{
      currentFacts:['hollow_shortcut_taken','hollow_rift_entrenched'],
      inheritedFacts:['festival_saved'],
    },
    legacy:{
      completedRuns:0,
      completedCampaigns:[],
      endingCollection:[],
      careerCollection:[],
      trueClues:[],
      legacyWorldFacts:['festival_saved'],
      relationshipEchoes:{},
      ngPlusUnlocks:[],
      runSummaries:[],
    },
  });
}

function completedHollow(campaign:CampaignId='caretaker'):V3PersistentState{
  const outcome=resolveHollowOutcome({battleResult:'defeat',cost:'none'});
  expect(outcome.accepted).toBe(true);
  if(!outcome.accepted)throw new Error('expected Hollow outcome');
  const outcomeCommit=commitHollowOutcome(winterReady(campaign),outcome);
  expect(outcomeCommit.committed).toBe(true);
  if(!outcomeCommit.committed)throw new Error('expected Hollow outcome commit');
  const ending=resolveHollowEnding({
    bondResolution:'veyr_bound',
    worldResolution:'hollow_rift',
    careerResolution:'guardian_renegade',
  });
  expect(ending.accepted).toBe(true);
  if(!ending.accepted)throw new Error('expected Hollow ending');
  const endingCommit=commitHollowEnding(outcomeCommit.state,ending.ending);
  expect(endingCommit.committed).toBe(true);
  if(!endingCommit.committed)throw new Error('expected Hollow ending commit');
  return endingCommit.state;
}

describe('V3 Hollow persistence, duplicate guards, and NEW_RUN reset',()=>{
  it('round-trips a completed Hollow run exactly and blocks outcome/ending replay after reload',()=>{
    const completed=completedHollow();
    const reloaded=hydrateV3PersistentState(JSON.parse(JSON.stringify(completed)));
    expect(reloaded).toEqual(completed);

    const outcome=resolveHollowOutcome({battleResult:'defeat',cost:'none'});
    expect(outcome.accepted).toBe(true);
    if(!outcome.accepted)return;
    expect(commitHollowOutcome(reloaded,outcome)).toEqual({
      committed:false,state:reloaded,reason:'already_committed',
    });

    const ending=resolveHollowEnding({
      bondResolution:'veyr_bound',
      worldResolution:'hollow_rift',
      careerResolution:'guardian_renegade',
    });
    expect(ending.accepted).toBe(true);
    if(!ending.accepted)return;
    expect(commitHollowEnding(reloaded,ending.ending)).toEqual({
      committed:false,state:reloaded,reason:'already_committed',
    });
  });

  it('sanitizes malformed Hollow state and refuses a forged completed-run handoff',()=>{
    const raw=JSON.parse(JSON.stringify(completedHollow()));
    raw.campaignRun.claimedSeasonalObjectives=[
      '2-winter:hollow:hollow_winter_veyr_convergence',
      '2-winter:hollow:hollow_winter_veyr_convergence',
      '2-winter:hollow:stale_objective',
      'NaN-winter:hollow:hollow_winter_veyr_convergence',
    ];
    raw.campaignRun.dangerState.evidence=['veyr_power','veyr_power','forged_evidence'];
    raw.worldHistory.currentFacts=['hollow_shortcut_taken','hollow_shortcut_taken','forged_fact'];
    raw.characterBonds.veyr.memories=['veyr_hollow_defeat','veyr_hollow_defeat','forged_memory'];
    raw.campaignRun.runNumber=Number.POSITIVE_INFINITY;
    raw.legacy.runSummaries=[{
      ...raw.legacy.runSummaries.at(-1),
      runNumber:1,
      ending:'v3:caretaker:veyr_bound:hollow_rift:guardian_renegade',
      route:'hollow',
      career:'guardian_renegade',
    }];

    const hydrated=hydrateV3PersistentState(raw);
    expect(hydrated.campaignRun.runNumber).toBe(1);
    expect(hydrated.campaignRun.claimedSeasonalObjectives).toEqual(['2-winter:hollow:hollow_winter_veyr_convergence']);
    expect(hydrated.campaignRun.dangerState.evidence).toEqual(['veyr_power']);
    expect(hydrated.worldHistory.currentFacts).toEqual(['hollow_shortcut_taken']);
    expect(hydrated.characterBonds.veyr.memories).toEqual(['veyr_hollow_defeat']);

    const game=hydrateGameState({...initialState,...hydrated});
    const next=reducer(game,{type:'NEW_RUN'});
    expect(next).toBe(game);
    expect(next.campaignRun.runNumber).toBe(1);
    expect(next.campaignRun.activeRoute).toBe('hollow');
  });

  it('starts exactly one clean Spring run, promotes compact Hollow echoes, and resets current route/danger/Tactical power',()=>{
    const completed=completedHollow();
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
    expect(next.campaignRun.runNumber).toBe(3);
    expect(next.campaignRun.phase).toBe('spring_exploration');
    expect(next.campaignRun.activeCampaign).toBeNull();
    expect(next.campaignRun.activeRoute).toBe('normal');
    expect(next.campaignRun.dangerState).toEqual({score:0,behaviors:[],evidence:[]});
    expect(next.campaignRun.seasonMilestones).toEqual([]);
    expect(next.campaignRun.majorOutcomes).toEqual({});
    expect(next.campaignRun.claimedCampaignRewards).toEqual([]);
    expect(next.campaignRun.claimedSeasonalObjectives).toEqual([]);
    expect(next.worldHistory.currentFacts).toEqual([]);
    expect(next.worldHistory.inheritedFacts).toEqual(expect.arrayContaining([
      'festival_saved','hollow_shortcut_taken','hollow_rift_entrenched',
    ]));
    expect(next.characterBonds.veyr).toEqual({trust:0,conflicts:[],promises:[],memories:[]});
    expect(next.legacy.completedRuns).toBe(1);
    expect(next.legacy.runSummaries.filter(summary=>summary.runNumber===2&&summary.route==='hollow')).toHaveLength(1);
    expect(next.legacy.relationshipEchoes.veyr).toEqual(['veyr_hollow_defeat']);
    expect(next.tacticalBattleRecords).toEqual({});
    expect(next.claimedTacticalFirstClears).toEqual([]);
    expect(next.selectedTacticalCompanions).toEqual([]);
    expect(Object.values(next.tacticalCompanionBonds).every(bond=>bond.xp===0&&bond.level===1)).toBe(true);
    expect(next.tacticalAutoBattle).toBe(true);
    expect(next.tacticalBattleSpeed).toBe(2);

    const reloaded=hydrateGameState(JSON.parse(JSON.stringify(next)));
    expect(reloaded).toEqual(next);
    const replay=reducer(next,{type:'NEW_RUN'});
    expect(replay).toBe(next);
    expect(replay.campaignRun.runNumber).toBe(3);
    expect(replay.campaignRun.activeRoute).toBe('normal');
  });

  it('allows a Hollow overlay completed on true_path to hand off without confusing campaign identity with route identity',()=>{
    const completed=completedHollow('true_path');
    expect(completed.legacy.runSummaries.at(-1)).toMatchObject({
      campaign:'true_path',route:'hollow',
    });
    const game=hydrateGameState({...initialState,...completed});
    const next=reducer(game,{type:'NEW_RUN'});
    expect(next).not.toBe(game);
    expect(next.campaignRun.runNumber).toBe(3);
    expect(next.campaignRun.activeCampaign).toBeNull();
    expect(next.campaignRun.activeRoute).toBe('normal');
    expect(next.legacy.runSummaries.filter(summary=>summary.runNumber===2&&summary.campaign==='true_path'&&summary.route==='hollow')).toHaveLength(1);
  });
});
