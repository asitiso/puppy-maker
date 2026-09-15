import {describe,expect,it} from 'vitest';
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

  it('exposes one physical portal for every outing destination',()=>{
    const portals=outingCrossroadsWorld.interactables.filter(item=>item.kind==='portal');
    expect(portals).toHaveLength(3);
    expect(new Set(portals.map(item=>item.destinationId))).toEqual(new Set(['forest','village','lakeside']));
    for(const portal of portals){
      expect(portal.artSrc).toMatch(/^\/assets\/exploration\/crossroads\/.+\.svg$/);
      expect(portal.radius).toBeGreaterThanOrEqual(100);
    }
  });

  it('keeps an explicit in-world route back home instead of a destination menu',()=>{
    const exit=outingCrossroadsWorld.interactables.find(item=>item.kind==='exit');
    expect(exit?.label).toBe('집으로 돌아가기');
  });
});
