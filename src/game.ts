export * from './game-base';

import * as Base from './game-base';
import {
  expeditionSeasonClaimKey,
  expeditionSeasonKey,
  expeditionSeasonPoints,
  expeditionSeasonTiers,
  type ExpeditionSeasonTier,
} from './expedition-season';
import { expeditionStageDefinitions, type ExpeditionRegionId } from './expedition-regions';
import {
  emptyRegionalRenown,
  regionalRenownLevel,
  regionalRenownReward,
  renownGainForExpedition,
  type RegionalRenownState,
} from './regional-renown';
import {
  advanceWorldContracts,
  emptyWorldContractProgress,
  type WorldContractId,
  type WorldContractProgress,
} from './world-contracts';
import { worldEvent, worldEventExpeditionBonus } from './world-event';
import {
  journeyTierClaimKey,
  newlyEarnedJourneyTiers,
  seasonJourneyKey,
  seasonJourneyPoints,
  type SeasonJourneyAction,
  type SeasonJourneyTierId,
} from './season-journey';
import {
  emptyLiveOpsState,
  hydrateLiveOpsState,
  type LiveOpsPersistentState,
  type SeasonJourneyHistoryEntry,
} from './live-ops-state';
import {
  advanceWeeklyDirectives,
  weeklyDirectiveKey,
  weeklyDirectives,
  type WeeklyDirectiveEvent,
  type WeeklyDirectiveId,
} from './weekly-directives';

export type { ExpeditionSeasonKey, ExpeditionSeasonTier } from './expedition-season';
export type { RegionalRenownState, RegionalRenownLevel } from './regional-renown';
export type { WorldContractId, WorldContractProgress } from './world-contracts';
export type { WorldEventDefinition, WorldEventId } from './world-event';
export type { LiveOpsPersistentState, SeasonJourneyHistoryEntry } from './live-ops-state';
export type { SeasonJourneyKey, SeasonJourneyTierId } from './season-journey';
export type { WeeklyDirectiveId } from './weekly-directives';

export type WorldProgressFeedback = {
  region: ExpeditionRegionId;
  renownGain: number;
  renownLevel: number;
  seasonPoints: number;
  eventSeasonPoints: number;
  eventMaterialBonus: number;
  seasonTiersClaimed: ExpeditionSeasonTier[];
  completedContracts: WorldContractId[];
};

export type LiveOpsProgressFeedback = {
  journeyPoints:number;
  seasonTiersClaimed:SeasonJourneyTierId[];
  weeklyCompleted:WeeklyDirectiveId[];
  tokensEarned:number;
};

export interface GameState extends Base.GameState, LiveOpsPersistentState {
  regionalRenown: RegionalRenownState;
  rewardedRenownLevels: string[];
  expeditionSeasonScores: Record<string, number>;
  claimedExpeditionSeasonTiers: string[];
  worldContractProgress: WorldContractProgress;
  rewardedWorldContracts: string[];
  lastWorldProgress: WorldProgressFeedback | null;
  lastLiveOpsProgress:LiveOpsProgressFeedback | null;
}

export type Action = Base.Action | { type:'CLAIM_EXPEDITION_SEASON_TIER'; tier:ExpeditionSeasonTier };

export const initialState: GameState = {
  ...Base.initialState,
  regionalRenown:emptyRegionalRenown(),
  rewardedRenownLevels:[],
  expeditionSeasonScores:{},
  claimedExpeditionSeasonTiers:[],
  worldContractProgress:emptyWorldContractProgress(),
  rewardedWorldContracts:[],
  lastWorldProgress:null,
  ...emptyLiveOpsState(),
  lastLiveOpsProgress:null,
};

const regionIds: ExpeditionRegionId[] = ['starlight_forest','ancient_city','wind_lakes'];
const contractIds: WorldContractId[] = ['expedition_clear','high_grade','featured_region'];
const materialByRegion = {
  starlight_forest:'star_bark',
  ancient_city:'arcane_shard',
  wind_lakes:'wind_pearl',
} as const;

const isRecord = (value:unknown): value is Record<string,unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const safeInt = (value:unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

function hydrateRegionalRenown(raw:unknown): RegionalRenownState {
  const source = isRecord(raw) ? raw : {};
  const base = emptyRegionalRenown();
  return Object.fromEntries(regionIds.map(region => [region, safeInt(source[region] ?? base[region])])) as RegionalRenownState;
}

function uniqueValidStrings(raw:unknown, predicate:(value:string)=>boolean): string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((value):value is string => typeof value === 'string' && predicate(value)))];
}

function hydrateRewardedRenownLevels(raw:unknown): string[] {
  return uniqueValidStrings(raw, value => /^(starlight_forest|ancient_city|wind_lakes):[2-5]$/.test(value));
}

