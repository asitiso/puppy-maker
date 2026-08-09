export * from './game-sanctuary-celestial-base';

import * as Base from './game-sanctuary-celestial-base';
import {
  newlyEarnedSanctuaryGrandRewards,
  sanctuaryGrandProgress,
  type SanctuaryGrandRewardRank,
} from './sanctuary-grand-milestones';
import {
  resolveSeasonLegacyUnlock,
  seasonLegacyNodes,
  type SeasonLegacyNodeId,
} from './season-legacy-board';
import {
  celestialAscensionProgress,
  newlyEarnedAscensionRewards,
  type CelestialAscensionRewardRank,
} from './celestial-ascension';

export type GameState = Base.GameState & {
  claimedSanctuaryGrandRanks:SanctuaryGrandRewardRank[];
  unlockedSeasonLegacyNodes:SeasonLegacyNodeId[];
  claimedCelestialAscensionRanks:CelestialAscensionRewardRank[];
};

export type Action = Base.Action | { type:'UNLOCK_SEASON_LEGACY_NODE'; nodeId:SeasonLegacyNodeId };

export const initialState:GameState = {
  ...Base.initialState,
  claimedSanctuaryGrandRanks:[],
  unlockedSeasonLegacyNodes:[],
  claimedCelestialAscensionRanks:[],
};

const validRanks:SanctuaryGrandRewardRank[] = ['haven','sanctum','citadel','celestial'];
const validLegacyNodes = seasonLegacyNodes.map(node => node.id);
const validAscensionRanks:CelestialAscensionRewardRank[] = ['awakened','stellar','empyrean','transcendent'];
const isRecord = (value:unknown):value is Record<string,unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

function sanitizeClaimedRanks(raw:unknown):SanctuaryGrandRewardRank[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((value):value is SanctuaryGrandRewardRank =>
    typeof value === 'string' && validRanks.includes(value as SanctuaryGrandRewardRank)
  ))];
}

function sanitizeLegacyNodes(raw:unknown):SeasonLegacyNodeId[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((value):value is SeasonLegacyNodeId =>
    typeof value === 'string' && validLegacyNodes.includes(value as SeasonLegacyNodeId)
  ))];
}

function sanitizeAscensionRanks(raw:unknown):CelestialAscensionRewardRank[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((value):value is CelestialAscensionRewardRank =>
    typeof value === 'string' && validAscensionRanks.includes(value as CelestialAscensionRewardRank)
  ))];
}

export function hydrateGameState(raw:unknown):GameState {
  const source = isRecord(raw) ? raw : {};
  return {
    ...Base.hydrateGameState(raw),
    claimedSanctuaryGrandRanks:sanitizeClaimedRanks(source.claimedSanctuaryGrandRanks),
    unlockedSeasonLegacyNodes:sanitizeLegacyNodes(source.unlockedSeasonLegacyNodes),
    claimedCelestialAscensionRanks:sanitizeAscensionRanks(source.claimedCelestialAscensionRanks),
  };
}

function grandScore(state:Base.GameState):number {
  return sanctuaryGrandProgress({
    levels:state.sanctuaryLevels,
    specializationCount:Object.keys(state.sanctuarySpecializations ?? {}).length,
    masterworkCount:state.sanctuaryMasterworks?.length ?? 0,
    prestige:state.sanctuaryPrestige ?? 0,
  });
}

function ascensionScore(state:Base.GameState):number {
  return celestialAscensionProgress({
    trialRecords:state.astralTrialRecords ?? [],
    blessingCount:state.purchasedAstralBlessings?.length ?? 0,
    constellationCount:state.sanctuaryConstellations?.length ?? 0,
    sanctuaryGrandProgress:grandScore(state),
  });
}

function applyGrandRewards(previous:GameState,next:GameState):GameState {
  const claimed = previous.claimedSanctuaryGrandRanks ?? [];
  const earned = newlyEarnedSanctuaryGrandRewards(grandScore(next),claimed);
  if (!earned.length) return { ...next, claimedSanctuaryGrandRanks:claimed };
  return {
    ...next,
    claimedSanctuaryGrandRanks:[...claimed,...earned.map(item => item.rank)],
    gold:next.gold + earned.reduce((sum,item) => sum + item.reward.gold,0),
    gems:next.gems + earned.reduce((sum,item) => sum + item.reward.gems,0),
  };
}

function applyAscensionRewards(previous:GameState,next:GameState):GameState {
  const claimed = previous.claimedCelestialAscensionRanks ?? [];
  const earned = newlyEarnedAscensionRewards(ascensionScore(next),claimed);
  if (!earned.length) return { ...next, claimedCelestialAscensionRanks:claimed };
  return {
    ...next,
    claimedCelestialAscensionRanks:[...claimed,...earned.map(item => item.rank)],
    gold:next.gold + earned.reduce((sum,item) => sum + item.reward.gold,0),
    gems:next.gems + earned.reduce((sum,item) => sum + item.reward.gems,0),
    astralStarShards:(next.astralStarShards ?? 0) + earned.reduce((sum,item) => sum + item.reward.starShards,0),
  };
}

export function reducer(state:GameState,action:Action):GameState {
  if (action.type === 'RESET') return initialState;

  if (action.type === 'UNLOCK_SEASON_LEGACY_NODE') {
    const result = resolveSeasonLegacyUnlock({
      nodeId:action.nodeId,
      history:state.seasonJourneyHistory,
      honors:state.claimedSeasonCompletionHonors ?? [],
      unlocked:state.unlockedSeasonLegacyNodes ?? [],
    });
    if (!result.accepted) return state;
    return {
      ...state,
      unlockedSeasonLegacyNodes:result.unlocked,
      gold:state.gold + result.reward.gold,
      gems:state.gems + result.reward.gems,
      claimedCelestialAscensionRanks:state.claimedCelestialAscensionRanks ?? [],
    };
  }

  const baseNext = Base.reducer(state,action);
  if (baseNext === state) return state;
  const next:GameState = {
    ...baseNext,
    claimedSanctuaryGrandRanks:state.claimedSanctuaryGrandRanks ?? [],
    unlockedSeasonLegacyNodes:state.unlockedSeasonLegacyNodes ?? [],
    claimedCelestialAscensionRanks:state.claimedCelestialAscensionRanks ?? [],
  };
  const withGrandRewards = applyGrandRewards(state,next);
  return applyAscensionRewards(state,withGrandRewards);
}
