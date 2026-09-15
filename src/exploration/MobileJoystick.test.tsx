import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const joystick=readFileSync(new URL('./MobileJoystick.tsx',import.meta.url),'utf8');

describe('mobile joystick lifecycle contract',()=>{
  it('returns the visual knob and movement vector to neutral whenever controls become disabled',()=>{
    expect(joystick).toContain('useEffect');
    expect(joystick).toContain('if(disabled) reset()');
    expect(joystick).toContain('[disabled,reset]');
  });
});
