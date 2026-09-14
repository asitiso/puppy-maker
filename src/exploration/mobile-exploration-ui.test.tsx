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

  it('presents story as an illustrated frame instead of a prose panel',()=>{
    const story=source('StoryFrameOverlay.tsx');
    expect(story).toContain('role="dialog"');
    expect(story).toContain('aria-modal="true"');
    expect(story).toContain('exploration-story-frame__art');
    expect(story).toContain('exploration-story-frame__ornament');
    expect(story).toContain('frame.actionLabel');
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
});
