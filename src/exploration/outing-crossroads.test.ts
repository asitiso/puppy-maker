import {existsSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {REGION_IDS} from './region-registry';
import {outingCrossroadsWorld} from './outing-crossroads';

describe('outing crossroads world contract',()=>{
  it('is a materially larger walkable world with a safe start point',()=>{
    expect(outingCrossroadsWorld.width).toBeGreaterThanOrEqual(2000);
    expect(outingCrossroadsWorld.height).toBeGreaterThanOrEqual(1400);
    expect(outingCrossroadsWorld.start.x).toBeGreaterThan(0);
    expect(outingCrossroadsWorld.start.x).toBeLessThan(outingCrossroadsWorld.width);
    expect(outingCrossroadsWorld.start.y).toBeGreaterThan(0);
    expect(outingCrossroadsWorld.start.y).toBeLessThan(outingCrossroadsWorld.height);
    expect(outingCrossroadsWorld.obstacles.length).toBeGreaterThan(0);
  });

  it('exposes one physical portal for every canonical V16 region',()=>{
    const portals=outingCrossroadsWorld.interactables.filter(item=>item.kind==='portal');
    expect(portals).toHaveLength(REGION_IDS.length);
    expect(new Set(portals.map(item=>item.destinationId))).toEqual(new Set(REGION_IDS));
    for(const portal of portals){
      expect(portal.artSrc).toMatch(/^\/assets\/exploration\/crossroads\/.+\.svg$/);
      expect(portal.radius).toBeGreaterThanOrEqual(100);
      expect(existsSync(new URL(`../../public${portal.artSrc}`,import.meta.url))).toBe(true);
    }
  });

  it('keeps six destinations spatially readable instead of stacking portal hit areas',()=>{
    const portals=outingCrossroadsWorld.interactables.filter(item=>item.kind==='portal');
    for(let leftIndex=0;leftIndex<portals.length;leftIndex+=1){
      for(let rightIndex=leftIndex+1;rightIndex<portals.length;rightIndex+=1){
        const left=portals[leftIndex];
        const right=portals[rightIndex];
        const distance=Math.hypot(left.position.x-right.position.x,left.position.y-right.position.y);
        expect(distance).toBeGreaterThan(left.radius+right.radius+80);
      }
    }
  });

  it('keeps an explicit in-world route back home instead of a destination menu',()=>{
    const exit=outingCrossroadsWorld.interactables.find(item=>item.kind==='exit');
    expect(exit?.label).toBe('집으로 돌아가기');
  });
});
