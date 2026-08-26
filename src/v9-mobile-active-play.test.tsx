// @ts-ignore -- source-contract tests use Node globals outside app tsconfig.
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {isGuardedActiveRoute,type MobileRoute} from './mobile-router';

const appSource=readFileSync(new URL('./App.tsx',import.meta.url),'utf8');
const rootSource=readFileSync(new URL('./Root.tsx',import.meta.url),'utf8');
const cssSource=readFileSync(new URL('./mobile-v9.css',import.meta.url),'utf8');

const route=(screen:'schedule'|'training'|'dialogue'|'result'):MobileRoute=>({kind:'play',category:'life',screen});

describe('V9 training and choice active-play UX',()=>{
  it('keeps schedule/result ordinary while training/unresolved dialogue stay guarded',()=>{
    expect(isGuardedActiveRoute(route('schedule'))).toBe(false);
    expect(isGuardedActiveRoute(route('training'))).toBe(true);
    expect(isGuardedActiveRoute(route('dialogue'))).toBe(true);
    expect(isGuardedActiveRoute(route('result'))).toBe(false);
    expect(rootSource).toContain("const normalAppPlay=gameState.screen==='schedule'||gameState.screen==='result'");
    expect(rootSource).toContain("const guardedAppPlay=gameState.screen==='training'||gameState.screen==='dialogue'");
  });

  it('marks each inline App screen with one V9 presentation boundary',()=>{
    for(const screen of ['schedule','training','dialogue','result']){
      expect(appSource).toContain(`data-v9-play-screen=\"${screen}\"`);
      expect(appSource).toContain(`v9-play-${screen}`);
    }
  });

  it('keeps choice actions and the result completion CTA reachable in the mobile viewport',()=>{
    expect(appSource).toContain('v9-choice-actions');
    expect(appSource).toContain('v9-result-complete');
    expect(cssSource).toContain('.v9-play-screen');
    expect(cssSource).toContain('.v9-choice-actions');
    expect(cssSource).toContain('.v9-result-complete');
    expect(cssSource).toContain('.is-guarded-play');
    expect(cssSource).toContain('.is-normal-play');
  });

  it('preserves the authoritative reducer actions and exits through router navigation only',()=>{
    expect(appSource).toContain("dispatch({type:'FINISH_TRAINING'");
    expect(appSource).toContain("dispatch({type:'CHOOSE',choice:'hug'})");
    expect(appSource).toContain("dispatch({type:'NEXT_MONTH'})");
    expect(rootSource).toContain("if(target==='home')handleHome()");
    expect(rootSource).toContain("else if(target==='back')handleBack()");
    expect(rootSource).not.toContain("pendingExit==='home'?dispatch(");
  });
});
