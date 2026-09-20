import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const feedback=readFileSync(new URL('./adventure3d/combat-feedback.ts',import.meta.url),'utf8');
const slice=readFileSync(new URL('./adventure3d/AdventureVerticalSlice.tsx',import.meta.url),'utf8');
const renderer=readFileSync(new URL('./adventure3d/software-renderer.ts',import.meta.url),'utf8');
const css=readFileSync(new URL('./adventure3d/adventure-vertical-slice.css',import.meta.url),'utf8');
const persistence=readFileSync(new URL('./adventure3d/open-adventure-state.ts',import.meta.url),'utf8');

describe('V18 combat feel polish integration',()=>{
  it('adds transient hit stop and render-only camera impulse around real combat impacts',()=>{
    expect(feedback).toContain('combatFeedbackTimeScale');
    expect(feedback).toContain('combatFeedbackCamera');
    expect(slice).toContain('rawDt*combatTimeScale');
    expect(slice).toContain('combatFeedbackCamera(cameraRef.current,combatFeedbackRef.current)');
    expect(persistence).not.toContain('combatFeedback');
    expect(persistence).not.toContain('hitStop');
  });

  it('surfaces damage counter guard break and player-hit numbers from actual resolved hits',()=>{
    expect(slice).toContain('const dealt=Math.max(0,enemy.hp-result.enemy.hp)');
    expect(slice).toContain("kind:'player-hit'");
    expect(slice).toContain("?'guard-break'");
    expect(renderer).toContain('drawCombatFeedback');
    expect(renderer).toContain("event.kind==='counter'");
    expect(renderer).toContain("event.kind==='player-hit'");
  });

  it('makes the Tempest Warden phase change and wind knockdown feel like major impacts',()=>{
    expect(slice).toContain("kind:'phase-break'");
    expect(slice).toContain("label:'2 PHASE · AIRBORNE'");
    expect(slice).toContain("label:'WIND BREAK'");
    expect(renderer).toContain("event.kind==='phase-break'");
  });

  it('prioritizes attack dodge and phase-two wind pulse on small touch screens',()=>{
    expect(slice).toContain('data-boss={tempestWardenPhaseState||undefined}');
    expect(css).toContain('.adventure3d[data-combat="true"] .adventure3d__actions button.is-combat');
    expect(css).toContain('order:-3');
    expect(css).toContain('.adventure3d[data-boss="2"] .adventure3d__actions button.is-environment');
  });
});
