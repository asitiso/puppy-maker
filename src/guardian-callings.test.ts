import { describe, expect, it } from 'vitest';
import { applyCallingSelection, callingSwitchKey, guardianCallingDefinitions } from './guardian-callings';

describe('guardian calling rules', () => {
  it('defines four distinct raising paths', () => {
    expect(guardianCallingDefinitions.map(item => item.id)).toEqual(['vanguard','arcanist','caretaker','pathfinder']);
  });

  it('blocks selection before guardian rank and makes the first selection free', () => {
    const blocked = applyCallingSelection({ current:null, next:'vanguard', guardianRank:'junior', gold:1000, year:1, month:4, lastSwitchKey:null, history:[] });
    expect(blocked).toMatchObject({ changed:false, reason:'rank_locked', gold:1000, current:null });
    const first = applyCallingSelection({ current:null, next:'vanguard', guardianRank:'guardian', gold:0, year:1, month:4, lastSwitchKey:null, history:[] });
    expect(first).toMatchObject({ changed:true, reason:null, gold:0, current:'vanguard', history:['vanguard'] });
  });

  it('charges 300G for later changes and locks a second change in the same month', () => {
    const switched = applyCallingSelection({ current:'vanguard', next:'arcanist', guardianRank:'guardian', gold:500, year:2, month:7, lastSwitchKey:null, history:['vanguard'] });
    expect(switched).toMatchObject({ changed:true, gold:200, current:'arcanist', lastSwitchKey:'2-7', history:['vanguard','arcanist'] });
    const blocked = applyCallingSelection({ current:'arcanist', next:'caretaker', guardianRank:'guardian', gold:500, year:2, month:7, lastSwitchKey:'2-7', history:['vanguard','arcanist'] });
    expect(blocked).toMatchObject({ changed:false, reason:'monthly_lock', current:'arcanist' });
  });

  it('rejects paid switches without enough gold and treats same calling as no-op', () => {
    expect(applyCallingSelection({ current:'vanguard', next:'arcanist', guardianRank:'guardian', gold:299, year:1, month:5, lastSwitchKey:null, history:['vanguard'] })).toMatchObject({ changed:false, reason:'insufficient_gold' });
    expect(applyCallingSelection({ current:'vanguard', next:'vanguard', guardianRank:'guardian', gold:999, year:1, month:5, lastSwitchKey:null, history:['vanguard'] })).toMatchObject({ changed:false, reason:'same_calling', gold:999 });
  });

  it('uses stable year-month switch keys', () => {
    expect(callingSwitchKey(3, 12)).toBe('3-12');
  });
});
