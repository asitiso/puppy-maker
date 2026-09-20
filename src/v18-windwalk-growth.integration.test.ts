import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {startingFieldHeight} from './adventure3d/starting-field';
import {skybreakReturnToSkywatch} from './adventure3d/skybreak-highland';

const windwalk=readFileSync(new URL('./adventure3d/windwalk.ts',import.meta.url),'utf8');
const slice=readFileSync(new URL('./adventure3d/AdventureVerticalSlice.tsx',import.meta.url),'utf8');
const persistence=readFileSync(new URL('./adventure3d/open-adventure-state.ts',import.meta.url),'utf8');

describe('V18 Windwalk growth loop integration',()=>{
  it('derives Windwalk from the already-persistent Skybreak beacon instead of duplicating save state',()=>{
    expect(slice).toContain('windwalkUnlocked(persisted.skybreak.beaconReached)');
    expect(slice).toContain("requestOpenAdventureUpdate({type:'reach-skybreak-beacon'})");
    expect(slice).toContain('windwalkUnlockedRef.current=true');
    expect(persistence).not.toContain('windwalkUnlocked');
    expect(persistence).not.toContain('windwalkActive');
  });

  it('uses held jump input on desktop and mobile to transition from jump into glide',()=>{
    expect(slice).toContain("if(event.code==='Space'){");
    expect(slice).toContain('glideHeldRef.current=true');
    expect(slice).toContain("if(event.code==='Space')glideHeldRef.current=false");
    expect(slice).toContain(">{windwalkUnlockedState?'점프/활강':'점프'}</button>");
    expect(slice).toContain('applyWindwalkGlide(');
  });

  it('makes the Skywatch wind lift double as an immediate high-ground Windwalk tutorial',()=>{
    const returnPoint=skybreakReturnToSkywatch();
    expect(returnPoint.y).toBeGreaterThan(startingFieldHeight(0,0)+4);
    expect(slice).toContain('여기서 뛰어내려 Space를 유지하면 새로 익힌 바람걸음');
  });

  it('limits the growth ability through falling state, speed cap and stamina drain',()=>{
    expect(windwalk).toContain("fallSpeed:-3.2");
    expect(windwalk).toContain('maxPlanarSpeed:7.2');
    expect(windwalk).toContain('staminaPerSecond:20');
    expect(windwalk).toContain('!state.grounded');
    expect(windwalk).toContain('WINDWALK.staminaPerSecond');
    expect(windwalk).toContain('WINDWALK.masteredStaminaPerSecond');
  });
});
