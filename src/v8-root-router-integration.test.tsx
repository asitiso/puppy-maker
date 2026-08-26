// @ts-ignore -- Vitest executes source-contract checks in Node; app tsconfig excludes Node globals.
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const root=readFileSync(new URL('./Root.tsx',import.meta.url),'utf8');
const home=readFileSync(new URL('./LayeredHome.tsx',import.meta.url),'utf8');
const tactical=readFileSync(new URL('./TacticalExpeditionFlow.tsx',import.meta.url),'utf8');

describe('V8 root router integration',()=>{
  it('makes the V8 router the single mobile navigation authority',()=>{
    expect(root).toContain("from './MobileRouterChrome'");
    expect(root).toContain("from './MobileCategoryPage'");
    expect(root).toContain("from './MobileLegacyFeaturePage'");
    expect(root).toContain('mobileNavigationReducer');
    expect(root).toContain('initialMobileNavigationState');
    expect(root).toContain('isGuardedActiveRoute');
    expect(root).toContain('<MobileRouterChrome');
    expect(root).not.toContain('<LayeredHomeV7');
  });

  it('removes legacy independent overlay open-state authority',()=>{
    for(const legacyState of ['seasonLiveOpen','sanctuaryOpen','raisingOpen','expeditionOpen','worldProgressOpen','archiveOpen','ambitionOpen']){
      const setter=`set${legacyState[0].toUpperCase()}${legacyState.slice(1)}`;
      expect(root).not.toContain(`const [${legacyState},`);
      expect(root).not.toContain(setter);
    }
    expect(root).toContain('mobileNavigationReducer');
  });

  it('routes App schedule, training, dialogue and result screens through V8 play routes',()=>{
    for(const screen of ['schedule','training','dialogue','result']){
      expect(root).toContain(`screen:'${screen}'`);
    }
    expect(root).toContain("navigate?.('hub')");
  });

  it('delegates legacy home menu requests to router features instead of opening internal panels',()=>{
    expect(home).toContain('onMenuNavigate');
    expect(home).toContain('onWeeklyPlannerNavigate');
  });

  it('reports Tactical setup, active and result phases to the router without callback-driven setup loops',()=>{
    expect(tactical).toContain('onPhaseChange');
    expect(tactical).toContain("onPhaseChange?.('active')");
    expect(tactical).toContain("onPhaseChange?.('result')");
    expect(tactical).toContain('onPhaseChangeRef.current');
  });
});
