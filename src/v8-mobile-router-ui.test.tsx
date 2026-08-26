import {readFileSync} from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import {initialState} from './game';
import MobileRouterChrome from './MobileRouterChrome';
import type {MobileNavigationState} from './mobile-router';

const growthNavigation:MobileNavigationState={
  current:{kind:'category',category:'growth'},
  stack:[{kind:'home'}],
};
const guardedNavigation:MobileNavigationState={
  current:{kind:'play',category:'life',screen:'training'},
  stack:[{kind:'home'},{kind:'category',category:'life'}],
};

function render(navigation:MobileNavigationState,guarded=false,pendingExit:null|'back'|'home'=null){
  return renderToStaticMarkup(<MobileRouterChrome
    state={initialState}
    navigation={navigation}
    guarded={guarded}
    pendingExit={pendingExit}
    onCategory={vi.fn()}
    onBack={vi.fn()}
    onHome={vi.fn()}
    onRequestExit={vi.fn()}
    onCancelExit={vi.fn()}
    onConfirmExit={vi.fn()}
  ><main>content</main></MobileRouterChrome>);
}

describe('V8 mobile router chrome',()=>{
  it('keeps all six navigation categories visible in ordinary states',()=>{
    const html=render(growthNavigation);
    for(const label of ['홈','생활','성장','모험','인연','기록'])expect(html).toContain(`>${label}<`);
    expect(html).toContain('v8-bottom-nav');
    expect(html).not.toContain('v8-play-guard');
  });

  it('shows only Back and Home navigation while an attempt is guarded',()=>{
    const html=render(guardedNavigation,true);
    expect(html).toContain('v8-play-guard');
    expect(html).toContain('>뒤로<');
    expect(html).toContain('>홈<');
    expect(html).not.toContain('v8-bottom-nav');
    expect(html).not.toContain('>생활<');
  });

  it('uses the approved confirmation copy before leaving guarded play',()=>{
    const html=render(guardedNavigation,true,'home');
    expect(html).toContain('진행 중인 플레이를 종료할까요?');
    expect(html).toContain('지금 나가면 현재 진행 내용이 완료되지 않습니다.');
    expect(html).toContain('계속하기');
    expect(html).toContain('종료하고 이동');
  });

  it('locks one scroll body and mobile viewport/accessibility CSS contracts',()=>{
    const css=readFileSync(new URL('./mobile-router-v8.css',import.meta.url),'utf8');
    expect(css).toMatch(/\.v8-mobile-shell[^}]*100dvh/s);
    expect(css).toMatch(/\.v8-route-body[^}]*min-height:\s*0[^}]*overflow-y:\s*auto[^}]*overscroll-behavior:\s*contain/s);
    expect(css).toContain('env(safe-area-inset-bottom)');
    expect(css).toContain('min-height:var(--ui-touch-min)');
    expect(css).toContain('@media(max-width:430px)');
    expect(css).toContain('@media(max-width:390px)');
    expect(css).toContain('@media(max-width:360px)');
    expect(css).toContain('@media(prefers-reduced-motion:reduce)');
  });
});
