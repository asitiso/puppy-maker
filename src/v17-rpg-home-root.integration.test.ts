import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const root=readFileSync(new URL('./Root.tsx',import.meta.url),'utf8');

describe('V17 root RPG world integration',()=>{
  it('uses the playable world hub as the default home route',()=>{
    expect(root).toContain("import RpgHomeHub from './RpgHomeHub';");
    expect(root).toContain("if(route.kind==='home')return <>");
    expect(root).toContain('<RpgHomeHub state={state} onCategory={openCategory} onFeature={openFeature}/>');
    expect(root).not.toContain('<LayeredHome');
  });
});
