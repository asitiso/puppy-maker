import type { SeasonJourneyKey } from './season-journey';
import { isValidSeasonPurchaseKey } from './season-shop';
import type { SeasonKeepsakeMilestoneId } from './season-keepsakes';

export type SeasonJourneyHistoryEntry = {
  key:SeasonJourneyKey;
  score:number;
  tiersCompleted:number;
  tokensEarned:number;
};

export type LiveOpsPersistentState = {
  seasonJourneyScores:Record<string,number>;
  claimedSeasonJourneyTiers:string[];
  seasonTokenBalances:Record<string,number>;
  weeklyDirectiveKey:string|null;
  weeklyDirectiveProgress:Record<string,number>;
  rewardedWeeklyDirectives:string[];
  seasonJourneyHistory:SeasonJourneyHistoryEntry[];
  seasonShopPurchases:string[];
  claimedSeasonKeepsakeMilestones?:SeasonKeepsakeMilestoneId[];
};

const seasonKeyPattern = /^\d+-(spring|summer|autumn|winter)$/;
const seasonTierPattern = /^\d+-(spring|summer|autumn|winter):(10|[1-9])$/;
const weekKeyPattern = /^[1-9]\d*-(?:[1-9]|1[0-2])-[1-4]$/;
const weeklyRewardPattern = /^[1-9]\d*-(?:[1-9]|1[0-2])-[1-4]:(steady_training|field_patrol|warm_bond|guardian_sortie|elite_clear|deep_training|adventure_week|gift_week)$/;
const directiveIdPattern = /^(steady_training|field_patrol|warm_bond|guardian_sortie|elite_clear|deep_training|adventure_week|gift_week)$/;
const keepsakeMilestonePattern = /^(first_keepsake|four_seasons|eight_seasons)$/;
const isRecord = (value:unknown): value is Record<string,unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const safeInt = (value:unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0,Math.floor(value)) : 0;

export function emptyLiveOpsState(): LiveOpsPersistentState {
  return {
    seasonJourneyScores:{},
    claimedSeasonJourneyTiers:[],
    seasonTokenBalances:{},
    weeklyDirectiveKey:null,
    weeklyDirectiveProgress:{},
    rewardedWeeklyDirectives:[],
    seasonJourneyHistory:[],
    seasonShopPurchases:[],
    claimedSeasonKeepsakeMilestones:[],
  };
}

function hydrateNumberMap(raw:unknown, keyPattern:RegExp) {
  if (!isRecord(raw)) return {};
  const result:Record<string,number> = {};
  for (const [key,value] of Object.entries(raw)) {
    if (!keyPattern.test(key)) continue;
    result[key] = safeInt(value);
  }
  return result;
}

function hydrateUniqueStrings(raw:unknown, pattern:RegExp) {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((value):value is string => typeof value === 'string' && pattern.test(value)))];
}

function hydrateHistory(raw:unknown): SeasonJourneyHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  const result:SeasonJourneyHistoryEntry[] = [];
  for (const item of raw) {
    if (!isRecord(item) || typeof item.key !== 'string' || !seasonKeyPattern.test(item.key)) continue;
    if (result.some(entry => entry.key === item.key)) continue;
    result.push({
      key:item.key as SeasonJourneyKey,
      score:safeInt(item.score),
      tiersCompleted:Math.min(10,safeInt(item.tiersCompleted)),
      tokensEarned:safeInt(item.tokensEarned),
    });
  }
  return result;
}

function hydrateShopPurchases(raw:unknown):string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((value):value is string => typeof value === 'string' && isValidSeasonPurchaseKey(value)))];
}

export function hydrateLiveOpsState(raw:unknown): LiveOpsPersistentState {
  const source = isRecord(raw) ? raw : {};
  return {
    seasonJourneyScores:hydrateNumberMap(source.seasonJourneyScores,seasonKeyPattern),
    claimedSeasonJourneyTiers:hydrateUniqueStrings(source.claimedSeasonJourneyTiers,seasonTierPattern),
    seasonTokenBalances:hydrateNumberMap(source.seasonTokenBalances,seasonKeyPattern),
    weeklyDirectiveKey:typeof source.weeklyDirectiveKey === 'string' && weekKeyPattern.test(source.weeklyDirectiveKey) ? source.weeklyDirectiveKey : null,
    weeklyDirectiveProgress:hydrateNumberMap(source.weeklyDirectiveProgress,directiveIdPattern),
    rewardedWeeklyDirectives:hydrateUniqueStrings(source.rewardedWeeklyDirectives,weeklyRewardPattern),
    seasonJourneyHistory:hydrateHistory(source.seasonJourneyHistory),
    seasonShopPurchases:hydrateShopPurchases(source.seasonShopPurchases),
    claimedSeasonKeepsakeMilestones:hydrateUniqueStrings(source.claimedSeasonKeepsakeMilestones,keepsakeMilestonePattern) as SeasonKeepsakeMilestoneId[],
  };
}
