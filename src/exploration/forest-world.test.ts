import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {forestStoryFrames,forestWorld} from './forest-world';

const asset=(name:string)=>readFileSync(new URL(`../../public/assets/exploration/forest/${name}`,import.meta.url),'utf8');

describe('forest mobile RPG world',()=>{
  it('is materially larger than a phone viewport and starts inside valid world space',()=>{
    expect(forestWorld.width).toBeGreaterThanOrEqual(2000);
    expect(forestWorld.height).toBeGreaterThanOrEqual(1200);
    expect(forestWorld.start.x).toBeGreaterThan(forestWorld.playerRadius);
    expect(forestWorld.start.y).toBeGreaterThan(forestWorld.playerRadius);
    expect(forestWorld.start.x).toBeLessThan(forestWorld.width-forestWorld.playerRadius);
    expect(forestWorld.start.y).toBeLessThan(forestWorld.height-forestWorld.playerRadius);
    expect(forestWorld.obstacles.length).toBeGreaterThanOrEqual(8);
  });

  it('contains a discoverable clue chain, optional discovery, and exit interaction',()=>{
    const byId=new Map(forestWorld.interactables.map(item=>[item.id,item]));
    expect(byId.get('ancient-tree')).toMatchObject({kind:'story',storyFrameId:'forest-tree'});
    expect(byId.get('glowing-tracks')).toMatchObject({kind:'story',storyFrameId:'forest-tracks',requiresCompleted:['ancient-tree']});
    expect(byId.get('forest-exit')).toMatchObject({kind:'exit'});
    expect(forestStoryFrames['forest-tracks'].progression).toBe(true);
    expect(forestStoryFrames['forest-tree'].progression).toBe(false);
  });

  it('ships a coherent original vector art set for world, player, clues, and story frame',()=>{
    for(const file of ['forest-ground.svg','forest-trees.svg','glowing-tracks.svg','ancient-tree.svg','runa-topdown.svg','story-tracks.svg','story-frame.svg']){
      const svg=asset(file);
      expect(svg).toContain('<svg');
      expect(svg).toContain('viewBox=');
      expect(svg.length).toBeGreaterThan(300);
    }
  });
});
