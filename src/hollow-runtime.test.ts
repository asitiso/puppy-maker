import {describe,expect,it} from 'vitest';
import {emptyV3PersistentState,type V3PersistentState} from './v3-persistent-state';
import {
  commitHollowSeasonObjective,
  hollowSeasonDefinitions,
  resolveHollowSeasonObjective,
} from './hollow-runtime';

function hollowState(phase:'summer'|'autumn'|'winter'='summer'):V3PersistentState{
  const state=emptyV3PersistentState();
  return {
    ...state,
    campaignRun:{
      ...state.campaignRun,
      runNumber:3,
      phase,
      activeCampaign:'caretaker',
      activeRoute:'hollow',
      dangerState:{
        score:0,
        behaviors:[],
        evidence:['instrumental_bond','civilian_tradeoff','veyr_power'],
        finalChoiceResolution:'accepted',
      },
    },
    worldHistory:{currentFacts:[],inheritedFacts:['festival_saved']},
  };
}

describe('Hollow route seasonal/world runtime',()=>{
  it('defines one route-aware objective per playable season and rejects non-Hollow routes',()=>{
    expect(hollowSeasonDefinitions.map(item=>item.objectiveId)).toEqual([
      'hollow_summer_predatory_shortcut',
      'hollow_autumn_rift_bargain',
      'hollow_winter_veyr_convergence',
    ]);
    const normal=hollowState();
    normal.campaignRun.activeRoute='normal';
    expect(resolveHollowSeasonObjective({year:3,season:'summer',source:'predatory_shortcut',state:normal})).toEqual({
      accepted:false,reason:'invalid_context',
    });
  });

  it('commits Summer exactly once, records a current World fact, preserves inherited history, and advances Autumn',()=>{
    const state=hollowState('summer');
    const resolved=resolveHollowSeasonObjective({year:3,season:'summer',source:'predatory_shortcut',state});
    expect(resolved).toMatchObject({
      accepted:true,
      objectiveId:'hollow_summer_predatory_shortcut',
      claimKey:'3-summer:hollow:hollow_summer_predatory_shortcut',
      worldFact:'hollow_shortcut_taken',
    });
    if(!resolved.accepted)throw new Error('expected Hollow Summer objective');
    const committed=commitHollowSeasonObjective(state,resolved);
    expect(committed.committed).toBe(true);
    if(!committed.committed)throw new Error('expected Hollow Summer commit');
    expect(committed.state.campaignRun.phase).toBe('autumn');
    expect(committed.state.campaignRun.seasonMilestones).toContain('summer_resolved');
    expect(committed.state.campaignRun.claimedSeasonalObjectives).toEqual([
      '3-summer:hollow:hollow_summer_predatory_shortcut',
    ]);
    expect(committed.state.worldHistory).toEqual({
      currentFacts:['hollow_shortcut_taken'],
      inheritedFacts:['festival_saved'],
    });
    expect(commitHollowSeasonObjective(committed.state,resolved)).toEqual({
      committed:false,state:committed.state,reason:'already_claimed',
    });
  });

  it('requires Summer before Autumn, then advances to Winter and records Rift dependence consequence once',()=>{
    const state=hollowState('autumn');
    expect(resolveHollowSeasonObjective({year:3,season:'autumn',source:'rift_bargain',state})).toEqual({
      accepted:false,reason:'invalid_context',
    });
    const ready:V3PersistentState={
      ...state,
      campaignRun:{...state.campaignRun,seasonMilestones:['summer_resolved']},
    };
    const resolved=resolveHollowSeasonObjective({year:3,season:'autumn',source:'rift_bargain',state:ready});
    if(!resolved.accepted)throw new Error('expected Hollow Autumn objective');
    const committed=commitHollowSeasonObjective(ready,resolved);
    expect(committed.committed).toBe(true);
    if(!committed.committed)throw new Error('expected Hollow Autumn commit');
    expect(committed.state.campaignRun.phase).toBe('winter');
    expect(committed.state.campaignRun.seasonMilestones).toEqual(['summer_resolved','autumn_resolved']);
    expect(committed.state.worldHistory.currentFacts).toEqual(['hollow_rift_entrenched']);
  });

  it('allows Hollow over an underlying True campaign, requires Autumn resolution for Winter, and leaves terminal resolution to the outcome commit',()=>{
    const state=hollowState('winter');
    state.campaignRun.activeCampaign='true_path';
    expect(resolveHollowSeasonObjective({year:3,season:'winter',source:'veyr_convergence',state})).toEqual({
      accepted:false,reason:'invalid_context',
    });
    state.campaignRun.seasonMilestones=['summer_resolved','autumn_resolved'];
    const resolved=resolveHollowSeasonObjective({year:3,season:'winter',source:'veyr_convergence',state});
    expect(resolved).toMatchObject({
      accepted:true,
      claimKey:'3-winter:hollow:hollow_winter_veyr_convergence',
    });
    if(!resolved.accepted)throw new Error('expected Hollow Winter objective');
    const committed=commitHollowSeasonObjective(state,resolved);
    expect(committed.committed).toBe(true);
    if(!committed.committed)throw new Error('expected Hollow Winter commit');
    expect(committed.state.campaignRun.phase).toBe('winter');
    expect(committed.state.campaignRun.seasonMilestones).not.toContain('winter_resolved');
  });
});
