// @ts-ignore -- source-contract test uses Node fs outside app tsconfig.
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const slice=readFileSync(new URL('./adventure3d/AdventureVerticalSlice.tsx',import.meta.url),'utf8');
const renderer=readFileSync(new URL('./adventure3d/software-renderer.ts',import.meta.url),'utf8');

describe('V18 environment magic combat integration',()=>{
  it('keeps environment abilities usable during live combat',()=>{
    expect(slice).toContain('castFieldEnvironmentAbility');
    expect(slice).toContain('applyBurningHazardsToEnemies');
    expect(slice).toContain('(nearPuzzle||nearHazard)&&!defeated');
    const castBlock=slice.slice(slice.indexOf('const castEnvironmentAbility='),slice.indexOf('const interactWorld='));
    expect(castBlock).toContain('if(combatRef.current.hp<=0)return');
    expect(castBlock).not.toContain('inCombat||');
  });

  it('feeds field hazards through the same exploration renderer and enemy list',()=>{
    expect(slice).toContain('hazardsRef.current');
    expect(slice).toContain('stepFieldHazards');
    expect(renderer).toContain('drawFieldHazards');
    expect(renderer).toContain('hazard.burning');
  });

  it('uses a reaction chain rather than direct magic damage buttons',()=>{
    expect(slice).toContain("castEnvironmentAbility('emberSpark')");
    expect(slice).toContain("castEnvironmentAbility('windPulse')");
    expect(slice).toContain('마른 풀이 불붙었습니다');
    expect(slice).toContain('바람이 불길을 다음 마른 풀 지대로 퍼뜨렸습니다');
    expect(slice).not.toMatch(/emberDamage|windDamage|magicDamageButton/);
  });
});
