import {describe,expect,it} from 'vitest';
import {expeditionSceneForCheckpoint} from './scene/expedition-scenes';

describe('V14 expedition tactical scene bridge',()=>{
  it('renders every semantic expedition node in the field scene',()=>{
    const scene=expeditionSceneForCheckpoint(null,{year:1,month:4,week:2});
    expect(scene.interactions.map(item=>item.id)).toEqual(expect.arrayContaining(['camp','path','crossroads','ruin','rift','treasure','encounter','return']));
  });

  it('marks the persisted semantic node as the required interaction without storing coordinates',()=>{
    const checkpoint={activity:'expedition',activityId:'ancient_city',phase:'node',step:'ruin'} as const;
    const scene=expeditionSceneForCheckpoint(checkpoint,{year:1,month:4,week:2});
    expect(scene.interactions.find(item=>item.id==='ruin')?.hint).toBe('required');
    expect(JSON.stringify(checkpoint)).not.toMatch(/\"x\"|\"y\"|frame|camera/i);
  });
});
