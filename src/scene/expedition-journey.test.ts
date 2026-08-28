import {describe,expect,it} from 'vitest';
import {companionExpeditionHint,expeditionJourneyNodes,expeditionSceneForCheckpoint} from './expedition-scenes';
import type {ExpeditionActivityCheckpoint} from './activity-checkpoint';

describe('V14 deep Guardian Expedition journey',()=>{
  it('uses the semantic eight-stop field journey in canonical order',()=>{
    expect(expeditionJourneyNodes()).toEqual(['camp','path','crossroads','ruin','rift','treasure','encounter','return']);
  });

  it('gives identity-specific non-blocking companion hints',()=>{
    expect(companionExpeditionHint('bear','encounter')).toMatch(/방어|막/);
    expect(companionExpeditionHint('owl','ruin')).toMatch(/조사|기록|문양/);
    expect(companionExpeditionHint('wolf','crossroads')).toMatch(/길|흔적|적/);
    expect(companionExpeditionHint('cat','treasure')).toMatch(/숨|보물|틈/);
  });

  it('keeps only the current semantic node required while companion hints remain presentation-only',()=>{
    const checkpoint:ExpeditionActivityCheckpoint={activity:'expedition',activityId:'guardian',phase:'node',step:'crossroads'};
    const scene=expeditionSceneForCheckpoint(checkpoint,{year:1,month:8,week:3,companions:['wolf','cat']});
    expect(scene.interactions.find(item=>item.id==='crossroads')?.required).toBe(true);
    expect(scene.presentationTags).toEqual(expect.arrayContaining(['companion:wolf','companion:cat']));
    expect(JSON.stringify(scene)).not.toMatch(/bondGain|goldReward|statDelta|rewardAmount/);
  });
});
