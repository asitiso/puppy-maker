import { describe, expect, it } from 'vitest';
import { astralRiftRelics, resolveAstralRiftRelicPurchase } from './astral-rift-relics';

describe('Astral Rift relics', () => {
  it('defines three sequential branches with tier costs 15/30/50', () => {
    expect(astralRiftRelics).toHaveLength(9);
    expect(astralRiftRelics.filter(item => item.branch === 'vanguard').map(item => item.cost)).toEqual([15,30,50]);
    expect(astralRiftRelics.filter(item => item.branch === 'arcane').map(item => item.cost)).toEqual([15,30,50]);
    expect(astralRiftRelics.filter(item => item.branch === 'wayfinder').map(item => item.cost)).toEqual([15,30,50]);
  });

  it('buys a root relic and deducts echoes', () => {
    const result = resolveAstralRiftRelicPurchase({ relicId:'vanguard_seed', echoes:20, purchased:[] });
    expect(result).toEqual({ accepted:true, echoes:5, purchased:['vanguard_seed'] });
  });

  it('rejects insufficient, duplicate and missing-prerequisite purchases', () => {
    expect(resolveAstralRiftRelicPurchase({ relicId:'vanguard_seed', echoes:14, purchased:[] }).accepted).toBe(false);
    expect(resolveAstralRiftRelicPurchase({ relicId:'vanguard_seed', echoes:50, purchased:['vanguard_seed'] }).accepted).toBe(false);
    expect(resolveAstralRiftRelicPurchase({ relicId:'vanguard_core', echoes:99, purchased:[] }).accepted).toBe(false);
  });

  it('unlocks deeper relics sequentially', () => {
    const tier2 = resolveAstralRiftRelicPurchase({ relicId:'vanguard_core', echoes:60, purchased:['vanguard_seed'] });
    expect(tier2).toEqual({ accepted:true, echoes:30, purchased:['vanguard_seed','vanguard_core'] });
    const tier3 = resolveAstralRiftRelicPurchase({ relicId:'vanguard_crown', echoes:80, purchased:tier2.purchased });
    expect(tier3).toEqual({ accepted:true, echoes:30, purchased:['vanguard_seed','vanguard_core','vanguard_crown'] });
  });
});
