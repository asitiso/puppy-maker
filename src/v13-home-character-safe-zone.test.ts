import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const css=readFileSync(new URL('./layered-home.css',import.meta.url),'utf8');

describe('V13 home character safe zone',()=>{
  it('reserves a central character lane and keeps HUD controls on edge lanes',()=>{
    expect(css).toContain('--lh-character-safe-top:');
    expect(css).toContain('--lh-character-safe-left:');
    expect(css).toContain('--lh-character-safe-right:');
    expect(css).toContain('.lh-character{');
    expect(css).toContain('max-width:var(--lh-character-safe-width)');
    expect(css).toMatch(/\.lh-shortcuts\{[^}]*max-width:/);
    expect(css).toMatch(/\.lh-goal\{[^}]*max-width:/);
  });

  it('moves primary guidance and dialogue below the protected character focus area on short phones',()=>{
    expect(css).toContain('--lh-character-safe-bottom:');
    expect(css).toMatch(/\.lh-primary-action\{[^}]*bottom:/);
    expect(css).toMatch(/\.lh-dialogue\{[^}]*bottom:/);
    expect(css).toContain('@media(max-height:650px)');
    expect(css).toContain('--lh-character-safe-width:');
  });
});