function hydrateSeasonScores(raw:unknown): Record<string,number> {
  if (!isRecord(raw)) return {};
  const result: Record<string,number> = {};
  for (const [key,value] of Object.entries(raw)) {
    const match = /^(\d+)-(spring|summer|autumn|winter)$/.exec(key);
    if (!match || Number(match[1]) < 1) continue;
    result[key] = safeInt(value);
  }
  return result;
}

function hydrateSeasonClaims(raw:unknown): string[] {
  return uniqueValidStrings(raw, value => {
    const match = /^(\d+)-(spring|summer|autumn|winter):([1-4])$/.exec(value);
    return Boolean(match && Number(match[1]) >= 1);
  });
}

function hydrateWorldContractProgress(raw:unknown): WorldContractProgress {
  const source = isRecord(raw) ? raw : {};
  const base = emptyWorldContractProgress();
  return Object.fromEntries(contractIds.map(id => [id, safeInt(source[id] ?? base[id])])) as WorldContractProgress;
}

function hydrateWorldContractRewards(raw:unknown): string[] {
  return uniqueValidStrings(raw, value => {
    const match = /^(\d+)-(\d+):(expedition_clear|high_grade|featured_region)$/.exec(value);
    if (!match) return false;
    const year = Number(match[1]);
    const month = Number(match[2]);
    return year >= 1 && month >= 1 && month <= 12;
  });
}

export function hydrateGameState(raw:unknown): GameState {
  const base = Base.hydrateGameState(raw);
  const source = isRecord(raw) ? raw : {};
  return {
    ...base,
    regionalRenown:hydrateRegionalRenown(source.regionalRenown),
    rewardedRenownLevels:hydrateRewardedRenownLevels(source.rewardedRenownLevels),
    expeditionSeasonScores:hydrateSeasonScores(source.expeditionSeasonScores),
    claimedExpeditionSeasonTiers:hydrateSeasonClaims(source.claimedExpeditionSeasonTiers),
    worldContractProgress:hydrateWorldContractProgress(source.worldContractProgress),
    rewardedWorldContracts:hydrateWorldContractRewards(source.rewardedWorldContracts),
    lastWorldProgress:null,
    ...hydrateLiveOpsState(source),
    lastLiveOpsProgress:null,
  };
}

function persistentState(state:GameState) {
  return {
    regionalRenown:state.regionalRenown,
    rewardedRenownLevels:state.rewardedRenownLevels,
    expeditionSeasonScores:state.expeditionSeasonScores,
    claimedExpeditionSeasonTiers:state.claimedExpeditionSeasonTiers,
    worldContractProgress:state.worldContractProgress,
    rewardedWorldContracts:state.rewardedWorldContracts,
    seasonJourneyScores:state.seasonJourneyScores,
    claimedSeasonJourneyTiers:state.claimedSeasonJourneyTiers,
    seasonTokenBalances:state.seasonTokenBalances,
    weeklyDirectiveKey:state.weeklyDirectiveKey,
    weeklyDirectiveProgress:state.weeklyDirectiveProgress,
    rewardedWeeklyDirectives:state.rewardedWeeklyDirectives,
    seasonJourneyHistory:state.seasonJourneyHistory,
  };
}

function preservePersistentState(state:GameState, next:Base.GameState): GameState {
  if (next === state) return state;
  return {
    ...next,
    ...persistentState(state),
    lastWorldProgress:state.lastWorldProgress,
    lastLiveOpsProgress:state.lastLiveOpsProgress,
  };
}

function applyRenownRewards(state:GameState, region:ExpeditionRegionId, nextRenown:number, gain:number) {
  const rewarded = [...state.rewardedRenownLevels];
  let gold = 0;
  let gems = 0;
  if (gain > 0) {
    const level = regionalRenownLevel(nextRenown);
    for (let candidate = 2; candidate <= level; candidate += 1) {
      const key = `${region}:${candidate}`;
      if (rewarded.includes(key)) continue;
      const reward = regionalRenownReward(candidate as 2|3|4|5);
      rewarded.push(key);
      gold += reward.gold;
      gems += reward.gems;
    }
  }
  return { rewarded, gold, gems };
}

function applySeasonTierRewards(state:GameState, seasonKey:string, nextScore:number) {
  const claims = [...state.claimedExpeditionSeasonTiers];
  const claimed: ExpeditionSeasonTier[] = [];
  let gold = 0;
  let gems = 0;
  for (const tier of expeditionSeasonTiers) {
    if (nextScore < tier.threshold) continue;
    const key = expeditionSeasonClaimKey(seasonKey as `${number}-${'spring'|'summer'|'autumn'|'winter'}`, tier.tier);
    if (claims.includes(key)) continue;
    claims.push(key);
    claimed.push(tier.tier);
    gold += tier.reward.gold;
    gems += tier.reward.gems;
  }
  return { claims, claimed, gold, gems };
}

