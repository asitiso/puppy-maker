// @ts-ignore -- source-contract test uses Node fs outside app tsconfig.
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const slice=readFileSync(new URL('./adventure3d/AdventureVerticalSlice.tsx',import.meta.url),'utf8');
const ai=readFileSync(new URL('./adventure3d/enemy-ai.ts',import.meta.url),'utf8');
const environment=readFileSync(new URL('./adventure3d/environment-combat.ts',import.meta.url),'utf8');

describe('V18 hazard-aware combat integration',()=>{
  it('feeds burning terrain into enemy steering instead of damage-only reactions',()=>{
    expect(slice).toContain('burningHazardAvoidanceZones');
    expect(slice).toContain('const avoidanceZones=');
    expect(slice).toContain('stepEnemyAi(');
    expect(slice).toContain('avoidanceZones');
    expect(ai).toContain('EnemyAvoidanceZone');
    expect(ai).toContain('avoidanceZones:readonly EnemyAvoidanceZone[]=[]');
  });

  it('makes fire symmetric world danger while preserving dodge skill expression',()=>{
    expect(slice).toContain('applyBurningHazardsToPlayer');
    expect(slice).toContain('불길 안에 오래 머물러 화상을 입었습니다');
    expect(environment).toContain('return applyPlayerDamage(combat,6)');
    expect(environment).toContain('burningHazardAvoidanceZones');
  });

  it('keeps hazards generic enough for future poison ice or collapse zones',()=>{
    expect(ai).not.toContain('FieldHazardState');
    expect(ai).not.toContain('dryGrass');
    expect(ai).not.toContain('burning');
    expect(ai).toContain('position:Vec3');
    expect(ai).toContain('radius:number');
  });
});
