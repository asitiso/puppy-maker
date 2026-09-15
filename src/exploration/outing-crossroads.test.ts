import {describe,expect,it} from 'vitest';
import {REGION_IDS,getRegionDefinition} from './region-registry';
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

  it('exposes one physical portal for every canonical V16 region in registry order',()=>{
    const portals=outingCrossroadsWorld.interactables.filter(item=>item.kind==='portal');
    expect(portals).toHaveLength(REGION_IDS.length);
    expect(portals.map(item=>item.destinationId)).toEqual([...REGION_IDS]);
  });

  it('materializes every portal from the authoritative registry metadata',()=>{
    const portals=outingCrossroadsWorld.interactables.filter(item=>item.kind==='portal');
    for(const id of REGION_IDS){
      const expected=getRegionDefinition(id).crossroads;
      const portal=portals.find(item=>item.destinationId===id);
      expect(portal).toMatchObject({
        id:expected.interactionId,
        label:expected.label,
        kind:'portal',
        destinationId:id,
        position:expected.position,
        radius:expected.radius,
        artSrc:expected.artSrc,
      });
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