function applyLiveOpsAction(state:GameState, next:GameState, journeyAction:SeasonJourneyAction, weeklyEvent?:WeeklyDirectiveEvent):GameState {
  const journeyKey = seasonJourneyKey(state.year,state.month);
  const previousScore = state.seasonJourneyScores[journeyKey] ?? 0;
  const weekKey = weeklyDirectiveKey(state.year,state.month,state.week);
  const directives = weeklyDirectives(state.year,state.month,state.week);
  const weekProgress = state.weeklyDirectiveKey === weekKey ? state.weeklyDirectiveProgress : {};
  const weekly = weeklyEvent
    ? advanceWeeklyDirectives(directives,weekProgress,weeklyEvent,state.rewardedWeeklyDirectives,weekKey)
    : { progress:weekProgress, completed:[], reward:{ journeyPoints:0, tokens:0 } };
  const basePoints = seasonJourneyPoints(journeyAction);
  const gainedPoints = basePoints + weekly.reward.journeyPoints;
  const nextScore = previousScore + gainedPoints;
  const earnedTiers = newlyEarnedJourneyTiers(previousScore,nextScore,state.claimedSeasonJourneyTiers,journeyKey);
  const claims = [...state.claimedSeasonJourneyTiers];
  const rewardedWeekly = [...state.rewardedWeeklyDirectives];
  let gold = 0;
  let gems = 0;
  let tierTokens = 0;
  for (const tier of earnedTiers) {
    claims.push(journeyTierClaimKey(journeyKey,tier.tier));
    gold += tier.reward.gold;
    gems += tier.reward.gems;
    tierTokens += tier.reward.tokens;
  }
  for (const directive of weekly.completed) {
    const rewardKey = `${weekKey}:${directive.id}`;
    if (!rewardedWeekly.includes(rewardKey)) rewardedWeekly.push(rewardKey);
  }
  const tokensEarned = tierTokens + weekly.reward.tokens;
  return {
    ...next,
    seasonJourneyScores:{ ...state.seasonJourneyScores, [journeyKey]:nextScore },
    claimedSeasonJourneyTiers:claims,
    seasonTokenBalances:{ ...state.seasonTokenBalances, [journeyKey]:(state.seasonTokenBalances[journeyKey] ?? 0) + tokensEarned },
    weeklyDirectiveKey:weekKey,
    weeklyDirectiveProgress:weekly.progress,
    rewardedWeeklyDirectives:rewardedWeekly,
    seasonJourneyHistory:state.seasonJourneyHistory,
    gold:next.gold + gold,
    gems:next.gems + gems,
    lastLiveOpsProgress:{
      journeyPoints:gainedPoints,
      seasonTiersClaimed:earnedTiers.map(tier => tier.tier),
      weeklyCompleted:weekly.completed.map(item => item.id),
      tokensEarned,
    },
  };
}

function archiveSeasonIfChanged(previous:GameState, next:GameState):GameState {
  const oldKey = seasonJourneyKey(previous.year,previous.month);
  const newKey = seasonJourneyKey(next.year,next.month);
  if (oldKey === newKey || next.seasonJourneyHistory.some(entry => entry.key === oldKey)) return next;
  const entry:SeasonJourneyHistoryEntry = {
    key:oldKey,
    score:next.seasonJourneyScores[oldKey] ?? 0,
    tiersCompleted:next.claimedSeasonJourneyTiers.filter(key => key.startsWith(`${oldKey}:`)).length,
    tokensEarned:next.seasonTokenBalances[oldKey] ?? 0,
  };
  return {
    ...next,
    seasonJourneyHistory:[...next.seasonJourneyHistory,entry],
    weeklyDirectiveKey:null,
    weeklyDirectiveProgress:{},
  };
}

