import { describe, expect, it } from 'vitest';
import { activeCallingTraits, canPurchaseGrowthTrait, growthTraitDefinitions, purchaseGrowthTrait } from './growth-traits';

describe('growth trait board', () => {
  it('defines sixteen ordered traits with costs 1,1,2,2 per calling', () => {
    expect(growthTraitDefinitions).toHaveLength(16);
    for (const calling of ['vanguard','arcanist','caretaker','pathfinder'] as const) {
      const path = growthTraitDefinitions.filter(item => item.calling === calling);
      expect(path.map(item => item.tier)).toEqual([1,2,3,4]);
      expect(path.map(item => item.cost)).toEqual([1,1,2,2]);
    }
  });

  it('requires the previous node and available growth points', () => {
    expect(canPurchaseGrowthTrait('vanguard_focus', [], 10)).toBe(false);
    expect(canPurchaseGrowthTrait('vanguard_power', [], 0)).toBe(false);
    expect(canPurchaseGrowthTrait('vanguard_power', [], 1)).toBe(true);
    expect(canPurchaseGrowthTrait('vanguard_focus', ['vanguard_power'], 1)).toBe(true);
  });

  it('requires the complete prerequisite chain instead of trusting an orphaned upper trait', () => {
    expect(canPurchaseGrowthTrait('vanguard_assault', ['vanguard_focus'], 2)).toBe(false);
    expect(canPurchaseGrowthTrait('vanguard_legend', ['vanguard_assault'], 2)).toBe(false);
    expect(canPurchaseGrowthTrait('vanguard_legend', ['vanguard_power','vanguard_focus','vanguard_assault'], 2)).toBe(true);
  });

  it('spends exact points and never duplicates a purchased trait', () => {
    const first = purchaseGrowthTrait('vanguard_power', [], 3);
    expect(first).toEqual({ purchased:true, traits:['vanguard_power'], points:2 });
    const duplicate = purchaseGrowthTrait('vanguard_power', first.traits, first.points);
    expect(duplicate).toEqual({ purchased:false, traits:['vanguard_power'], points:2 });
  });

  it('normalizes malformed growth point balances before checking or spending them', () => {
    expect(canPurchaseGrowthTrait('vanguard_power', [], Number.NaN)).toBe(false);
    expect(canPurchaseGrowthTrait('vanguard_power', [], Number.POSITIVE_INFINITY)).toBe(false);
    expect(canPurchaseGrowthTrait('vanguard_power', [], -3)).toBe(false);
    expect(canPurchaseGrowthTrait('vanguard_assault', ['vanguard_power','vanguard_focus'], 1.9)).toBe(false);
    expect(canPurchaseGrowthTrait('vanguard_power', [], 1.9)).toBe(true);

    expect(purchaseGrowthTrait('vanguard_power', [], Number.NaN)).toEqual({ purchased:false, traits:[], points:0 });
    expect(purchaseGrowthTrait('vanguard_power', [], Number.POSITIVE_INFINITY)).toEqual({ purchased:false, traits:[], points:0 });
    expect(purchaseGrowthTrait('vanguard_power', [], -3)).toEqual({ purchased:false, traits:[], points:0 });
    expect(purchaseGrowthTrait('vanguard_power', [], 1.9)).toEqual({ purchased:true, traits:['vanguard_power'], points:0 });
  });

  it('keeps all purchased traits while only activating the current calling path', () => {
    const owned = ['vanguard_power','arcanist_mana','arcanist_insight'] as const;
    expect(activeCallingTraits('arcanist', [...owned])).toEqual(['arcanist_mana','arcanist_insight']);
    expect(activeCallingTraits('vanguard', [...owned])).toEqual(['vanguard_power']);
    expect(activeCallingTraits(null, [...owned])).toEqual([]);
  });

  it('does not activate orphaned upper-tier traits from corrupted progression state', () => {
    expect(activeCallingTraits('vanguard', ['vanguard_focus'])).toEqual([]);
    expect(activeCallingTraits('vanguard', ['vanguard_power','vanguard_assault'])).toEqual(['vanguard_power']);
    expect(activeCallingTraits('vanguard', ['vanguard_power','vanguard_focus','vanguard_legend'])).toEqual(['vanguard_power','vanguard_focus']);
    expect(activeCallingTraits('vanguard', ['vanguard_power','vanguard_focus','vanguard_assault','vanguard_legend']))
      .toEqual(['vanguard_power','vanguard_focus','vanguard_assault','vanguard_legend']);
  });
});
