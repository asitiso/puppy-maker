export * from './game-sanctuary-astral-base';

import * as Base from './game-sanctuary-astral-base';
import {
  newlyEarnedSanctuaryGrandRewards,
  sanctuaryGrandProgress,
  type SanctuaryGrandRewardRank,
} from './sanctuary-grand-milestones';

export type GameState = Base.GameState & {
  claimedSanctuaryGrandRanks:SanctuaryGrandRewardRank[];
};

export type Action = Base.Action;

export const initialState:GameState = {
  ...Base.initialState,
  claimedSanctuaryGrandRanks:[],
};

const validRanks:SanctuaryGrandRewardRank[] = ['haven','sanctum','citadel','celestial'];
const isRecord = (value:unknown):value is Record<string,unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

function sanitizeClaimedRanks(raw:unknown):SanctuaryGrandRewardRank[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((value):value is SanctuaryGrandRewardRank =>
    typeof value === 'string' && validRanks.includes(value as SanctuaryGrandRewardRank)
  ))];
}

export function hydrateGameState(raw:unknown):GameState {
  const source = isRecord(raw) ? raw : {};
  return {
    ...Base.hydrateGameState(raw),
    claimedSanctuaryGrandRanks:sanitizeClaimedRanks(source.claimedSanctuaryGrandRanks),
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

export function reducer(state:GameState,action:Action):GameState {
  if (action.type === 'RESET') return initialState;
  const baseNext = Base.reducer(state,action);
  if (baseNext === state) return state;
  const next:GameState = { ...baseNext, claimedSanctuaryGrandRanks:state.claimedSanctuaryGrandRanks ?? [] };
  return applyGrandRewards(state,next);
}
