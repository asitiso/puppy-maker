// @ts-ignore -- source-contract tests use Node globals outside app tsconfig.
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const screenSource=readFileSync(new URL('./TacticalBattleScreen.tsx',import.meta.url),'utf8');
const flowSource=readFileSync(new URL('./TacticalExpeditionFlow.tsx',import.meta.url),'utf8');
const battleCss=readFileSync(new URL('./tactical-battle.css',import.meta.url),'utf8');
const flowCss=readFileSync(new URL('./tactical-expedition-flow.css',import.meta.url),'utf8');

describe('V9 tactical mobile screen',()=>{
  it('keeps tactical content inside the router route body so guarded navigation remains reachable',()=>{
    expect(flowCss).toContain('.tactical-expedition-layer{position:absolute');
    expect(flowCss).toContain('inset:0');
    expect(flowCss).not.toContain('.tactical-expedition-layer{position:fixed');
    expect(battleCss).toContain('.tactical-screen{height:100%');
    expect(battleCss).toContain('.tactical-result{position:absolute');
  });

  it('keeps battle actions, cards and results usable on 360px and short-height phones',()=>{
    expect(battleCss).toContain('@media(max-width:360px)');
    expect(battleCss).toContain('@media(max-height:650px)');
    expect(battleCss).toContain('.tactical-hand button{min-height:52px');
    expect(battleCss).toContain('.tactical-log{min-height:32px');
    expect(battleCss).toContain('safe-area-inset-bottom');
    expect(battleCss).toContain('overscroll-behavior:contain');
  });

  it('preserves manual/auto, speed, targeting, retry and exit callbacks without changing the battle engine path',()=>{
    for(const token of ['onToggleAuto','onToggleSpeed','chooseTarget','onRetry','onExit'])expect(screenSource).toContain(token);
    expect(screenSource).toContain('resolveTacticalAction');
    expect(screenSource).toContain('chooseTacticalEngineAction');
    expect(flowSource).toContain('onComplete(tacticalEncounterForExpeditionStage');
    expect(flowSource).toContain('onExpeditionFinish(stageId');
  });
});
