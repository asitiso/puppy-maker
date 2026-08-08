import { describe, expect, it } from 'vitest';
import { seasonShopOffers, seasonShopPurchaseCount, seasonShopPurchaseKey, seasonShopReward, canPurchaseSeasonOffer } from './season-shop';

describe('season shop', () => {
  it('offers a compact useful seasonal catalog', () => {
    expect(seasonShopOffers.map(offer => offer.id)).toEqual(['gold_cache','gem_pouch','gift_bundle','recovery_kit','season_keepsake']);
  });

  it('builds deterministic seasonal purchase keys and counts purchases', () => {
    expect(seasonShopPurchaseKey('1-spring','gem_pouch',1)).toBe('1-spring:gem_pouch:1');
    expect(seasonShopPurchaseCount(['1-spring:gem_pouch:1','1-spring:gem_pouch:2','1-summer:gem_pouch:1'],'1-spring','gem_pouch')).toBe(2);
  });

  it('rejects insufficient tokens and exhausted limited offers', () => {
    const gem = seasonShopOffers.find(offer => offer.id === 'gem_pouch')!;
    expect(canPurchaseSeasonOffer(gem,gem.cost - 1,0)).toBe(false);
    expect(canPurchaseSeasonOffer(gem,gem.cost,gem.limit)).toBe(false);
    expect(canPurchaseSeasonOffer(gem,gem.cost,0)).toBe(true);
  });

  it('returns deterministic reward payloads', () => {
    expect(seasonShopReward('gold_cache')).toEqual({ gold:300 });
    expect(seasonShopReward('gem_pouch')).toEqual({ gems:3 });
    expect(seasonShopReward('gift_bundle')).toEqual({ giftItems:2 });
    expect(seasonShopReward('recovery_kit')).toEqual({ recoveryItems:2 });
    expect(seasonShopReward('season_keepsake')).toEqual({ keepsake:true });
  });
});
