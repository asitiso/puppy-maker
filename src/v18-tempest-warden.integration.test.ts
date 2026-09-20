import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const boss=readFileSync(new URL('./adventure3d/tempest-warden.ts',import.meta.url),'utf8');
const slice=readFileSync(new URL('./adventure3d/AdventureVerticalSlice.tsx',import.meta.url),'utf8');
const persistence=readFileSync(new URL('./adventure3d/open-adventure-state.ts',import.meta.url),'utf8');
const routes=readFileSync(new URL('./adventure3d/windwalk-routes.ts',import.meta.url),'utf8');
const renderer=readFileSync(new URL('./adventure3d/software-renderer.ts',import.meta.url),'utf8');

describe('V18 Tempest Warden field miniboss loop',()=>{
  it('gates the miniboss behind restored Cloud Garden progress',()=>{
    expect(boss).toContain('createTempestWarden');
    expect(boss).toContain('if(!cloudGardenRestored||defeated)return null');
    expect(slice).toContain('persisted.cloudGarden.restored');
    expect(slice).toContain('persisted.tempestWarden.defeated');
  });

  it('uses existing combat mastery in phase one and becomes aerial in phase two',()=>{
    expect(boss).toContain("archetype:'guard'");
    expect(boss).toContain("archetype:'skimmer'");
    expect(boss).toContain('phaseTwoHp:75');
    expect(slice).toContain('advanceTempestWardenPhase');
    expect(slice).toContain('가드 파괴');
    expect(slice).toContain('공중 2페이즈');
  });

  it('offers wind pulse as an environmental punish for the aerial phase',()=>{
    expect(boss).toContain('disruptTempestWardenWithWind');
    expect(boss).toContain("mode:'stagger'");
    expect(boss).toContain('timer:1.15');
    expect(slice).toContain("ability==='windPulse'");
    expect(slice).toContain('비행 기류를 무너뜨렸습니다');
  });

  it('persists only defeat and derives the permanent launch-current reward from it',()=>{
    expect(persistence).toContain("type:'defeat-tempest-warden'");
    expect(persistence).toContain('tempestWarden:{defeated:false}');
    expect(persistence).not.toContain('tempestWardenHp');
    expect(persistence).not.toContain('tempestWardenPhase');
    expect(routes).toContain("stormLaunch:{id:'storm-launch'");
    expect(slice).toContain('tempestWardenDefeatedRef.current');
  });

  it('renders the miniboss as a distinct threat rather than a resized normal enemy only',()=>{
    expect(renderer).toContain('isTempestWarden(enemy)');
    expect(renderer).toContain('폭풍갑주 감시자');
    expect(renderer).toContain("enemy.archetype==='skimmer'?'rgba(171,231,246,.72)'");
  });
});
