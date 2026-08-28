import {describe,expect,it} from 'vitest';
import {STORY_EVENTS} from './game/events';
import {storySceneForEvent,STORY_SCENE_LOCATIONS} from './scene/story-scenes';

describe('V14 story scenes',()=>{
  it('maps every current STORY_EVENTS definition into a living scene',()=>{
    expect(Object.keys(STORY_SCENE_LOCATIONS).sort()).toEqual(STORY_EVENTS.map(event=>event.id).sort());
    for(const event of STORY_EVENTS){
      const scene=storySceneForEvent(event.id,{year:1,month:4,week:2});
      expect(scene.beats.some(beat=>beat.type==='dialogue')).toBe(true);
      const choiceIds=event.choices.map(choice=>choice.id);
      const interactionChoices=scene.interactions.map(item=>item.intent?.choiceId).filter(Boolean);
      expect(interactionChoices).toEqual(expect.arrayContaining(choiceIds));
    }
  });

  it('keeps story choice presentation free of durable reward/stat data',()=>{
    const scene=storySceneForEvent('lost_bird',{year:1,month:4,week:2});
    expect(JSON.stringify(scene)).not.toMatch(/statDelta|goldDelta|personalityDelta|rewardAmount/);
  });
});
