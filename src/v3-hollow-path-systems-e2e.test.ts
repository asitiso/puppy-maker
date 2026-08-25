import {describe,expect,it} from 'vitest';
import {emptyCampaignRunState,type CampaignRunState} from './campaign-state';
import {commitHollowDangerAction} from './hollow-danger-actions';
import {resolveHollowDangerState} from './hollow-danger';
import {resolveHollowFinalChoice} from './hollow-choice';
import {commitHollowSeasonObjective,resolveHollowSeasonObjective} from './hollow-runtime';
import {createHollowBattle,hollowTacticalScenarios,resolveHollowTacticalTerminalResult} from './hollow-tactical';
import {commitHollowEnding,commitHollowOutcome,resolveHollowEnding,resolveHollowOutcome} from './hollow-ending';
import {emptyV3PersistentState,pickV3PersistentState} from './v3-persistent-state';
import {hydrateGameState,initialState,reducer} from './game';

const progression={maxHp:140,agility:18,power:28,magic:24};
const candidateActions=['instrumentalize_bond','prioritize_reward_over_civilians','accept_veyr_power'] as const;

function candidateRun(activeCampaign:'caretaker'|'true_path'):CampaignRunState{
  let run:CampaignRunState={
    ...emptyCampaignRunState(),
    runNumber:2,
    phase:'summer',
    activeCampaign,
  };
  for(const actionId of candidateActions){
    const committed=commitHollowDangerAction(run,actionId);
    expect(committed.committed).toBe(true);
    if(!committed.committed)throw new Error(`danger action ${actionId} must commit`);
    expect(committed.utility.amount).toBeGreaterThan(0);
    run=committed.state;
  }
  expect(resolveHollowDangerState(run.dangerState)).toMatchObject({
    tier:'hollow_candidate',finalChoiceAvailable:true,
  });
  expect(run.activeRoute).toBe('normal');
  return run;
}

