import {describe,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import OutingSceneFlow from './OutingSceneFlow';
import {outingTargets} from './outing-scenes';

describe('mobile RPG outing transition',()=>{
  it('keeps the canonical authored target data available for every outing location',()=>{
    expect(outingTargets('forest').map(item=>item.interactionId)).toEqual(['trace','tree','herb','path']);
    expect(outingTargets('village').map(item=>item.interactionId)).toEqual(['square','shop','performance','repair','alley']);
    expect(outingTargets('lakeside').map(item=>item.interactionId)).toEqual(['water','fish','rest','wind-crystal']);
  });

  it('routes every outing into direct-movement mobile RPG exploration with its first discoverable clue',()=>{
    for(const [location,label,clue] of [
      ['forest','별빛 숲','오래된 나무'],
      ['village','마법 마을','광장'],
      ['lakeside','바람 호숫가','물가'],
    ] as const){
      const html=renderToStaticMarkup(<OutingSceneFlow location={location} year={1} month={4} week={2} onOuting={vi.fn()} onExit={vi.fn()}/>);
      expect(html).toContain('mobile-exploration');
      expect(html).toContain(label);
      expect(html).toContain(clue);
      expect(html).toContain('runa-topdown.svg');
      expect(html).not.toContain('v14-outing-scene-flow');
    }
  });
});
