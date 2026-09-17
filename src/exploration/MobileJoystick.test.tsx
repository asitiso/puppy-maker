import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const joystick=readFileSync(new URL('./MobileJoystick.tsx',import.meta.url),'utf8');

describe('mobile joystick lifecycle contract',()=>{
  it('returns the visual knob and movement vector to neutral whenever controls become disabled',()=>{
    expect(joystick).toContain('useEffect');
    expect(joystick).toContain('if(disabled) reset()');
    expect(joystick).toContain('[disabled,reset]');
  });

  it('releases touch ownership when the app loses focus so the next touch can move immediately',()=>{
    expect(joystick).toContain("window.addEventListener('blur',reset)");
    expect(joystick).toContain("window.removeEventListener('blur',reset)");
    expect(joystick).toContain("document.addEventListener('visibilitychange',resetWhenHidden)");
    expect(joystick).toContain('if(document.hidden) reset()');
  });

  it('keeps movement owned by the first active pointer until that pointer finishes',()=>{
    expect(joystick).toContain('const activePointerRef=useRef<number|null>(null)');
    expect(joystick).toContain('if(disabled||activePointerRef.current!==null) return');
    expect(joystick).toContain('activePointerRef.current=event.pointerId');
    expect(joystick).toContain('if(disabled||activePointerRef.current!==event.pointerId) return');
    expect(joystick).toContain('if(activePointerRef.current!==event.pointerId) return');
  });

  it('ignores unrelated pointer release and capture-loss events instead of cancelling the active drag',()=>{
    expect(joystick).toContain('onPointerUp={finish}');
    expect(joystick).toContain('onPointerCancel={finish}');
    expect(joystick).toContain('if(activePointerRef.current===event.pointerId) reset()');
    expect(joystick).toContain('onLostPointerCapture={loseCapture}');
  });

  it('keeps small thumb jitter neutral while preserving the full outer movement range',()=>{
    expect(joystick).toContain('const DEAD_ZONE=.14');
    expect(joystick).toContain('if(rawMagnitude<=DEAD_ZONE)');
    expect(joystick).toContain('neutralize();');
    expect(joystick).toContain('const clampedMagnitude=Math.min(1,rawMagnitude)');
    expect(joystick).toContain('const outputMagnitude=(clampedMagnitude-DEAD_ZONE)/(1-DEAD_ZONE)');
  });

  it('starts neutral wherever the thumb lands and measures movement from that touch point',()=>{
    expect(joystick).toContain('const dragOriginRef=useRef<Vec2|null>(null)');
    expect(joystick).toContain('dragOriginRef.current={x:event.clientX,y:event.clientY}');
    expect(joystick).toContain('const origin=dragOriginRef.current');
    expect(joystick).toContain('const rawX=event.clientX-origin.x');
    expect(joystick).toContain('const rawY=event.clientY-origin.y');
    expect(joystick).toContain('event.currentTarget.setPointerCapture(event.pointerId);\n    neutralize();');
  });

  it('forgets the drag origin on every ownership-ending path',()=>{
    expect(joystick).toContain('activePointerRef.current=null;\n    dragOriginRef.current=null;\n    neutralize();');
    expect(joystick).toContain('activePointerRef.current=null;\n    dragOriginRef.current=null;\n    if(event.currentTarget.hasPointerCapture(event.pointerId))');
  });
});
