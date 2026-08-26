// @ts-ignore -- source-contract tests use Node globals outside app tsconfig.
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {initialMobileNavigationState,mobileNavigationReducer} from './mobile-router';

const routerCss=readFileSync(new URL('./mobile-router-v8.css',import.meta.url),'utf8');
const v9Css=readFileSync(new URL('./mobile-v9.css',import.meta.url),'utf8');
const complexCss=readFileSync(new URL('./mobile-v9-complex.css',import.meta.url),'utf8');
const tacticalCss=readFileSync(new URL('./tactical-battle.css',import.meta.url),'utf8');
const chromeSource=readFileSync(new URL('./MobileRouterChrome.tsx',import.meta.url),'utf8');

describe('V9 final mobile responsive and accessibility QA',()=>{
  it('covers the supported 430, 390, 360 and short-height viewport classes',()=>{
    expect(routerCss).toContain('@media(max-width:430px)');
    expect(routerCss).toContain('@media(max-width:390px)');
    expect(routerCss).toContain('@media(max-width:360px)');
    expect(routerCss).toContain('@media(max-height:650px)');
    expect(v9Css).toContain('@media(max-width:390px)');
    expect(v9Css).toContain('@media(max-width:360px),(max-height:650px)');
    expect(tacticalCss).toContain('@media(max-width:360px)');
    expect(tacticalCss).toContain('@media(max-height:650px)');
  });

  it('keeps one scroll owner for routed pages and removes nested fullscreen scroll traps',()=>{
    expect(v9Css).toContain('.v9-page-shell{position:relative;display:grid;min-height:0;height:100%;overflow:hidden');
    expect(v9Css).toContain('.v9-page-scroll{min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain');
    expect(complexCss).toContain('overflow:visible!important');
    expect(complexCss).not.toMatch(/\.v9-complex-feature[^}]*overflow-y:auto/);
  });

  it('protects safe areas and 44/48/52px touch tiers across chrome, pages and active play',()=>{
    for(const css of [routerCss,v9Css,tacticalCss]){
      expect(css).toContain('safe-area-inset-bottom');
    }
    expect(routerCss).toContain('safe-area-inset-top');
    expect(routerCss).toContain('safe-area-inset-left');
    expect(routerCss).toContain('safe-area-inset-right');
    expect(routerCss).toContain('min-width:44px');
    expect(routerCss).toContain('min-height:48px');
    expect(v9Css).toContain('min-height:52px');
  });

  it('provides explicit keyboard focus and reduced-motion behavior for V9 controls',()=>{
    for(const selector of ['.v9-page-back:focus-visible','.v9-primary-action:focus-visible','.v9-category-recommendation:focus-visible']){
      expect(v9Css).toContain(selector);
    }
    expect(routerCss).toContain(':focus-visible');
    expect(routerCss).toContain('@media(prefers-reduced-motion:reduce)');
    expect(v9Css).toContain('@media(prefers-reduced-motion:reduce)');
    expect(tacticalCss).toContain('@media(prefers-reduced-motion:reduce)');
  });

  it('keeps direct category switching shallow and feature completion contextual while play completion returns home',()=>{
    const growth=mobileNavigationReducer(initialMobileNavigationState,{type:'OPEN_CATEGORY',category:'growth'});
    const adventure=mobileNavigationReducer(growth,{type:'OPEN_CATEGORY',category:'adventure'});
    expect(adventure.stack).toEqual([{kind:'home'}]);
    const feature=mobileNavigationReducer(adventure,{type:'OPEN_FEATURE',category:'adventure',feature:'world'});
    expect(mobileNavigationReducer(feature,{type:'FINISH_FEATURE'}).current).toEqual({kind:'category',category:'adventure'});
    const play=mobileNavigationReducer(adventure,{type:'OPEN_PLAY',category:'adventure',screen:'tactical'});
    expect(mobileNavigationReducer(play,{type:'FINISH_PLAY'})).toEqual(initialMobileNavigationState);
    expect(chromeSource).toContain("onClick={()=>item.id==='home'?onHome():onCategory(item.id)}");
  });
});
