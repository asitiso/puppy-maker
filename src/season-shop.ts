import type { SeasonJourneyKey } from './season-journey';

export type SeasonShopOfferId = 'gold_cache'|'gem_pouch'|'gift_bundle'|'recovery_kit'|'season_keepsake';
export type SeasonShopReward = { gold:number }|{ gems:number }|{ giftItems:number }|{ recoveryItems:number }|{ keepsake:true };
export type SeasonShopOffer = {
  id:SeasonShopOfferId;
  cost:number;
  limit:number;
  reward:SeasonShopReward;
};

export const seasonShopOffers:SeasonShopOffer[] = [
  { id:'gold_cache', cost:8, limit:5, reward:{ gold:300 } },
  { id:'gem_pouch', cost:12, limit:2, reward:{ gems:3 } },
  { id:'gift_bundle', cost:7, limit:3, reward:{ giftItems:2 } },
  { id:'recovery_kit', cost:6, limit:3, reward:{ recoveryItems:2 } },
  { id:'season_keepsake', cost:20, limit:1, reward:{ keepsake:true } },
];

export function seasonShopPurchaseKey(seasonKey:SeasonJourneyKey, offerId:SeasonShopOfferId, ordinal:number) {
  return `${seasonKey}:${offerId}:${Math.max(1,Math.floor(ordinal))}`;
}

export function seasonShopPurchaseCount(purchases:string[], seasonKey:SeasonJourneyKey, offerId:SeasonShopOfferId) {
  const prefix = `${seasonKey}:${offerId}:`;
  return purchases.filter(key => key.startsWith(prefix)).length;
}

export function canPurchaseSeasonOffer(offer:SeasonShopOffer, tokenBalance:number, purchaseCount:number) {
  return tokenBalance >= offer.cost && purchaseCount < offer.limit;
}

export function seasonShopReward(offerId:SeasonShopOfferId):SeasonShopReward {
  return seasonShopOffers.find(offer => offer.id === offerId)!.reward;
}

export function seasonShopOffer(offerId:string) {
  return seasonShopOffers.find(offer => offer.id === offerId) ?? null;
}
