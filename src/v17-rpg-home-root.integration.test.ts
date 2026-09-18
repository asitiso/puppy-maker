import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const root=readFileSync(new URL('./Root.tsx',import.meta.url),'utf8');

describe('V17 root RPG world integration',()=>{
  it('uses playable world hubs for home and every category route',()=>{
    expect(root).toContain("import RpgHomeHub from './RpgHomeHub';");
    expect(root).toContain("import RpgDistrictHub from './RpgDistrictHub';");
    expect(root).toContain("if(route.kind==='home')return <>");
    expect(root).toContain('<RpgHomeHub state={state} onCategory={openCategory} onFeature={openFeature}/>');
    expect(root).toContain("if(route.kind==='category')return <RpgDistrictHub");
    expect(root).not.toContain('<LayeredHome');
    expect(root).not.toContain('<MobileCategoryPage');
  });

  it('keeps chronicle portals inside dedicated archive interiors',()=>{
    expect(root).toContain("import RpgChronicleFeature from './RpgChronicleFeature';");
    expect(root).toContain("if(feature==='lineage'||feature==='world_chronicle')return <RpgChronicleFeature");
  });
});
