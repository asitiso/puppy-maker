import {describe,expect,it} from 'vitest';
import {storySceneForEvent} from './story-scenes';

describe('V14 deep Story choreography',()=>{
  it('stages a directed move, pose, highlight, dialogue and canonical choice interaction',()=>{
    const scene=storySceneForEvent('lost_bird',{year:1,month:4,week:2});
    const beatTypes=scene.beats.map(beat=>beat.type);
    expect(beatTypes).toEqual(expect.arrayContaining(['move','pose','effect','dialogue','interaction']));
    const choices=scene.interactions.filter(item=>item.intent?.eventId==='lost_bird');
    expect(choices.length).toBeGreaterThanOrEqual(2);
    expect(choices.every(item=>item.required&&item.enabled)).toBe(true);
  });

  it('locks unrelated scene objects while a required Story choice is active',()=>{
    const scene=storySceneForEvent('starlight_market',{year:1,month:7,week:1});
    const choices=new Set(scene.interactions.filter(item=>item.intent?.eventId==='starlight_market').map(item=>item.id));
    expect(scene.interactions.filter(item=>!choices.has(item.id)).every(item=>!item.enabled)).toBe(true);
  });
});
