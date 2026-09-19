// @ts-ignore -- source-contract test uses Node fs outside app tsconfig.
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const root=readFileSync(new URL('./Root.tsx',import.meta.url),'utf8');
const slice=readFileSync(new URL('./adventure3d/AdventureVerticalSlice.tsx',import.meta.url),'utf8');

describe('V18 open adventure vertical slice routing',()=>{
  it('makes outing enter the new open exploration runtime before legacy menus',()=>{
    expect(root).toContain("lazy(()=>import('./adventure3d/AdventureVerticalSlice'))");
    const outingIndex=root.indexOf("if(feature==='outing')return <AdventureVerticalSlice");
    const legacyIndex=root.indexOf("if(legacyPageFeatures.has(feature))");
    expect(outingIndex).toBeGreaterThan(-1);
    expect(outingIndex).toBeLessThan(legacyIndex);
  });

  it('keeps the first slice focused on movement camera and discovery rather than quest arrows',()=>{
    expect(slice).toContain('stepPlayerMotion');
    expect(slice).toContain('rotateAdventureCamera');
    expect(slice).toContain('MobileJoystick');
    expect(slice).toContain('살펴보기');
    expect(slice).not.toMatch(/mini.?map|quest.?arrow|목적지 화살표/i);
  });
});
