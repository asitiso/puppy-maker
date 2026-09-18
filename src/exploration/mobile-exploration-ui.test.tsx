import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const source=(name:string)=>readFileSync(new URL(`./${name}`,import.meta.url),'utf8');

describe('mobile-first exploration controls',()=>{
  it('gives the joystick pointer capture, cancellation recovery, and an accessible control name',()=>{
    const joystick=source('MobileJoystick.tsx');
    expect(joystick).toContain('aria-label="이동 조이스틱"');
    expect(joystick).toContain('setPointerCapture');
    expect(joystick).toContain('onPointerCancel');
    expect(joystick).toContain('onLostPointerCapture');
    expect(joystick).toContain('onDirection({x:0,y:0})');
  });

  it('presents story as an illustrated modal frame with touch cancel and trapped keyboard focus',()=>{
    const story=source('StoryFrameOverlay.tsx');
    expect(story).toContain('role="dialog"');
    expect(story).toContain('aria-modal="true"');
    expect(story).toContain('exploration-story-frame__art');
    expect(story).toContain('exploration-story-frame__ornament');
    expect(story).toContain('frame.actionLabel');
    expect(story).toContain("if(event.key!=='Tab') return");
    expect(story).toContain('event.preventDefault()');
    expect(story).toContain("querySelectorAll<HTMLButtonElement>('button:not([disabled])')");
    expect(story).toContain('document.activeElement===last');
    expect(story).toContain('document.activeElement===first');
    expect(story).toContain('aria-label="스토리 닫기"');
    expect(story).toContain('onClick={onCancel}');
    expect(story).toContain('onKeyDown={keepDialogFocus}');
  });

  it('reserves thumb-safe controls and adapts to short landscape screens',()=>{
    const css=source('exploration.css');
    expect(css).toContain('100dvh');
    expect(css).toContain('env(safe-area-inset-left)');
    expect(css).toContain('env(safe-area-inset-right)');
    expect(css).toContain('env(safe-area-inset-bottom)');
    expect(css).toContain('min-width:52px');
    expect(css).toContain('min-height:52px');
    expect(css).toContain('@media (orientation:landscape) and (max-height:560px)');
    expect(css).toContain('@media (prefers-reduced-motion:reduce)');
  });

  it('keeps story completion reachable on extra-short landscape screens',()=>{
    const css=source('exploration.css');
    expect(css).toContain('@media (orientation:landscape) and (max-height:380px)');
    expect(css).toContain('.exploration-story-frame__visual{display:none}');
    expect(css).toContain('.exploration-story-frame{grid-template-columns:1fr;grid-template-rows:1fr;width:min(94vw,760px);max-height:min(94dvh,350px)}');
    expect(css).toContain('.exploration-story-frame__continue{min-height:48px}');
  });

  it('keeps the short-landscape prompt inside the center lane between thumb controls',()=>{
    const css=source('exploration.css');
    expect(css).toContain('.mobile-exploration__prompt{bottom:max(77px,calc(env(safe-area-inset-bottom) + 69px));max-width:min(46vw,350px);font-size:9px}');
  });
});
