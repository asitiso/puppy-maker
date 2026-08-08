import { describe, expect, it } from 'vitest';
import { resolveSeasonPurchase, seasonPurchaseKey, seasonShopOffers } from './season-shop';

describe('season shop', () => {
  it('exposes four fixed offers with seasonal limits', () => {
    expect(seasonShopOffers('1-spring').map(offer => [offer.id, offer.cost, offer.limit])).toEqual([
      ['gold_pouch',20,2],
      ['recovery_bundle',25,1],
      ['expedition_cache',30,1],
      ['seasonal_keepsake',40,1],
    ]);
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
});
