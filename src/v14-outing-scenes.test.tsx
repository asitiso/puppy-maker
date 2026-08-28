import {describe,expect,it} from 'vitest';
import {outingScene} from './scene/outing-scenes';

describe('V14 outing scenes',()=>{
  it('keeps the forest trace visible and tappable while resolving deterministic presentation',()=>{
    const input={year:1,month:4,week:2} as const;
    const first=outingScene('forest',input);
    const second=outingScene('forest',input);
    expect(first).toEqual(second);
    expect(first.interactions.find(item=>item.id==='trace')).toMatchObject({enabled:true,mode:'explore'});
  });

  it('changes seasonal presentation at a calendar boundary without changing the location contract',()=>{
    const spring=outingScene('village',{year:1,month:5,week:4});
    const summer=outingScene('village',{year:1,month:6,week:1});
    expect(spring.location).toBe('village');
    expect(summer.location).toBe('village');
    expect(spring.season).not.toBe(summer.season);
  });

  it('uses companion and bond data only as presentation input',()=>{
    const scene=outingScene('lakeside',{year:1,month:4,week:2,actorState:{bondByActor:{bear:80}}});
    expect(JSON.stringify(scene)).not.toMatch(/bondReward|affectionGain|rewardAmount|statDelta/);
  });
});
