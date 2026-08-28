import {describe,expect,it} from 'vitest';
import {shouldRecoverOrphanedRunSnapshot} from './tactical-expedition-recovery';

describe('Guardian Expedition orphaned run recovery',()=>{
  it('recovers a persisted run snapshot when setup is open but the battle session is gone',()=>{
    expect(shouldRecoverOrphanedRunSnapshot({
      expeditionOpen:true,
      hasSession:false,
      hasRunSnapshot:true,
    })).toBe(true);
  });

  it('never clears the snapshot of a live tactical session',()=>{
    expect(shouldRecoverOrphanedRunSnapshot({
      expeditionOpen:true,
      hasSession:true,
      hasRunSnapshot:true,
    })).toBe(false);
  });

  it('does not mutate persisted run state while expedition is closed or when no snapshot exists',()=>{
    expect(shouldRecoverOrphanedRunSnapshot({
      expeditionOpen:false,
      hasSession:false,
      hasRunSnapshot:true,
    })).toBe(false);
    expect(shouldRecoverOrphanedRunSnapshot({
      expeditionOpen:true,
      hasSession:false,
      hasRunSnapshot:false,
    })).toBe(false);
  });
});
