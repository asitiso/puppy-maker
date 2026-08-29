import {existsSync,readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const source=readFileSync(new URL('./GuardianExpeditionOverlay.tsx',import.meta.url),'utf8');
const cssUrl=new URL('./guardian-expedition.css',import.meta.url);

describe('V14 tactical expedition presentation',()=>{
  it('stages the battle as two factions around a central battlefield with a command deck',()=>{
    expect(source).toContain('expedition-battlefield');
    expect(source).toContain('battle-faction is-ally');
    expect(source).toContain('battle-terrain');
    expect(source).toContain('battle-faction is-enemy');
    expect(source).toContain('battle-command-deck');
    expect(source).toContain('battle-command-actions');
  });

  it('keeps tactical presentation in a dedicated responsive stylesheet',()=>{
    expect(existsSync(cssUrl)).toBe(true);
    if(!existsSync(cssUrl)) return;
    const css=readFileSync(cssUrl,'utf8');
    expect(css).toContain('.expedition-battlefield');
    expect(css).toContain('.expedition-battle .battle-faction');
    expect(css).toContain('.expedition-battle .battle-terrain');
    expect(css).toContain('.expedition-battle .battle-command-deck');
    expect(css).toContain('@media(max-width:430px)');
    expect(css).toContain('@media(max-height:640px)');
  });

  it('preserves mobile touch and keyboard visibility in the tactical command deck',()=>{
    if(!existsSync(cssUrl)) return;
    const css=readFileSync(cssUrl,'utf8');
    expect(css).toContain('min-width:44px');
    expect(css).toContain('min-height:44px');
    expect(css).toContain(':focus-visible');
  });
});