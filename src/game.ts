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

export type { ExpeditionSeasonKey, ExpeditionSeasonTier } from './expedition-season';
export type { RegionalRenownState, RegionalRenownLevel } from './regional-renown';
export type { WorldContractId, WorldContractProgress } from './world-contracts';
export type { WorldEventDefinition, WorldEventId } from './world-event';

export type WorldProgressFeedback = {
  region: ExpeditionRegionId;
  renownGain: number;
  renownLevel: number;
  seasonPoints: number;
  eventSeasonPoints: number;
  eventMaterialBonus: number;
  completedContracts: WorldContractId[];
};

export interface GameState extends Base.GameState {
  regionalRenown: RegionalRenownState;
  rewardedRenownLevels: string[];
  expeditionSeasonScores: Record<string, number>;
  claimedExpeditionSeasonTiers: string[];
  worldContractProgress: WorldContractProgress;
  rewardedWorldContracts: string[];
  lastWorldProgress: WorldProgressFeedback | null;
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
  };
}

function worldState(state:GameState) {
  return {
    regionalRenown:state.regionalRenown,
    rewardedRenownLevels:state.rewardedRenownLevels,
    expeditionSeasonScores:state.expeditionSeasonScores,
    claimedExpeditionSeasonTiers:state.claimedExpeditionSeasonTiers,
    worldContractProgress:state.worldContractProgress,
    rewardedWorldContracts:state.rewardedWorldContracts,
  };
}

function preserveWorldState(state:GameState, next:Base.GameState): GameState {
  if (next === state) return state;
  return { ...next, ...worldState(state), lastWorldProgress:state.lastWorldProgress };
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
    if (!stage) return preserveWorldState(state, baseNext);

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
    const expeditionSeasonScores = {
      ...state.expeditionSeasonScores,
      [seasonKey]:(state.expeditionSeasonScores[seasonKey] ?? 0) + seasonPoints,
    };

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

    return {
      ...baseNext,
      regionalRenown:nextRegionalRenown,
      rewardedRenownLevels:renownRewards.rewarded,
      expeditionSeasonScores,
      claimedExpeditionSeasonTiers:state.claimedExpeditionSeasonTiers,
      worldContractProgress:contracts.progress,
      rewardedWorldContracts:contracts.rewardedKeys,
      expeditionMaterials,
      lastExpeditionResult,
      gold:baseNext.gold + renownRewards.gold + contracts.reward.gold,
      gems:baseNext.gems + renownRewards.gems + contracts.reward.gems,
      lastWorldProgress:{
        region:stage.region,
        renownGain,
        renownLevel:regionalRenownLevel(nextRegionalRenown[stage.region]),
        seasonPoints,
        eventSeasonPoints:eventBonus.seasonPoints,
        eventMaterialBonus:eventBonus.materialBonus,
        completedContracts:contracts.newlyCompleted,
      },
    };
  }

  if (action.type === 'NEXT_MONTH') {
    const baseNext = Base.reducer(state, action);
    if (baseNext === state) return state;
    return {
      ...baseNext,
      ...worldState(state),
      worldContractProgress:emptyWorldContractProgress(),
      lastWorldProgress:null,
    };
  }

  const next = Base.reducer(state, action as Base.Action);
  return preserveWorldState(state, next);
}
