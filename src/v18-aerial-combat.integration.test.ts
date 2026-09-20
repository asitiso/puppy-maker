import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const enemy=readFileSync(new URL('./adventure3d/enemy-ai.ts',import.meta.url),'utf8');
const combat=readFileSync(new URL('./adventure3d/combat-system.ts',import.meta.url),'utf8');
const hunters=readFileSync(new URL('./adventure3d/wind-hunters.ts',import.meta.url),'utf8');
const slice=readFileSync(new URL('./adventure3d/AdventureVerticalSlice.tsx',import.meta.url),'utf8');
const renderer=readFileSync(new URL('./adventure3d/software-renderer.ts',import.meta.url),'utf8');
const persistence=readFileSync(new URL('./adventure3d/open-adventure-state.ts',import.meta.url),'utf8');

describe('V18 Windwalk aerial combat integration',()=>{
  it('spawns transient Dawnreach aerial hunters only after Windwalk unlock',()=>{
    expect(hunters).toContain('createDawnreachWindHunters');
    expect(hunters).toContain("if(!unlocked)return []");
    expect(slice).toContain('mergeDawnreachWindHunters(');
    expect(slice).toContain('persisted.skybreak.beaconReached');
    expect(persistence).not.toContain('gale-wing-skywatch');
  });

  it('keeps aerial enemies above ground until a telegraphed dive opens a counter opportunity',()=>{
    expect(enemy).toContain("EnemyArchetype='rusher'|'guard'|'skimmer'");
    expect(enemy).toContain('SKIMMER_HOVER_HEIGHT');
    expect(enemy).toContain('SKIMMER_DIVE_HEIGHT');
    expect(enemy).toContain("next.mode==='windup'||next.mode==='recover'");
    expect(combat).toContain('PLAYER_ATTACK_VERTICAL_REACH');
    expect(slice).toContain('resolveEnemyAttack(combat,result.attack.damage)');
  });

  it('lets Windwalk altitude create direct aerial melee instead of ground auto-hits',()=>{
    expect(combat).toContain('Math.abs(dy)>PLAYER_ATTACK_VERTICAL_REACH');
    expect(slice).toContain('applyWindwalkGlide(');
    expect(slice).toContain('playerAttackConnects(');
  });

  it('makes the flying threat readable through shadows wings and dive cues',()=>{
    expect(renderer).toContain("enemy.archetype==='skimmer'");
    expect(renderer).toContain('startingFieldHeight(enemy.position.x,enemy.position.z)');
    expect(renderer).toContain("?'▼':'!'");
  });

  it('keeps fire grounded so hovering hunters are not damaged by planar overlap alone',()=>{
    const environment=readFileSync(new URL('./adventure3d/environment-combat.ts',import.meta.url),'utf8');
    expect(environment).toContain('Math.abs(enemy.position.y-item.position.y)<=2.4');
  });
});
