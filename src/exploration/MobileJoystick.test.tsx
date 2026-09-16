import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const joystick=readFileSync(new URL('./MobileJoystick.tsx',import.meta.url),'utf8');

describe('mobile joystick lifecycle contract',()=>{
  it('returns the visual knob and movement vector to neutral whenever controls become disabled',()=>{
    expect(joystick).toContain('useEffect');
    expect(joystick).toContain('if(disabled) reset()');
    expect(joystick).toContain('[disabled,reset]');
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
});
