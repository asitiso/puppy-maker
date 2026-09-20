import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const combat=readFileSync(new URL('./adventure3d/combat-system.ts',import.meta.url),'utf8');
const enemy=readFileSync(new URL('./adventure3d/enemy-ai.ts',import.meta.url),'utf8');
const slice=readFileSync(new URL('./adventure3d/AdventureVerticalSlice.tsx',import.meta.url),'utf8');
const renderer=readFileSync(new URL('./adventure3d/software-renderer.ts',import.meta.url),'utf8');
const persistence=readFileSync(new URL('./adventure3d/open-adventure-state.ts',import.meta.url),'utf8');

describe('V18 perfect-dodge counter and guard-break combat loop',()=>{
  it('turns early dodge timing into a short one-attack counter window',()=>{
    expect(combat).toContain('PLAYER_PERFECT_DODGE_END=.14');
    expect(combat).toContain('PLAYER_COUNTER_WINDOW=.85');
    expect(combat).toContain('resolveEnemyAttack');
    expect(combat).toContain('counterAttackSerial');
    expect(slice).toContain('resolveEnemyAttack(combat,result.attack.damage)');
    expect(slice).toContain("완벽 회피 · 반격 기회!");
  });

  it('uses the counter on the next attack instead of adding a separate combat button',()=>{
    expect(combat).toContain('playerAttackIsCounter');
    expect(combat).toContain('playerAttackDamage');
    expect(slice).toContain("{counter:counterAttack}");
    expect(slice).toContain("{counterReady?'반격':'공격'}");
    expect(slice).not.toContain('KeyH');
  });

  it('makes guards resist normal attacks and collapse under a counter',()=>{
    expect(enemy).toContain("enemy.archetype==='guard'&&!counter");
    expect(enemy).toContain("guardBroken=enemy.archetype==='guard'&&counter");
    expect(enemy).toContain('baseDamage*.55');
    expect(enemy).toContain('?.82');
    expect(slice).toContain('result.guardBroken');
    expect(slice).toContain('가드 파괴');
  });

  it('shows both readable shield identity and counter feedback in the renderer',()=>{
    expect(renderer).toContain("if(enemy.archetype==='guard')");
    expect(renderer).toContain('combat.counterWindow>0');
    expect(renderer).toContain('combat.perfectDodgeFlash>0');
    expect(renderer).toContain('combat.attackSerial===combat.counterAttackSerial');
  });

  it('keeps combat mastery transient rather than bloating adventure saves',()=>{
    expect(persistence).not.toContain('counterWindow');
    expect(persistence).not.toContain('perfectDodge');
    expect(persistence).not.toContain('guardBroken');
  });
});
