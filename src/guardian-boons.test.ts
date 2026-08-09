import { describe, expect, it } from 'vitest';
import { guardianBoons, resolveGuardianBoonPurchase } from './guardian-boons';

describe('guardian boons', () => {
  it('defines eight sequential boons with escalating costs', () => {
    expect(guardianBoons).toHaveLength(8);
    expect(guardianBoons.map(item => item.cost)).toEqual([5,8,12,16,22,30,40,55]);
    expect(guardianBoons[0].prerequisite).toBeNull();
    expect(guardianBoons[7].prerequisite).toBe(guardianBoons[6].id);
  });

  it('rejects insufficient sigils and locked sequence without mutation', () => {
    const insufficient = resolveGuardianBoonPurchase({ boonId:'dawn_oath', sigils:4, purchased:[] });
    expect(insufficient).toEqual({ accepted:false, sigils:4, purchased:[], reward:{ gold:0, gems:0 } });

    const locked = resolveGuardianBoonPurchase({ boonId:'moon_oath', sigils:20, purchased:[] });
    expect(locked).toEqual({ accepted:false, sigils:20, purchased:[], reward:{ gold:0, gems:0 } });
  });

  it('purchases in sequence and blocks duplicates', () => {
    const first = resolveGuardianBoonPurchase({ boonId:'dawn_oath', sigils:20, purchased:[] });
    expect(first).toEqual({ accepted:true, sigils:15, purchased:['dawn_oath'], reward:{ gold:200, gems:0 } });

    const second = resolveGuardianBoonPurchase({ boonId:'moon_oath', sigils:first.sigils, purchased:first.purchased });
    expect(second).toEqual({ accepted:true, sigils:7, purchased:['dawn_oath','moon_oath'], reward:{ gold:300, gems:0 } });

    const duplicate = resolveGuardianBoonPurchase({ boonId:'dawn_oath', sigils:second.sigils, purchased:second.purchased });
    expect(duplicate).toEqual({ accepted:false, sigils:7, purchased:['dawn_oath','moon_oath'], reward:{ gold:0, gems:0 } });
  });

  it('includes meaningful late-track gem rewards', () => {
    expect(guardianBoons.at(-1)).toEqual(expect.objectContaining({ id:'eternal_covenant', cost:55, reward:{ gold:1200, gems:4 } }));
  });
});
