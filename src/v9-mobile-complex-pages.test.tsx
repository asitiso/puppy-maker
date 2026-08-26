// @ts-ignore -- Vitest source contracts execute with Node globals outside app tsconfig.
import {readFileSync} from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import {initialState} from './game';
import MobileRouterChrome from './MobileRouterChrome';
import {categoryForFeature,type MobileFeatureId,type MobileNavigationState} from './mobile-router';

const chromeSource=readFileSync(new URL('./MobileRouterChrome.tsx',import.meta.url),'utf8');
const cssSource=readFileSync(new URL('./mobile-v9-complex.css',import.meta.url),'utf8');

const complex:[MobileFeatureId,string][]=[
  ['raising','feature.raising.background'],
  ['ambition','feature.ambition.background'],
  ['season','feature.season.background'],
  ['sanctuary','feature.sanctuary.background'],
  ['expedition','feature.expedition.background'],
  ['world','feature.world.background'],
  ['archive','feature.archive.background'],
];

function renderFeature(feature:MobileFeatureId){
  const category=categoryForFeature[feature];
  const navigation:MobileNavigationState={current:{kind:'feature',category,feature},stack:[{kind:'home'},{kind:'category',category}]};
  return renderToStaticMarkup(<MobileRouterChrome
    state={initialState}
    navigation={navigation}
    guarded={false}
    pendingExit={null}
    onCategory={vi.fn()}
    onBack={vi.fn()}
    onHome={vi.fn()}
    onRequestExit={vi.fn()}
    onCancelExit={vi.fn()}
    onConfirmExit={vi.fn()}
  ><div className={`${feature}-legacy-overlay`}>legacy content</div></MobileRouterChrome>);
}

describe('V9 complex feature surfaces',()=>{
  it('wraps each routed complex feature in one shared page shell and semantic scene',()=>{
    for(const [feature,slot] of complex){
      const html=renderFeature(feature);
      expect(html).toContain('data-mobile-page-shell');
      expect((html.match(/v9-page-back/g)??[]).length).toBe(1);
      expect((html.match(/data-mobile-page-scroll/g)??[]).length).toBe(1);
      expect(html).toContain(`data-visual-slot="${slot}"`);
      expect(html).toContain('v9-complex-feature');
    }
  });

  it('keeps six-tab navigation available because complex feature pages are ordinary routes',()=>{
    const html=renderFeature('sanctuary');
    for(const label of ['홈','생활','성장','모험','인연','기록'])expect(html).toContain(label);
  });

  it('centralizes complex feature titles and backgrounds in router chrome',()=>{
    expect(chromeSource).toContain('complexFeatureMeta');
    expect(chromeSource).toContain('MobilePageShell');
    for(const [feature,slot] of complex){
      expect(chromeSource).toContain(`${feature}:`);
      expect(chromeSource).toContain(slot);
    }
  });

  it('flattens legacy fullscreen overlay chrome inside the shared page scroll',()=>{
    for(const selector of ['.raising-overlay','.yearly-ambition-backdrop','.season-live-backdrop','.sanctuary-backdrop','.expedition-overlay','.world-progress-backdrop','.collection-archive-backdrop'])expect(cssSource).toContain(selector);
    expect(cssSource).toContain('position:static');
    expect(cssSource).toContain('max-height:none');
    expect(cssSource).toContain('overflow:visible');
  });
});
