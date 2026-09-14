import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const read=(path:string)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

describe('mobile RPG shell integration',()=>{
  it('gives forest exploration an immersive shell instead of nesting a full viewport inside a scrolling page',()=>{
    const feature=read('MobileLegacyFeaturePage.tsx');
    const css=read('exploration/exploration.css');
    expect(feature).toContain("outingScene==='forest'?' v15-rpg-scene-page':''");
    expect(css).toContain('.v15-rpg-scene-page .v9-page-header{display:none}');
    expect(css).toContain('.v15-rpg-scene-page .v9-page-scroll{overflow:hidden}');
    expect(css).toContain('.v15-rpg-scene-page .v9-page-content{height:100%;min-height:0;padding:0}');
    expect(css).toContain('.v15-rpg-scene-page .mobile-exploration{height:100%;min-height:100%}');
  });

  it('keeps the player in the forest after the story commit so exploration does not snap back to a menu',()=>{
    const feature=read('MobileLegacyFeaturePage.tsx');
    expect(feature).toContain("if(location!=='forest')setOutingScene(null)");
    expect(feature).toContain("outingScene==='forest'?'직접 움직여 빛나는 흔적을 찾아보세요.'");
  });

  it('visually communicates facing and completed discoveries in the world itself',()=>{
    const css=read('exploration/exploration.css');
    expect(css).toContain('.mobile-exploration__player[data-facing="left"]');
    expect(css).toContain('.mobile-exploration__landmark[data-completed="true"]');
  });
});
