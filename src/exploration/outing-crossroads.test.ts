import {describe,expect,it} from 'vitest';
import {REGION_IDS,getRegionDefinition} from './region-registry';
import * as crossroads from './outing-crossroads';

const {outingCrossroadsWorld}=crossroads;
type ReturnWorldFactory=(regionId:typeof REGION_IDS[number]|null)=>typeof outingCrossroadsWorld;
const returnWorldFactory=(crossroads as typeof crossroads&{outingCrossroadsWorldForReturn?:ReturnWorldFactory}).outingCrossroadsWorldForReturn;

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

  it('returns from each region near its own portal without spawning inside the portal or an obstacle',()=>{
    expect(returnWorldFactory).toBeTypeOf('function');
    expect(returnWorldFactory?.(null)).toBe(outingCrossroadsWorld);

    for(const id of REGION_IDS){
      const world=returnWorldFactory!(id);
      const portal=getRegionDefinition(id).crossroads;
      const distance=Math.hypot(world.start.x-portal.position.x,world.start.y-portal.position.y);
      const baseDistance=Math.hypot(
        outingCrossroadsWorld.start.x-portal.position.x,
        outingCrossroadsWorld.start.y-portal.position.y,
      );

      expect(distance).toBeGreaterThan(portal.radius+world.playerRadius+20);
      expect(distance).toBeLessThan(baseDistance);
      expect(world.start.x).toBeGreaterThanOrEqual(world.playerRadius);
      expect(world.start.x).toBeLessThanOrEqual(world.width-world.playerRadius);
      expect(world.start.y).toBeGreaterThanOrEqual(world.playerRadius);
      expect(world.start.y).toBeLessThanOrEqual(world.height-world.playerRadius);

      for(const obstacle of world.obstacles){
        const insideExpandedObstacle=
          world.start.x>=obstacle.x-world.playerRadius&&
          world.start.x<=obstacle.x+obstacle.width+world.playerRadius&&
          world.start.y>=obstacle.y-world.playerRadius&&
          world.start.y<=obstacle.y+obstacle.height+world.playerRadius;
        expect(insideExpandedObstacle,`${id} return start overlaps ${obstacle.id}`).toBe(false);
      }
    }
  });
});
