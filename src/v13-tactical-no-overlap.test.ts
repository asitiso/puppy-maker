import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const flow=readFileSync(new URL('./TacticalExpeditionFlow.tsx',import.meta.url),'utf8');
const flowCss=readFileSync(new URL('./tactical-expedition-flow.css',import.meta.url),'utf8');
const loadout=readFileSync(new URL('./V12LoadoutPanel.tsx',import.meta.url),'utf8');
const battleCss=readFileSync(new URL('./tactical-battle.css',import.meta.url),'utf8');

describe('V13 tactical controls never overlap',()=>{
  it('places companion selection before a dedicated start action instead of inside the loadout card',()=>{
    expect(loadout).toContain('showPrimaryAction');
    expect(flow).toContain('showPrimaryAction={false}');
    const partyIndex=flow.indexOf('id="v12-tactical-party-picker"');
    const actionIndex=flow.indexOf('className="tactical-setup-actions"');
    expect(partyIndex).toBeGreaterThan(-1);
    expect(actionIndex).toBeGreaterThan(partyIndex);
    expect(flow).toContain('className="tactical-start"');
  });

  it('makes the setup card scroll-safe and reserves a sticky safe-area action lane',()=>{
    expect(flowCss).toMatch(/\.tactical-expedition-entry\{[^}]*max-height:/);
    expect(flowCss).toMatch(/\.tactical-expedition-entry-content\{[^}]*overflow-y:auto/);
    expect(flowCss).toMatch(/\.tactical-setup-actions\{[^}]*position:sticky/);
    expect(flowCss).toContain('env(safe-area-inset-bottom)');
    expect(flowCss).toMatch(/\.tactical-start\{[^}]*min-height:(48|5\d)px/);
  });

  it('keeps battle controls at least 44px tall even on narrow and short phones',()=>{
    expect(battleCss).toContain('.tactical-screen button{min-height:44px');
    expect(battleCss).not.toMatch(/header button\{min-height:(?:4[0-3]|[0-3]\d)px/);
    expect(battleCss).not.toMatch(/ultimates button\{min-height:(?:4[0-3]|[0-3]\d)px/);
    expect(battleCss).toContain('@media(max-width:360px)');
    expect(battleCss).toContain('@media(max-height:650px)');
  });
});