describe('V3 Hollow Path Macro B connected E2E',()=>{
  it('connects dangerous choices -> refuse/accept -> Hollow seasons + existing 3v3 -> fail-forward ending -> reload -> clean NEW_RUN',()=>{
    const refusalSource=candidateRun('true_path');
    const refused=resolveHollowFinalChoice(refusalSource,'refuse');
    expect(refused.committed).toBe(true);
    if(!refused.committed)throw new Error('Hollow refusal must commit');
    expect(refused.state.activeCampaign).toBe('true_path');
    expect(refused.state.activeRoute).toBe('normal');
    expect(refused.state.dangerState.finalChoiceResolution).toBe('refused');
    expect(resolveHollowFinalChoice(refused.state,'accept')).toEqual({
      committed:false,state:refused.state,reason:'already_resolved',
    });

    const acceptanceSource=candidateRun('caretaker');
    const accepted=resolveHollowFinalChoice(acceptanceSource,'accept');
    expect(accepted.committed).toBe(true);
    if(!accepted.committed)throw new Error('Hollow acceptance must commit');
    expect(accepted.state.activeRoute).toBe('hollow');
    expect(accepted.state.dangerState.finalChoiceResolution).toBe('accepted');
    expect(resolveHollowFinalChoice(accepted.state,'accept')).toEqual({
      committed:false,state:accepted.state,reason:'already_resolved',
    });

    let persistent={...emptyV3PersistentState(),campaignRun:accepted.state};

    const summer=resolveHollowSeasonObjective({
      year:2,season:'summer',source:'predatory_shortcut',state:persistent,
    });
    expect(summer.accepted).toBe(true);
    if(!summer.accepted)throw new Error('Hollow Summer objective must resolve');
    const summerCommit=commitHollowSeasonObjective(persistent,summer);
    expect(summerCommit.committed).toBe(true);
    if(!summerCommit.committed)throw new Error('Hollow Summer objective must commit');
    persistent=summerCommit.state;
    expect(persistent.campaignRun.phase).toBe('autumn');
    expect(persistent.worldHistory.currentFacts).toEqual(['hollow_shortcut_taken']);

    const autumn=resolveHollowSeasonObjective({
      year:2,season:'autumn',source:'rift_bargain',state:persistent,
    });
    expect(autumn.accepted).toBe(true);
    if(!autumn.accepted)throw new Error('Hollow Autumn objective must resolve');
    const autumnCommit=commitHollowSeasonObjective(persistent,autumn);
    expect(autumnCommit.committed).toBe(true);
    if(!autumnCommit.committed)throw new Error('Hollow Autumn objective must commit');
    persistent=autumnCommit.state;
    expect(persistent.campaignRun.phase).toBe('winter');
    expect(persistent.worldHistory.currentFacts).toEqual(['hollow_shortcut_taken','hollow_rift_entrenched']);

    const winterScenario=hollowTacticalScenarios.find(item=>item.season==='winter');
    expect(winterScenario).toBeDefined();
    if(!winterScenario)throw new Error('Hollow Winter Tactical scenario missing');
    const battle=createHollowBattle(winterScenario,['bear','owl'],progression,1202);
    expect(battle.units.filter(unit=>unit.side==='ally')).toHaveLength(3);
    expect(battle.units.filter(unit=>unit.side==='enemy')).toHaveLength(3);

    const terminal=resolveHollowTacticalTerminalResult(winterScenario,{
      attemptKey:'run-2-hollow-winter',
      battleResult:'defeat',
      rounds:12,
      survivingAllies:0,
      damageTaken:999,
    });
    expect(terminal).toMatchObject({
      route:'hollow',season:'winter',objectiveResult:'failure',battleResult:'defeat',failForward:true,
      terminalKey:'hollow_winter_veyr_convergence:run-2-hollow-winter',
    });

    const winter=resolveHollowSeasonObjective({
      year:2,season:'winter',source:'veyr_convergence',state:persistent,
    });
    expect(winter.accepted).toBe(true);
    if(!winter.accepted)throw new Error('Hollow Winter objective must resolve');
    const winterCommit=commitHollowSeasonObjective(persistent,winter);
    expect(winterCommit.committed).toBe(true);
    if(!winterCommit.committed)throw new Error('Hollow Winter objective must commit');
    persistent=winterCommit.state;

    const outcome=resolveHollowOutcome({battleResult:terminal.battleResult,cost:'none'});
    expect(outcome).toMatchObject({accepted:true,outcome:'defeat',memoryId:'veyr_hollow_defeat',failForward:true});
    if(!outcome.accepted)throw new Error('Hollow fail-forward outcome must resolve');
    const outcomeCommit=commitHollowOutcome(persistent,outcome);
    expect(outcomeCommit.committed).toBe(true);
    if(!outcomeCommit.committed)throw new Error('Hollow fail-forward outcome must commit');
    persistent=outcomeCommit.state;
    expect(persistent.campaignRun.failForwardOutcomes).toContain('long_night');
    expect(persistent.campaignRun.claimedCampaignRewards).toEqual(['winter_resolved']);
    expect(persistent.characterBonds.veyr.memories).toEqual(['veyr_hollow_defeat']);
    expect(commitHollowOutcome(persistent,outcome)).toEqual({
      committed:false,state:persistent,reason:'already_committed',
    });

    const ending=resolveHollowEnding({
      bondResolution:'veyr_bound',
      worldResolution:'hollow_rift',
      careerResolution:'guardian_renegade',
    });
    expect(ending.accepted).toBe(true);
    if(!ending.accepted)throw new Error('Hollow ending must resolve');
    const endingCommit=commitHollowEnding(persistent,ending.ending);
    expect(endingCommit.committed).toBe(true);
    if(!endingCommit.committed)throw new Error('Hollow ending must commit');
    persistent=endingCommit.state;
    expect(persistent.legacy.runSummaries.filter(summary=>
      summary.runNumber===2&&summary.campaign==='caretaker'&&summary.route==='hollow'
    )).toHaveLength(1);
    expect(commitHollowEnding(persistent,ending.ending)).toEqual({
      committed:false,state:persistent,reason:'already_committed',
    });

    const game=hydrateGameState({
      ...initialState,
      ...persistent,
      tacticalBattleRecords:{rift_vanguard:{grade:'C',bestRounds:12,clearCount:1}},
      claimedTacticalFirstClears:['rift_vanguard'],
      selectedTacticalCompanions:['bear','owl'],
      tacticalAutoBattle:true,
      tacticalBattleSpeed:2,
    });
    const saved=JSON.parse(JSON.stringify(game));
    const reloaded=hydrateGameState(saved);
    expect(pickV3PersistentState(reloaded)).toEqual(persistent);
    expect(reloaded.campaignRun.activeRoute).toBe('hollow');
    expect(reloaded.characterBonds.veyr.memories).toEqual(['veyr_hollow_defeat']);

    const next=reducer(reloaded,{type:'NEW_RUN'});
    expect(next.campaignRun.runNumber).toBe(3);
    expect(next.campaignRun.phase).toBe('spring_exploration');
    expect(next.campaignRun.activeCampaign).toBeNull();
    expect(next.campaignRun.activeRoute).toBe('normal');
    expect(next.campaignRun.dangerState).toEqual({score:0,behaviors:[],evidence:[]});
    expect(next.campaignRun.seasonMilestones).toEqual([]);
    expect(next.campaignRun.claimedSeasonalObjectives).toEqual([]);
    expect(next.campaignRun.claimedCampaignRewards).toEqual([]);
    expect(next.worldHistory.currentFacts).toEqual([]);
    expect(next.worldHistory.inheritedFacts).toEqual(expect.arrayContaining([
      'hollow_shortcut_taken','hollow_rift_entrenched',
    ]));
    expect(next.characterBonds.veyr).toEqual({trust:0,conflicts:[],promises:[],memories:[]});
    expect(next.legacy.relationshipEchoes.veyr).toEqual(['veyr_hollow_defeat']);
    expect(next.legacy.runSummaries.filter(summary=>summary.runNumber===2&&summary.route==='hollow')).toHaveLength(1);
    expect(next.tacticalBattleRecords).toEqual({});
    expect(next.claimedTacticalFirstClears).toEqual([]);
    expect(next.selectedTacticalCompanions).toEqual([]);
    expect(next.tacticalAutoBattle).toBe(true);
    expect(next.tacticalBattleSpeed).toBe(2);

    const nextReloaded=hydrateGameState(JSON.parse(JSON.stringify(next)));
    expect(nextReloaded).toEqual(next);
    const repeatedNewRun=reducer(next,{type:'NEW_RUN'});
    expect(repeatedNewRun).toBe(next);
    expect(repeatedNewRun.campaignRun.runNumber).toBe(3);
  });
});
