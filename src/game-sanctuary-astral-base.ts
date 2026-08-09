export * from './game-sanctuary-constellation-base';

import * as Base from './game-sanctuary-constellation-base';
import {
  astralTrialFor,
  astralTrialPower,
  resolveAstralTrial,
  type AstralTrialGrade,
} from './sanctuary-astral-trials';
import {
  astralBlessingEffects,
  astralBlessings,
  resolveAstralBlessingPurchase,
  type AstralBlessingId,
} from './sanctuary-astral-blessings';
import { constellationProgress } from './sanctuary-constellations';
import { seasonJourneyKey } from './season-journey';

export type AstralTrialRecord = {
  key:string;
  grade:AstralTrialGrade;
  power:number;
};

export type GameState = Base.GameState & {
  astralStarShards:number;
  claimedAstralTrials:string[];
  astralTrialRecords:AstralTrialRecord[];
  purchasedAstralBlessings:AstralBlessingId[];
};

export type Action = Base.Action
  | { type:'CHALLENGE_ASTRAL_TRIAL' }
  | { type:'PURCHASE_ASTRAL_BLESSING'; blessing:AstralBlessingId };

export const initialState:GameState = {
  ...Base.initialState,
  astralStarShards:0,
  claimedAstralTrials:[],
  astralTrialRecords:[],
  purchasedAstralBlessings:[],
};

const claimPattern = /^\d+-(?:[1-9]|1[0-2]):(scholar_trial|wayfarer_trial|guardian_trial|crown_trial)$/;
const grades:AstralTrialGrade[] = ['B','A','S'];
const blessingIds = astralBlessings.map(item => item.id);
const isRecord = (value:unknown):value is Record<string,unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const safeInt = (value:unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0,Math.floor(value)) : 0;

function sanitizeClaims(raw:unknown):string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((value):value is string => typeof value === 'string' && claimPattern.test(value)))];
}

function sanitizeBlessings(raw:unknown):AstralBlessingId[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((value):value is AstralBlessingId => typeof value === 'string' && blessingIds.includes(value as AstralBlessingId)))];
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
    purchasedAstralBlessings:sanitizeBlessings(source.purchasedAstralBlessings),
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
    purchasedAstralBlessings:state.purchasedAstralBlessings ?? [],
  };
}

function applyBlessingEffects(previous:GameState,next:GameState,action:Action):GameState {
  const effects = astralBlessingEffects(previous.purchasedAstralBlessings ?? []);
  let result = next;
  if (action.type === 'FINISH_TRAINING' && effects.trainingPercent > 0) {
    const stats = { ...result.stats };
    for (const key of ['strength','intelligence','magic','morality'] as const) {
      const delta = Math.max(0,next.stats[key] - previous.stats[key]);
      if (delta) stats[key] = Math.min(100,result.stats[key] + delta * effects.trainingPercent / 100);
    }
    result = { ...result, stats };
  }
  if (action.type === 'NEXT_MONTH') {
    const stats = {
      ...result.stats,
      fatigue:Math.max(0,result.stats.fatigue - effects.monthlyRecovery),
      stress:Math.max(0,result.stats.stress - effects.monthlyRecovery),
    };
    const oldKey = seasonJourneyKey(previous.year,previous.month);
    result = {
      ...result,
      stats,
      condition:Base.deriveCondition(stats),
      seasonJourneyScores:{
        ...result.seasonJourneyScores,
        [oldKey]:(result.seasonJourneyScores[oldKey] ?? 0) + effects.monthlyJourneyBonus,
      },
    };
  }
  if (action.type === 'FINISH_EXPEDITION_STAGE' && result.lastExpeditionResult?.accepted && effects.expeditionJourneyBonus > 0) {
    const key = seasonJourneyKey(previous.year,previous.month);
    result = {
      ...result,
      seasonJourneyScores:{ ...result.seasonJourneyScores, [key]:(result.seasonJourneyScores[key] ?? 0) + effects.expeditionJourneyBonus },
    };
  }
  return result;
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

  if (action.type === 'PURCHASE_ASTRAL_BLESSING') {
    const result = resolveAstralBlessingPurchase({
      blessing:action.blessing,
      shards:state.astralStarShards ?? 0,
      purchased:state.purchasedAstralBlessings ?? [],
      trialKeys:state.claimedAstralTrials ?? [],
    });
    if (!result.accepted) return state;
    return {
      ...state,
      astralStarShards:result.shards,
      purchasedAstralBlessings:[...(state.purchasedAstralBlessings ?? []),action.blessing],
    };
  }

  const baseNext = Base.reducer(state,action as Base.Action);
  if (baseNext === state) return state;
  const next = preserveAstral(state,baseNext);
  return applyBlessingEffects(state,next,action);
}
