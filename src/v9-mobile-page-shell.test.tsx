// @ts-ignore -- source contracts execute under Vitest/Node while app tsconfig excludes Node globals.
import {existsSync,readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

function source(path:string){const url=new URL(path,import.meta.url);return existsSync(url)?readFileSync(url,'utf8'):'';}
const shell=source('./MobilePageShell.tsx');
const action=source('./MobilePrimaryAction.tsx');
const feedback=source('./MobileFeedback.tsx');
const scroll=source('./mobile-scroll-memory.ts');
const chrome=source('./MobileRouterChrome.tsx');

describe('V9 mobile page system',()=>{
  it('owns one page scroll body and contextual feature back control',()=>{
    expect(shell).toContain('data-mobile-page-scroll');
    expect(shell).toContain('aria-label="이전 화면으로 돌아가기"');
    expect(shell).toContain('MobileSceneBackground');
    expect(shell).toContain('stickyAction');
  });

  it('stores scroll position outside the save schema',()=>{
    expect(scroll).toContain('new Map<string,number>()');
    expect(scroll).toContain('rememberMobileScroll');
    expect(scroll).toContain('readMobileScroll');
    expect(scroll).not.toContain('localStorage');
  });

  it('explains disabled primary actions visibly and accessibly',()=>{
    expect(action).toContain('reason');
    expect(action).toContain('aria-describedby');
    expect(action).toContain('v9-action-reason');
  });

  it('uses non-blocking feedback instead of another modal',()=>{
    expect(feedback).toContain("role={tone==='error'?'alert':'status'}");
    expect(feedback).not.toContain('aria-modal');
    expect(feedback).not.toContain('backdrop');
  });

  it('removes the obsolete V8 ordinary sticky route-back button',()=>{
    expect(chrome).not.toContain('className="v8-route-back"');
    expect(chrome).toContain('v8-bottom-nav');
    expect(chrome).toContain('v8-play-guard');
  });
});