export function reducer(state:GameState, action:Action): GameState {
  if (action.type === 'RESET') return initialState;

  if (action.type === 'CLAIM_EXPEDITION_SEASON_TIER') {
    const seasonKey = expeditionSeasonKey(state.year, state.month);
    const tier = expeditionSeasonTiers.find(item => item.tier === action.tier);
    if (!tier || (state.expeditionSeasonScores[seasonKey] ?? 0) < tier.threshold) return state;
    const claimKey = expeditionSeasonClaimKey(seasonKey, action.tier);
    if (state.claimedExpeditionSeasonTiers.includes(claimKey)) return state;
    return {
      ...state,
      gold:state.gold + tier.reward.gold,
      gems:state.gems + tier.reward.gems,
      claimedExpeditionSeasonTiers:[...state.claimedExpeditionSeasonTiers, claimKey],
    };
  }

  if (action.type === 'FINISH_EXPEDITION_STAGE') {
    const baseNext = Base.reducer(state, action);
    if (baseNext === state || !baseNext.lastExpeditionResult?.accepted) return state;
    const stage = expeditionStageDefinitions.find(item => item.id === action.stageId);
    if (!stage) return preservePersistentState(state, baseNext);

    const summary = baseNext.lastExpeditionResult;
    const firstBossClear = Boolean(stage.boss && summary.firstClear);
    const renownGain = renownGainForExpedition(summary.grade, firstBossClear);
    const nextRegionalRenown = {
      ...state.regionalRenown,
      [stage.region]:state.regionalRenown[stage.region] + renownGain,
    };
    const renownRewards = applyRenownRewards(state, stage.region, nextRegionalRenown[stage.region], renownGain);

    const event = worldEvent(state.year, state.month);
    const eventBonus = worldEventExpeditionBonus(event, stage.region, summary.grade);
    const seasonKey = expeditionSeasonKey(state.year, state.month);
    const seasonPoints = expeditionSeasonPoints(summary.grade, firstBossClear) + eventBonus.seasonPoints;
    const nextSeasonScore = (state.expeditionSeasonScores[seasonKey] ?? 0) + seasonPoints;
    const expeditionSeasonScores = {
      ...state.expeditionSeasonScores,
      [seasonKey]:nextSeasonScore,
    };
    const seasonRewards = applySeasonTierRewards(state, seasonKey, nextSeasonScore);

    const contracts = advanceWorldContracts({
      year:state.year,
      month:state.month,
      event,
      progress:state.worldContractProgress,
      rewardedKeys:state.rewardedWorldContracts,
      region:stage.region,
      grade:summary.grade,
    });

    const expeditionMaterials = { ...baseNext.expeditionMaterials };
    let lastExpeditionResult = summary;
    if (eventBonus.materialBonus > 0) {
      const material = materialByRegion[stage.region];
      expeditionMaterials[material] += eventBonus.materialBonus;
      lastExpeditionResult = { ...summary, materialReward:summary.materialReward + eventBonus.materialBonus };
    }

    const worldNext:GameState = {
      ...baseNext,
      ...persistentState(state),
      regionalRenown:nextRegionalRenown,
      rewardedRenownLevels:renownRewards.rewarded,
      expeditionSeasonScores,
      claimedExpeditionSeasonTiers:seasonRewards.claims,
      worldContractProgress:contracts.progress,
      rewardedWorldContracts:contracts.rewardedKeys,
      expeditionMaterials,
      lastExpeditionResult,
      gold:baseNext.gold + renownRewards.gold + seasonRewards.gold + contracts.reward.gold,
      gems:baseNext.gems + renownRewards.gems + seasonRewards.gems + contracts.reward.gems,
      lastWorldProgress:{
        region:stage.region,
        renownGain,
        renownLevel:regionalRenownLevel(nextRegionalRenown[stage.region]),
        seasonPoints,
        eventSeasonPoints:eventBonus.seasonPoints,
        eventMaterialBonus:eventBonus.materialBonus,
        seasonTiersClaimed:seasonRewards.claimed,
        completedContracts:contracts.newlyCompleted,
      },
      lastLiveOpsProgress:state.lastLiveOpsProgress,
    };
    return applyLiveOpsAction(state,worldNext,{ kind:'expedition', grade:summary.grade, bossFirstClear:firstBossClear },{ kind:'expedition', grade:summary.grade });
  }

  if (action.type === 'NEXT_MONTH') {
    const baseNext = Base.reducer(state, action);
    if (baseNext === state) return state;
    const preserved:GameState = {
      ...baseNext,
      ...persistentState(state),
      worldContractProgress:emptyWorldContractProgress(),
      lastWorldProgress:null,
      lastLiveOpsProgress:state.lastLiveOpsProgress,
    };
    const grade = Base.trainingGrade(state.trainingScore);
    return archiveSeasonIfChanged(state,applyLiveOpsAction(state,preserved,{ kind:'month_complete', grade }));
  }

  const baseNext = Base.reducer(state, action as Base.Action);
  const next = preservePersistentState(state,baseNext);
  if (next === state) return state;
  if (action.type === 'GO_OUTING') return applyLiveOpsAction(state,next,{ kind:'outing' },{ kind:'outing' });
  if (action.type === 'GIVE_GIFT') return applyLiveOpsAction(state,next,{ kind:'gift' },{ kind:'gift' });
  if (action.type === 'FINISH_TRAINING') return applyLiveOpsAction(state,next,{ kind:'month_complete', grade:Base.trainingGrade(next.trainingScore) },{ kind:'training' });
  return next;
}
