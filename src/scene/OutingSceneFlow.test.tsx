import {describe,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import OutingSceneFlow from './OutingSceneFlow';
import {outingTargets} from './outing-scenes';

describe('mobile RPG outing transition',()=>{
  it('keeps the canonical authored target data available for all legacy locations',()=>{
    expect(outingTargets('forest').map(item=>item.interactionId)).toEqual(['trace','tree','herb','path']);
    expect(outingTargets('village').map(item=>item.interactionId)).toEqual(['square','shop','performance','repair','alley']);
    expect(outingTargets('lakeside').map(item=>item.interactionId)).toEqual(['water','fish','rest','wind-crystal']);
  });

  it('routes forest into the new direct-movement mobile RPG scene',()=>{
    const html=renderToStaticMarkup(<OutingSceneFlow location="forest" year={1} month={4} week={2} onOuting={vi.fn()} onExit={vi.fn()}/>);
    expect(html).toContain('mobile-exploration');
    expect(html).toContain('별빛 숲');
    expect(html).toContain('빛나는 흔적');
    expect(html).toContain('runa-topdown.svg');
    expect(html).not.toContain('v14-outing-scene-flow');
  });

  it('preserves SceneStage for village and lakeside while the RPG foundation rolls out safely',()=>{
    for(const location of ['village','lakeside'] as const){
      const html=renderToStaticMarkup(<OutingSceneFlow location={location} year={1} month={4} week={2} onOuting={vi.fn()}/>);
      expect(html).toContain('v14-outing-scene-flow');
      expect(html).toContain(`data-location="${location}"`);
      expect(html).not.toMatch(/goldReward|statDelta|rewardAmount|discoveryReward/);
    }
  });
});
