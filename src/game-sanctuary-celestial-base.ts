export * from './game-sanctuary-astral-base';

import * as Base from './game-sanctuary-astral-base';
import {
  celestialHonors,
  newlyEarnedCelestialHonors,
  type CelestialHonorId,
} from './celestial-records';

export type GameState = Base.GameState & {
  claimedCelestialHonors:CelestialHonorId[];
};

export type Action = Base.Action;

export const initialState:GameState = {
  ...Base.initialState,
  claimedCelestialHonors:[],
};

const honorIds = celestialHonors.map(item => item.id);
const isRecord = (value:unknown):value is Record<string,unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

function sanitizeHonors(raw:unknown):CelestialHonorId[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((value):value is CelestialHonorId => typeof value === 'string' && honorIds.includes(value as CelestialHonorId)))];
}

export function hydrateGameState(raw:unknown):GameState {
  const source = isRecord(raw) ? raw : {};
  return {
    ...Base.hydrateGameState(raw),
    claimedCelestialHonors:sanitizeHonors(source.claimedCelestialHonors),
  };
}

function preserveCelestial(state:GameState,next:Base.GameState):GameState {
  if (next === state) return state;
  return { ...next, claimedCelestialHonors:state.claimedCelestialHonors ?? [] };
}

function applyCelestialHonors(previous:GameState,next:GameState):GameState {
  const claimed = previous.claimedCelestialHonors ?? [];
  const earned = newlyEarnedCelestialHonors(next.astralTrialRecords ?? [],claimed);
  if (!earned.length) return next;
  return {
    ...next,
    gold:next.gold + earned.reduce((sum,item) => sum + item.reward.gold,0),
    gems:next.gems + earned.reduce((sum,item) => sum + item.reward.gems,0),
    astralStarShards:(next.astralStarShards ?? 0) + earned.reduce((sum,item) => sum + item.reward.starShards,0),
    claimedCelestialHonors:[...claimed,...earned.map(item => item.id)],
  };
}

export function reducer(state:GameState,action:Action):GameState {
  if (action.type === 'RESET') return initialState;
  const baseNext = Base.reducer(state,action);
  if (baseNext === state) return state;
  const next = preserveCelestial(state,baseNext);
  return action.type === 'CHALLENGE_ASTRAL_TRIAL' ? applyCelestialHonors(state,next) : next;
}
