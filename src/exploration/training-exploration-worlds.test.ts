import {describe,expect,it} from 'vitest';
import {nearestInteractable} from './exploration-runtime';
import {TRAINING_BEGIN_DESTINATION,trainingExplorationWorld} from './training-exploration-worlds';

describe('walkable training instance worlds',()=>{
  it('gives hunt, magic and herb distinct playable spaces and objectives',()=>{
    const hunt=trainingExplorationWorld('hunt');
    const magic=trainingExplorationWorld('magic');
    const herb=trainingExplorationWorld('herb');
    expect(new Set([hunt.id,magic.id,herb.id]).size).toBe(3);
    expect(new Set([hunt.layers[0].src,magic.layers[0].src,herb.layers[0].src]).size).toBe(3);
    expect(hunt.label).toContain('훈련장');
    expect(magic.label).toContain('마법');
    expect(herb.label).toContain('약초');
  });

  it('starts each instance away from the practice target so movement is required',()=>{
    for(const activity of ['hunt','magic','herb'] as const){
      const world=trainingExplorationWorld(activity);
      expect(nearestInteractable(world.start,world.interactables),activity).toBeNull();
      expect(world.interactables).toHaveLength(1);
      expect(world.interactables[0].kind).toBe('portal');
      expect(world.interactables[0].destinationId).toBe(TRAINING_BEGIN_DESTINATION);
      expect(world.interactables[0].position.x).toBeGreaterThan(world.start.x);
    }
  });

  it('keeps progression and reward ownership outside the exploration presentation',()=>{
    const serialized=JSON.stringify([
      trainingExplorationWorld('hunt'),
      trainingExplorationWorld('magic'),
      trainingExplorationWorld('herb'),
    ]);
    expect(serialized).not.toMatch(/goldReward|masteryGain|statDelta|rewardAmount/);
  });
});
