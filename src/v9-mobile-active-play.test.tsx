// @ts-ignore -- source-contract tests use Node globals outside app tsconfig.
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {isGuardedActiveRoute,type MobileRoute} from './mobile-router';

const appSource=readFileSync(new URL('./App.tsx',import.meta.url),'utf8');
const trainingSource=readFileSync(new URL('./TrainingActivityMinigame.tsx',import.meta.url),'utf8');
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

  it('preserves active-play presentation boundaries while allowing training to own its component',()=>{
    for(const className of ['diary-screen','dialogue-screen','result-screen']){
      expect(appSource).toContain(className);
    }
    expect(appSource).toContain('<TrainingActivityMinigame');
    expect(trainingSource).toContain('training-screen');
    expect(appSource).toContain('className="choices"');
    expect(appSource).toContain('className="primary next-month"');
  });

  it('keeps planning, battle, choices and result completion reachable inside the mobile viewport',()=>{
    for(const selector of [
      '.v8-app-host.is-normal-play',
      '.v8-app-host.is-guarded-play',
      '.training-screen .action-bar',
      '.dialogue-screen .choices',
      '.result-screen .next-month',
    ])expect(cssSource).toContain(selector);
    expect(cssSource).toContain('overflow-y:auto');
    expect(cssSource).toContain('env(safe-area-inset-bottom)');
    expect(cssSource).toContain('min-height:52px');
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
