import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

function readDomainSource():string{
  try{
    return readFileSync(new URL('./generational-world.ts',import.meta.url),'utf8');
  }catch{
    return '';
  }
}

describe('V6 generational world domain contract',()=>{
  it('declares canonical bounded legacy markers and public projects in one domain module',()=>{
    const source=readDomainSource();
    expect(source).toContain("'festival_tradition'");
    expect(source).toContain("'open_road_network'");
    expect(source).toContain("'regional_compact'");
    expect(source).toContain("'restored_riftward'");
    expect(source).toContain("'forbidden_legacy'");
    expect(source).toContain("'hollow_scar'");
    expect(source).toContain("'guardian_academy'");
    expect(source).toContain("'ancient_road_restoration'");
    expect(source).toContain("'regional_council'");
    expect(source).toContain("'rift_watch'");
    expect(source).toContain('export type GenerationalWorldState');
  });
});
