import {describe,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import OutingSceneFlow from './OutingSceneFlow';
import {outingTargets} from './outing-scenes';

describe('V14 target-driven outing scenes',()=>{
  it('exposes distinct visible targets for all three canonical outing locations',()=>{
    expect(outingTargets('forest').map(item=>item.interactionId)).toEqual(['trace','tree','herb','path']);
    expect(outingTargets('village').map(item=>item.interactionId)).toEqual(['square','shop','performance','repair','alley']);
    expect(outingTargets('lakeside').map(item=>item.interactionId)).toEqual(['water','fish','rest','wind-crystal']);
  });

  it('renders the resolved place through SceneStage while keeping one canonical outing callback',()=>{
    const html=renderToStaticMarkup(<OutingSceneFlow location="forest" year={1} month={4} week={2} onOuting={vi.fn()}/>);
    expect(html).toContain('v14-outing-scene-flow');
    expect(html).toContain('data-location="forest"');
    expect(html).toContain('data-interaction-id="trace"');
    expect(html).not.toMatch(/goldReward|statDelta|rewardAmount|discoveryReward/);
  });
});
