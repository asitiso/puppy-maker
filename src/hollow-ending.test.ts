import {describe,expect,it} from 'vitest';
import {hydrateV3PersistentState,type V3PersistentState} from './v3-persistent-state';
import {
  commitHollowEnding,
  commitHollowOutcome,
  resolveHollowEnding,
  resolveHollowOutcome,
} from './hollow-ending';

function winterReady():V3PersistentState{
  return hydrateV3PersistentState({
    campaignRun:{
      runNumber:2,
      phase:'winter',
      activeCampaign:'caretaker',
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
  });
}

describe('Hollow outcome, reward, Bond, and ending persistence',()=>{
  it.each([
    ['victory','none','victory','veyr_hollow_victory'],
    ['victory','high','costly_victory','veyr_hollow_costly_victory'],
    ['defeat','none','defeat','veyr_hollow_defeat'],
  ] as const)('commits %s/%s as fail-forward %s exactly once',(
    battleResult,cost,expectedOutcome,expectedMemory,
  )=>{
    const result=resolveHollowOutcome({battleResult,cost});
    expect(result.accepted).toBe(true);
    if(!result.accepted)throw new Error('expected Hollow outcome');
    expect(result).toMatchObject({
      outcome:expectedOutcome,
      memoryId:expectedMemory,
      failForward:true,
    });

    const first=commitHollowOutcome(winterReady(),result);
    expect(first.committed).toBe(true);
    if(!first.committed)throw new Error('expected Hollow outcome commit');
    expect(first.reward).toEqual({kind:'hollow_memory',memoryId:expectedMemory});
    expect(first.state.campaignRun.phase).toBe('ending');
    expect(first.state.campaignRun.majorOutcomes.long_night).toBe(expectedOutcome);
    expect(first.state.campaignRun.seasonMilestones.filter(id=>id==='winter_resolved')).toHaveLength(1);
    expect(first.state.campaignRun.claimedCampaignRewards.filter(id=>id==='winter_resolved')).toHaveLength(1);
    expect(first.state.characterBonds.veyr.memories).toEqual([expectedMemory]);
    expect(first.state.worldHistory.currentFacts).toEqual(['hollow_shortcut_taken','hollow_rift_entrenched']);
    if(expectedOutcome==='defeat')expect(first.state.campaignRun.failForwardOutcomes).toContain('long_night');

    expect(commitHollowOutcome(first.state,result)).toEqual({
      committed:false,state:first.state,reason:'already_committed',
    });
  });

  it('rejects malformed outcomes and a terminal commit without the canonical Winter claim',()=>{
    expect(resolveHollowOutcome({battleResult:'draw',cost:'none'})).toEqual({
      accepted:false,reason:'invalid_outcome',
    });
    const state=winterReady();
    state.campaignRun.claimedSeasonalObjectives=state.campaignRun.claimedSeasonalObjectives.filter(
      key=>!key.includes('hollow_winter_veyr_convergence'),
    );
    const result=resolveHollowOutcome({battleResult:'defeat',cost:'none'});
    expect(result.accepted).toBe(true);
    if(!result.accepted)return;
    expect(commitHollowOutcome(state,result)).toEqual({
      committed:false,state,reason:'not_ready',
    });
  });

  it('archives one semantic Hollow ending while preserving the underlying campaign and route',()=>{
    const outcome=resolveHollowOutcome({battleResult:'defeat',cost:'none'});
    expect(outcome.accepted).toBe(true);
    if(!outcome.accepted)throw new Error('expected Hollow outcome');
    const outcomeCommit=commitHollowOutcome(winterReady(),outcome);
    expect(outcomeCommit.committed).toBe(true);
    if(!outcomeCommit.committed)throw new Error('expected Hollow outcome commit');

    const ending=resolveHollowEnding({
      bondResolution:'veyr_bound',
      worldResolution:'hollow_rift',
      careerResolution:'guardian_renegade',
    });
    expect(ending.accepted).toBe(true);
    if(!ending.accepted)throw new Error('expected Hollow ending');
    expect(ending.ending.dimensions.campaign).toBe('hollow');

    const first=commitHollowEnding(outcomeCommit.state,ending.ending);
    expect(first.committed).toBe(true);
    if(!first.committed)throw new Error('expected Hollow ending commit');
    expect(first.state.campaignRun.seasonMilestones.filter(id=>id==='ending_committed')).toHaveLength(1);
    expect(first.state.legacy.completedRuns).toBe(1);
    const summary=first.state.legacy.runSummaries.at(-1);
    expect(summary).toMatchObject({
      runNumber:2,
      campaign:'caretaker',
      route:'hollow',
      ending:ending.ending.id,
      career:'guardian_renegade',
      majorWorldOutcomes:['hollow_shortcut_taken','hollow_rift_entrenched'],
      keyBondMemories:[{characterId:'veyr',memoryId:'veyr_hollow_defeat'}],
    });

    expect(commitHollowEnding(first.state,ending.ending)).toEqual({
      committed:false,state:first.state,reason:'already_committed',
    });
  });

  it('rejects an ending whose semantic campaign dimension is not Hollow',()=>{
    const outcome=resolveHollowOutcome({battleResult:'victory',cost:'none'});
    expect(outcome.accepted).toBe(true);
    if(!outcome.accepted)return;
    const outcomeCommit=commitHollowOutcome(winterReady(),outcome);
    expect(outcomeCommit.committed).toBe(true);
    if(!outcomeCommit.committed)return;
    expect(commitHollowEnding(outcomeCommit.state,{
      id:'v3:caretaker:veyr_bound:hollow_rift:guardian_renegade',
      dimensions:{campaign:'caretaker',bond:'veyr_bound',world:'hollow_rift',career:'guardian_renegade'},
    })).toEqual({committed:false,state:outcomeCommit.state,reason:'invalid_ending'});
  });
});
