import type { GiftItemId } from './adventure';
import type { ExpeditionMaterialId } from './expedition-crafting';
import type { SeasonJourneyKey } from './season-journey';

export type SeasonShopOfferId =
  | 'gold_pouch'
  | 'recovery_bundle'
  | 'expedition_cache'
  | 'seasonal_keepsake'
  | 'spring_garden_pack'
  | 'summer_lake_cache'
  | 'autumn_arcane_cache'
  | 'winter_starlight_cache';
export type SeasonShopReward = {
  gold:number;
  inventory:Partial<Record<GiftItemId,number>>;
  materials:Partial<Record<ExpeditionMaterialId,number>>;
  keepsake:boolean;
};
export type SeasonShopOffer = { id:SeasonShopOfferId; label:string; cost:number; limit:number; reward:SeasonShopReward };

const coreOffers:SeasonShopOffer[] = [
  { id:'gold_pouch', label:'수호자 골드 주머니', cost:20, limit:2, reward:{ gold:300, inventory:{}, materials:{}, keepsake:false } },
  { id:'recovery_bundle', label:'루나 회복 꾸러미', cost:25, limit:1, reward:{ gold:0, inventory:{ herb_tea:1, star_cookie:1 }, materials:{}, keepsake:false } },
  { id:'expedition_cache', label:'원정·성소 재료 상자', cost:30, limit:6, reward:{ gold:0, inventory:{}, materials:{ star_bark:3, arcane_shard:3, wind_pearl:3 }, keepsake:false } },
  { id:'seasonal_keepsake', label:'계절 기념품', cost:40, limit:1, reward:{ gold:0, inventory:{}, materials:{}, keepsake:true } },
];

const seasonalOffers:Record<'spring'|'summer'|'autumn'|'winter',SeasonShopOffer> = {
  spring:{ id:'spring_garden_pack', label:'봄 정원 다과', cost:18, limit:1, reward:{ gold:0, inventory:{ herb_tea:2 }, materials:{}, keepsake:false } },
  summer:{ id:'summer_lake_cache', label:'여름 호숫가 상자', cost:18, limit:1, reward:{ gold:0, inventory:{}, materials:{ wind_pearl:3 }, keepsake:false } },
  autumn:{ id:'autumn_arcane_cache', label:'가을 비전 상자', cost:18, limit:1, reward:{ gold:0, inventory:{}, materials:{ arcane_shard:3 }, keepsake:false } },
  winter:{ id:'winter_starlight_cache', label:'겨울 별빛 상자', cost:18, limit:1, reward:{ gold:0, inventory:{}, materials:{ star_bark:3 }, keepsake:false } },
};

function seasonIdFromKey(seasonKey:SeasonJourneyKey) {
  return seasonKey.split('-')[1] as keyof typeof seasonalOffers;
}

export function seasonShopOffers(seasonKey:SeasonJourneyKey):SeasonShopOffer[] {
  return [...coreOffers,seasonalOffers[seasonIdFromKey(seasonKey)]];
}
export function seasonPurchaseKey(seasonKey:SeasonJourneyKey, offerId:SeasonShopOfferId, ordinal:number) {
  return `${seasonKey}:${offerId}:${Math.max(1,Math.floor(ordinal))}` as const;
}

export function isValidSeasonPurchaseKey(value:string):boolean {
  const match = /^(\d+)-(spring|summer|autumn|winter):([a-z_]+):(\d+)$/.exec(value);
  if (!match || Number(match[1]) < 1) return false;
  const seasonKey = `${match[1]}-${match[2]}` as SeasonJourneyKey;
  const offer = seasonShopOffers(seasonKey).find(item => item.id === match[3]);
  const ordinal = Number(match[4]);
  return Boolean(offer && ordinal >= 1 && ordinal <= offer.limit);
}

export function resolveSeasonPurchase(input:{ seasonKey:SeasonJourneyKey; offerId:SeasonShopOfferId; tokens:number; purchaseKeys:string[] }) {
  const offer = seasonShopOffers(input.seasonKey).find(item => item.id === input.offerId);
  if (!offer) return { accepted:false as const };
  const prefix = `${input.seasonKey}:${offer.id}:`;
  const usedOrdinals = new Set<number>();
  for (const key of input.purchaseKeys) {
    if (!key.startsWith(prefix)) continue;
    const rawOrdinal = key.slice(prefix.length);
    if (!/^\d+$/.test(rawOrdinal)) continue;
    const ordinal = Number(rawOrdinal);
    if (ordinal >= 1 && ordinal <= offer.limit) usedOrdinals.add(ordinal);
  }
  if (usedOrdinals.size >= offer.limit || input.tokens < offer.cost) return { accepted:false as const };
  let nextOrdinal = 1;
  while (usedOrdinals.has(nextOrdinal) && nextOrdinal <= offer.limit) nextOrdinal += 1;
  if (nextOrdinal > offer.limit) return { accepted:false as const };
  return {
    accepted:true as const,
    tokens:input.tokens - offer.cost,
    purchaseKey:seasonPurchaseKey(input.seasonKey,offer.id,nextOrdinal),
    reward:offer.reward,
  };
}
