// @ts-ignore -- source-contract test uses Node fs outside app tsconfig.
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const slice=readFileSync(new URL('./adventure3d/AdventureVerticalSlice.tsx',import.meta.url),'utf8');
const renderer=readFileSync(new URL('./adventure3d/software-renderer.ts',import.meta.url),'utf8');

describe('V18 realtime combat field integration',()=>{
  it('keeps combat inside the same exploration runtime',()=>{
    expect(slice).toContain('stepEnemyAi');
    expect(slice).toContain('tryStartPlayerAttack');
    expect(slice).toContain('tryStartPlayerDodge');
    expect(slice).toContain('renderAdventureField');
    expect(slice).not.toContain('TacticalBattleScreen');
    expect(slice).not.toContain('OPEN_PLAY');
  });

  it('exposes direct attack and dodge controls with contextual combat HUD',()=>{
    expect(slice).toContain("event.code==='KeyJ'");
    expect(slice).toContain("event.code==='KeyK'");
    expect(slice).toContain("{counterReady?'반격':'공격'}</button>");
    expect(slice).toContain('>회피</button>');
    expect(slice).toContain("combatEngaged?'COMBAT':'OPEN ADVENTURE'") || expect(slice).toContain("combatEngaged?'COMBAT'");
  });

  it('renders readable enemy telegraphs and hit feedback instead of hidden dice rolls',()=>{
    expect(renderer).toContain("enemy.mode==='windup'");
    expect(renderer).toContain("ctx.ellipse");
    expect(renderer).toContain("enemy.mode==='stagger'");
    expect(renderer).toContain('drawCombatEffects');
  });
});
