import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const read=(path:string)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

describe('mobile RPG shell integration',()=>{
  it('gives every outing exploration region one immersive non-scrolling mobile shell',()=>{
    const feature=read('MobileLegacyFeaturePage.tsx');
    const css=read('exploration/exploration.css');
    expect(feature).toContain('v14-outing-scene-page v15-rpg-scene-page');
    expect(feature).not.toContain("outingScene==='forest'?' v15-rpg-scene-page':''");
    expect(css).toContain('.v15-rpg-scene-page .v9-page-header{display:none}');
    expect(css).toContain('.v15-rpg-scene-page .v9-page-scroll{overflow:hidden}');
    expect(css).toContain('.v15-rpg-scene-page .v9-page-content{height:100%;min-height:0;padding:0}');
    expect(css).toContain('.v15-rpg-scene-page .mobile-exploration{height:100%;min-height:100%}');
  });

  it('keeps the player inside every region after a story commit until they choose to leave',()=>{
    const feature=read('MobileLegacyFeaturePage.tsx');
    expect(feature).not.toContain("if(location!=='forest')setOutingScene(null)");
    expect(feature).toContain("setFeedback(`${outingDefinitions[location].name}으로 외출했어요.`)");
    expect(feature).toContain('직접 움직여 주변의 단서를 찾아보세요.');
  });

  it('visually communicates facing and completed discoveries in the world itself',()=>{
    const css=read('exploration/exploration.css');
    expect(css).toContain('.mobile-exploration__player[data-facing="left"]');
    expect(css).toContain('.mobile-exploration__landmark[data-completed="true"]');
  });
});
