import {describe,expect,it} from 'vitest';
import {resolveScene} from './scene/scene-resolver';

describe('V14 world consequence and NG+ presentation',()=>{
  it('keeps current world facts as presentation-only visual layers',()=>{
    const scene=resolveScene({year:1,month:4,week:2,location:'village',worldFacts:['festival_saved','regional_alliance']});
    expect(scene.backgroundLayers.map(layer=>layer.token)).toEqual(expect.arrayContaining([
      'world-fact:festival_saved','world-fact:regional_alliance',
    ]));
    expect(JSON.stringify(scene.backgroundLayers)).not.toMatch(/gold|gems|rewardAmount|statDelta/);
  });

  it('renders inherited world facts as distinct echoes instead of current-run facts',()=>{
    const scene=resolveScene({year:2,month:4,week:2,location:'forest',inheritedWorldFacts:['ancient_route_opened']});
    expect(scene.backgroundLayers.map(layer=>layer.token)).toContain('inherited-world-fact:ancient_route_opened');
    expect(scene.presentationTags).toContain('inherited-world-fact:ancient_route_opened');
    expect(scene.backgroundLayers.map(layer=>layer.token)).not.toContain('world-fact:ancient_route_opened');
  });

  it('uses existing companion bond only as scene presentation input',()=>{
    const scene=resolveScene({year:2,month:4,week:2,location:'lakeside',actorState:{bondByActor:{bear:80,owl:0}}});
    expect(scene.backgroundLayers.map(layer=>layer.token)).toContain('bond:bear:80');
    expect(scene.presentationTags).toContain('bond:bear:80');
    expect(scene.backgroundLayers.map(layer=>layer.token)).not.toContain('bond:owl:0');
    expect(JSON.stringify(scene)).not.toMatch(/bondReward|affectionGain|rewardAmount/);
  });
});
