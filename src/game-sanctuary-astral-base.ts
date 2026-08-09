export * from './game-sanctuary-constellation-base';

import * as Base from './game-sanctuary-constellation-base';
import {
  astralTrialFor,
  astralTrialPower,
  resolveAstralTrial,
  type AstralTrialGrade,
} from './sanctuary-astral-trials';
import { constellationProgress } from './sanctuary-constellations';

export type AstralTrialRecord = {
  key:string;
  grade:AstralTrialGrade;
  power:number;
};

export type GameState = Base.GameState & {
  astralStarShards:number;
  claimedAstralTrials:string[];
  astralTrialRecords:AstralTrialRecord[];
};

export type Action = Base.Action | { type:'CHALLENGE_ASTRAL_TRIAL' };

export const initialState:GameState = {
  ...Base.initialState,
  astralStarShards:0,
  claimedAstralTrials:[],
  astralTrialRecords:[],
};

const claimPattern = /^\d+-(?:[1-9]|1[0-2]):(scholar_trial|wayfarer_trial|guardian_trial|crown_trial)$/;
const grades:AstralTrialGrade[] = ['B','A','S'];
const isRecord = (value:unknown):value is Record<string,unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const safeInt = (value:unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0,Math.floor(value)) : 0;

function sanitizeClaims(raw:unknown):string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((value):value is string => typeof value === 'string' && claimPattern.test(value)))];
}

function sanitizeRecords(raw:unknown):AstralTrialRecord[] {
  if (!Array.isArray(raw)) return [];
  const result:AstralTrialRecord[] = [];
  for (const item of raw) {
    if (!isRecord(item) || typeof item.key !== 'string' || !claimPattern.test(item.key)) continue;
    if (typeof item.grade !== 'string' || !grades.includes(item.grade as AstralTrialGrade)) continue;
    if (result.some(record => record.key === item.key)) continue;
    result.push({ key:item.key, grade:item.grade as AstralTrialGrade, power:safeInt(item.power) });
  }
  return result;
}

export function hydrateGameState(raw:unknown):GameState {
  const source = isRecord(raw) ? raw : {};
  return {
    ...Base.hydrateGameState(raw),
    astralStarShards:safeInt(source.astralStarShards),
    claimedAstralTrials:sanitizeClaims(source.claimedAstralTrials),
    astralTrialRecords:sanitizeRecords(source.astralTrialRecords),
  };
}

function sanctuaryProgress(state:GameState):number {
  return constellationProgress({
    levels:state.sanctuaryLevels,
    specializationCount:Object.keys(state.sanctuarySpecializations ?? {}).length,
    masterworkCount:state.sanctuaryMasterworks?.length ?? 0,
    prestige:state.sanctuaryPrestige ?? 0,
  });
}

function preserveAstral(state:GameState,next:Base.GameState):GameState {
  if (next === state) return state;
  return {
    ...next,
    astralStarShards:state.astralStarShards ?? 0,
    claimedAstralTrials:state.claimedAstralTrials ?? [],
    astralTrialRecords:state.astralTrialRecords ?? [],
  };
}

export function reducer(state:GameState,action:Action):GameState {
  if (action.type === 'RESET') return initialState;

  if (action.type === 'CHALLENGE_ASTRAL_TRIAL') {
    const trial = astralTrialFor(state.year,state.month);
    const power = astralTrialPower({
      trial:trial.id,
      stats:{
        strength:state.stats.strength,
        intelligence:state.stats.intelligence,
        magic:state.stats.magic,
        morality:state.stats.morality,
      },
      sanctuaryProgress:sanctuaryProgress(state),
      constellationCount:(state.sanctuaryConstellations ?? []).length,
    });
    const result = resolveAstralTrial({
      year:state.year,
      month:state.month,
      power,
      constellations:state.sanctuaryConstellations ?? [],
      claimedKeys:state.claimedAstralTrials ?? [],
    });
    if (!result.accepted) return state;
    return {
      ...state,
      gold:state.gold + result.gold,
      astralStarShards:(state.astralStarShards ?? 0) + result.starShards,
      claimedAstralTrials:[...(state.claimedAstralTrials ?? []),result.key],
      astralTrialRecords:[...(state.astralTrialRecords ?? []),{ key:result.key, grade:result.grade, power }],
    };
  }

  const baseNext = Base.reducer(state,action as Base.Action);
  return preserveAstral(state,baseNext);
}
