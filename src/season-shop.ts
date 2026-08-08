import type { GiftItemId } from './adventure';
import type { ExpeditionMaterialId } from './expedition-crafting';
import type { SeasonJourneyKey } from './season-journey';

export type SeasonShopOfferId = 'gold_pouch'|'recovery_bundle'|'expedition_cache'|'seasonal_keepsake';
export type SeasonShopReward = {
  gold:number;
  inventory:Partial<Record<GiftItemId,number>>;
  materials:Partial<Record<ExpeditionMaterialId,number>>;
  keepsake:boolean;
};
export type SeasonShopOffer = { id:SeasonShopOfferId; label:string; cost:number; limit:number; reward:SeasonShopReward };

const offers:SeasonShopOffer[] = [
  { id:'gold_pouch', label:'수호자 골드 주머니', cost:20, limit:2, reward:{ gold:300, inventory:{}, materials:{}, keepsake:false } },
  { id:'recovery_bundle', label:'루나 회복 꾸러미', cost:25, limit:1, reward:{ gold:0, inventory:{ herb_tea:1, star_cookie:1 }, materials:{}, keepsake:false } },
  { id:'expedition_cache', label:'원정 재료 상자', cost:30, limit:1, reward:{ gold:0, inventory:{}, materials:{ star_bark:2, arcane_shard:2, wind_pearl:2 }, keepsake:false } },
  { id:'seasonal_keepsake', label:'계절 기념품', cost:40, limit:1, reward:{ gold:0, inventory:{}, materials:{}, keepsake:true } },
];

export function seasonShopOffers(_seasonKey:SeasonJourneyKey):SeasonShopOffer[] { return offers; }
export function seasonPurchaseKey(seasonKey:SeasonJourneyKey, offerId:SeasonShopOfferId, ordinal:number) {
  return `${seasonKey}:${offerId}:${Math.max(1,Math.floor(ordinal))}` as const;
}

export function resolveSeasonPurchase(input:{ seasonKey:SeasonJourneyKey; offerId:SeasonShopOfferId; tokens:number; purchaseKeys:string[] }) {
  const offer = offers.find(item => item.id === input.offerId);
  if (!offer) return { accepted:false as const };
  const prefix = `${input.seasonKey}:${offer.id}:`;
  const used = input.purchaseKeys.filter(key => key.startsWith(prefix)).length;
  if (used >= offer.limit || input.tokens < offer.cost) return { accepted:false as const };
  return {
    accepted:true as const,
    tokens:input.tokens - offer.cost,
    purchaseKey:seasonPurchaseKey(input.seasonKey,offer.id,used + 1),
    reward:offer.reward,
  };
}
