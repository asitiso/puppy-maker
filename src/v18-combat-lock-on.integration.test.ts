// @ts-ignore -- source-contract test uses Node fs outside app tsconfig.
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const slice=readFileSync(new URL('./adventure3d/AdventureVerticalSlice.tsx',import.meta.url),'utf8');
const renderer=readFileSync(new URL('./adventure3d/software-renderer.ts',import.meta.url),'utf8');
const targeting=readFileSync(new URL('./adventure3d/targeting-system.ts',import.meta.url),'utf8');

describe('V18 combat lock-on integration',()=>{
  it('adds explicit lock and target-switch controls without replacing manual combat',()=>{
    expect(slice).toContain("event.code==='KeyL'");
    expect(slice).toContain("event.code==='KeyT'");
    expect(slice).toContain('>락온');
    expect(slice).toContain('>다음 적</button>');
    expect(slice).toContain('tryStartPlayerAttack');
    expect(slice).toContain('tryStartPlayerDodge');
  });

  it('soft-follows the locked enemy and faces attacks toward it',()=>{
    expect(slice).toContain('smoothLockOnYaw');
    expect(slice).toContain('yawToTarget');
    expect(slice).toContain('lockedTargetStillValid');
    expect(slice).toContain('facingYaw:yawToTarget');
  });

  it('returns control immediately when the player drags the camera',()=>{
    expect(slice).toContain("setNotice('수동 시점 조작으로 락온을 해제했습니다.')");
    expect(slice).toContain('lockedTargetRef.current=null');
  });

  it('renders a visible target frame while keeping targeting independent from renderer internals',()=>{
    expect(renderer).toContain('enemy.id===lockedTargetId');
    expect(renderer).toContain('if(locked)');
    expect(targeting).not.toContain('CanvasRenderingContext2D');
    expect(targeting).not.toContain('renderAdventureField');
  });
});
