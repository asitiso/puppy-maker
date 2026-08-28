import {describe,expect,it} from 'vitest';
import {trainingLocationForActivity,trainingSceneForActivity} from './scene/training-scenes';

describe('V14 training scenes',()=>{
  it('maps canonical raising activities onto the three playable training spaces',()=>{
    expect(trainingLocationForActivity('hunt')).toBe('training_ground');
    expect(trainingLocationForActivity('magic')).toBe('magic_classroom');
    expect(trainingLocationForActivity('herb')).toBe('herb_garden');
    expect(trainingLocationForActivity('rest')).toBe('home');
  });

  it('resolves location-specific objects without owning rewards or stat deltas',()=>{
    const hunt=trainingSceneForActivity('hunt',{year:1,month:4,week:2});
    const magic=trainingSceneForActivity('magic',{year:1,month:4,week:2});
    const herb=trainingSceneForActivity('herb',{year:1,month:4,week:2});
    expect(hunt.interactions.map(item=>item.id)).toEqual(expect.arrayContaining(['dummy','rack','exit']));
    expect(magic.interactions.map(item=>item.id)).toEqual(expect.arrayContaining(['circle','books','practice_target','exit']));
    expect(herb.interactions.map(item=>item.id)).toEqual(expect.arrayContaining(['herb_patch','workbench','exit']));
    expect(JSON.stringify([hunt,magic,herb])).not.toMatch(/goldReward|masteryGain|statDelta|rewardAmount/);
  });
});
