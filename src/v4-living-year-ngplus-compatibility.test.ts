import {describe,expect,it} from 'vitest';
import {commitLongNightOutcome,commitWinterEnding,resolveLongNightOutcome,resolveModularEnding} from './campaign-winter-season';
import {initialState,reducer,type GameState} from './game';
import {emptyWeeklyLifeState} from './weekly-life';

function completedCaretakerRunWithWeeklyState():GameState{
  const selected=reducer(initialState,{type:'SELECT_WEEKLY_FOCUS',focus:'world'});
  const weeklyCompleted=reducer(selected,{type:'COMPLETE_WEEKLY_FOCUS'});
  const longNight=resolveLongNightOutcome({campaign:'caretaker',outcome:'victory'});
  expect(longNight.accepted).toBe(true);
  if(!longNight.accepted) throw new Error('expected Long Night outcome');
  const outcome=commitLongNightOutcome({...weeklyCompleted.campaignRun,phase:'winter',activeCampaign:'caretaker',seasonMilestones:['autumn_resolved']},longNight);
  expect(outcome.committed).toBe(true);
  if(!outcome.committed) throw new Error('expected Long Night commit');
  const ending=resolveModularEnding({campaignResolution:'shared_guardianship',bondResolution:'mira_shared_future',worldResolution:'survived_together',careerResolution:'guardian_mentor'});
  expect(ending.accepted).toBe(true);
  if(!ending.accepted) throw new Error('expected modular ending');
  const committed=commitWinterEnding({...weeklyCompleted,campaignRun:outcome.state},ending.ending,{
    majorWorldOutcomes:['festival_saved'],
    keyBondMemories:[{characterId:'mira',memoryId:'mira_winter_victory'}],
    trueClues:['caretaker_life_anomaly'],
    truePathEvidence:['significant_fail_forward','sanctuary_history'],
  });
  expect(committed.committed).toBe(true);
  if(!committed.committed) throw new Error('expected Winter ending commit');
  return {
    ...weeklyCompleted,
    ...committed.state,
    gold:9999,
    stats:{...weeklyCompleted.stats,strength:99,magic:88,affection:77},
    weeklyLife:weeklyCompleted.weeklyLife,
  } as GameState;
}

describe('V4 Living Year NG+ and special-route compatibility',()=>{
  it('resets raw weekly/current-run power on NEW_RUN while inherited echoes can shape a new weekly event',()=>{
    const completed=completedCaretakerRunWithWeeklyState();
    expect(completed.weeklyLife.resolvedEventKeys.length).toBeGreaterThan(0);
    const spring=reducer(completed,{type:'NEW_RUN'});
    expect(spring.weeklyLife).toEqual(emptyWeeklyLifeState());
    expect(spring.stats).toEqual(initialState.stats);
    expect(spring.gold).toBe(initialState.gold);
    expect(spring.worldHistory.currentFacts).toEqual([]);
    expect(spring.worldHistory.inheritedFacts).toContain('festival_saved');
    expect(spring.campaignRun.runNumber).toBe(2);

    const selected=reducer(spring,{type:'SELECT_WEEKLY_FOCUS',focus:'season'});
    const resolved=reducer(selected,{type:'COMPLETE_WEEKLY_FOCUS'});
    expect(resolved.weeklyLife.lastEvent).toBe('old_echo');
    expect(resolved.stats.affection).toBe(spring.stats.affection+1);
  });

  it('interprets True and Hollow weekly atmosphere additively without mutating their campaign route state',()=>{
    const spring=reducer(completedCaretakerRunWithWeeklyState(),{type:'NEW_RUN'});
    const truePath={...spring,campaignRun:{...spring.campaignRun,activeCampaign:'true_path',activeRoute:'normal'}} as GameState;
    const trueSelected=reducer(truePath,{type:'SELECT_WEEKLY_FOCUS',focus:'training'});
    const trueResolved=reducer(trueSelected,{type:'COMPLETE_WEEKLY_FOCUS'});
    expect(trueResolved.weeklyLife.lastEvent).toBe('old_echo');
    expect(trueResolved.campaignRun).toEqual(truePath.campaignRun);

    const hollow={...spring,campaignRun:{...spring.campaignRun,activeCampaign:'arcanist',activeRoute:'hollow'}} as GameState;
    const hollowSelected=reducer(hollow,{type:'SELECT_WEEKLY_FOCUS',focus:'rest'});
    const hollowResolved=reducer(hollowSelected,{type:'COMPLETE_WEEKLY_FOCUS'});
    expect(hollowResolved.weeklyLife.lastEvent).toBe('rift_whisper');
    expect(hollowResolved.campaignRun).toEqual(hollow.campaignRun);
  });
});
