import { describe, expect, it } from 'vitest';
import { resolveSeasonPurchase, seasonPurchaseKey, seasonShopOffers } from './season-shop';

describe('season shop', () => {
  it('exposes four core offers plus one season-exclusive offer', () => {
    expect(seasonShopOffers('1-spring').map(offer => [offer.id, offer.cost, offer.limit])).toEqual([
      ['gold_pouch',20,2],
      ['recovery_bundle',25,1],
      ['expedition_cache',30,1],
      ['seasonal_keepsake',40,1],
      ['spring_garden_pack',18,1],
    ]);
    expect(seasonShopOffers('1-summer').at(-1)?.id).toBe('summer_lake_cache');
    expect(seasonShopOffers('1-autumn').at(-1)?.id).toBe('autumn_arcane_cache');
    expect(seasonShopOffers('1-winter').at(-1)?.id).toBe('winter_starlight_cache');
  });

  it('makes the Sanctuary use of the shared material cache explicit', () => {
    expect(seasonShopOffers('1-spring').find(offer => offer.id === 'expedition_cache')?.label).toBe('원정·성소 재료 상자');
  });

  it('resolves a valid purchase and emits a deterministic purchase key', () => {
    const result = resolveSeasonPurchase({ seasonKey:'1-spring', offerId:'gold_pouch', tokens:40, purchaseKeys:[] });
    expect(result).toEqual({
      accepted:true,
      tokens:20,
      purchaseKey:seasonPurchaseKey('1-spring','gold_pouch',1),
      reward:{ gold:300, inventory:{}, materials:{}, keepsake:false },
    });
  });

  it('uses the first free purchase ordinal when purchase history is sparse', () => {
    const secondKey = seasonPurchaseKey('1-spring','gold_pouch',2);
    const result = resolveSeasonPurchase({
      seasonKey:'1-spring',
      offerId:'gold_pouch',
      tokens:40,
      purchaseKeys:[secondKey],
    });

    expect(result).toEqual(expect.objectContaining({
      accepted:true,
      purchaseKey:seasonPurchaseKey('1-spring','gold_pouch',1),
    }));
    expect(result.accepted && result.purchaseKey).not.toBe(secondKey);
  });

  it('deduplicates repeated purchase keys before applying the season limit', () => {
    const firstKey = seasonPurchaseKey('1-spring','gold_pouch',1);
    const result = resolveSeasonPurchase({
      seasonKey:'1-spring',
      offerId:'gold_pouch',
      tokens:40,
      purchaseKeys:[firstKey,firstKey],
    });

    expect(result).toEqual(expect.objectContaining({
      accepted:true,
      purchaseKey:seasonPurchaseKey('1-spring','gold_pouch',2),
    }));
  });

  it('rejects a purchase when tokens are insufficient', () => {
    expect(resolveSeasonPurchase({ seasonKey:'1-spring', offerId:'expedition_cache', tokens:29, purchaseKeys:[] })).toEqual({ accepted:false });
  });

  it('enforces per-season purchase limits without affecting another season', () => {
    const used = [seasonPurchaseKey('1-spring','gold_pouch',1), seasonPurchaseKey('1-spring','gold_pouch',2)];
    expect(resolveSeasonPurchase({ seasonKey:'1-spring', offerId:'gold_pouch', tokens:99, purchaseKeys:used })).toEqual({ accepted:false });
    expect(resolveSeasonPurchase({ seasonKey:'1-summer', offerId:'gold_pouch', tokens:99, purchaseKeys:used }).accepted).toBe(true);
  });

  it('returns the configured reward payloads for utility offers', () => {
    expect(resolveSeasonPurchase({ seasonKey:'1-spring', offerId:'recovery_bundle', tokens:99, purchaseKeys:[] })).toEqual(expect.objectContaining({
      accepted:true,
      reward:{ gold:0, inventory:{ herb_tea:1, star_cookie:1 }, materials:{}, keepsake:false },
    }));
    expect(resolveSeasonPurchase({ seasonKey:'1-spring', offerId:'expedition_cache', tokens:99, purchaseKeys:[] })).toEqual(expect.objectContaining({
      accepted:true,
      reward:{ gold:0, inventory:{}, materials:{ star_bark:2, arcane_shard:2, wind_pearl:2 }, keepsake:false },
    }));
    expect(resolveSeasonPurchase({ seasonKey:'1-spring', offerId:'seasonal_keepsake', tokens:99, purchaseKeys:[] })).toEqual(expect.objectContaining({
      accepted:true,
      reward:{ gold:0, inventory:{}, materials:{}, keepsake:true },
    }));
  });

  it('limits season-exclusive offers to their matching season', () => {
    expect(resolveSeasonPurchase({ seasonKey:'1-spring', offerId:'spring_garden_pack', tokens:99, purchaseKeys:[] })).toEqual(expect.objectContaining({
      accepted:true,
      reward:{ gold:0, inventory:{ herb_tea:2 }, materials:{}, keepsake:false },
    }));
    expect(resolveSeasonPurchase({ seasonKey:'1-summer', offerId:'spring_garden_pack', tokens:99, purchaseKeys:[] })).toEqual({ accepted:false });
    expect(resolveSeasonPurchase({ seasonKey:'1-summer', offerId:'summer_lake_cache', tokens:99, purchaseKeys:[] })).toEqual(expect.objectContaining({
      accepted:true,
      reward:{ gold:0, inventory:{}, materials:{ wind_pearl:3 }, keepsake:false },
    }));
  });
});
