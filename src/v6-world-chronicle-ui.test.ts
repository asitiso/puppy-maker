// @ts-ignore -- source-contract test intentionally uses Node fs without adding Node app types.
import {existsSync,readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const here=(name:string)=>new URL(`./${name}`,import.meta.url);

describe('V6 World Chronicle player-facing contract',()=>{
  it('requires a compact secondary World Chronicle with an authoritative reducer event bridge',()=>{
    expect(existsSync(here('WorldChronicle.tsx'))).toBe(true);
    expect(existsSync(here('world-chronicle.css'))).toBe(true);
    expect(existsSync(here('public-project-ui-events.ts'))).toBe(true);
    if(!existsSync(here('WorldChronicle.tsx'))||!existsSync(here('world-chronicle.css'))||!existsSync(here('public-project-ui-events.ts')))return;

    const component=readFileSync(here('WorldChronicle.tsx'),'utf8');
    const css=readFileSync(here('world-chronicle.css'),'utf8');
    const home=readFileSync(here('LayeredHome.tsx'),'utf8');
    const app=readFileSync(here('App.tsx'),'utf8');
    const bridge=readFileSync(here('public-project-ui-events.ts'),'utf8');

    expect(component).toContain('세대의 세계');
    expect(component).toContain('legacyWorldMarkerLabels');
    expect(component).toContain('publicProjectDefinitions');
    expect(component).toContain('requestPublicProjectStart');
    expect(component).toContain('장기 세계 프로젝트');
    expect(home).toContain("import WorldChronicle from './WorldChronicle';");
    expect(home).toContain('<WorldChronicle');
    expect(app).toContain('publicProjectRequestEvent');
    expect(app).toContain("dispatch({type:'START_PUBLIC_PROJECT',projectId})");
    expect(bridge).toContain('CustomEvent');

    expect(css).toMatch(/min-height:\s*44px/);
    expect(css).toContain('max-width:100%');
    expect(css).toContain('@media(max-width:430px)');
    expect(css).toContain('@media(max-width:390px)');
    expect(css).toContain('prefers-reduced-motion:reduce');
    expect(css).toContain('safe-area-inset-right');
    expect(component).not.toContain('lh-primary-action');
  });
});
