import {describe,expect,it} from 'vitest';
import {primaryTrainingInteraction,sceneLocationForTraining,trainingSceneForActivity} from './training-scenes';

describe('V14 deep training scene mappings',()=>{
  it('maps every playable scheduled training activity to a distinct Scene location',()=>{
    expect(sceneLocationForTraining('hunt')).toBe('training_ground');
    expect(sceneLocationForTraining('magic')).toBe('magic_classroom');
    expect(sceneLocationForTraining('herb')).toBe('herb_garden');
  });

  it('names one canonical primary interaction that exists in each resolved Scene',()=>{
    const expected={hunt:'dummy',magic:'circle',herb:'workbench'} as const;
    for(const activity of ['hunt','magic','herb'] as const){
      expect(primaryTrainingInteraction(activity)).toBe(expected[activity]);
      const scene=trainingSceneForActivity(activity,{year:1,month:4,week:2});
      expect(scene.interactions.some(item=>item.id===primaryTrainingInteraction(activity))).toBe(true);
    }
  });
});
