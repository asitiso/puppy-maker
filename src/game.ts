export * from './game-astral-rift-base';

import * as Base from './game-astral-rift-base';
import {
  astralRiftDefinitions,
  astralRiftPower,
  canEnterAstralRift,
  resolveAstralRift,
  updateAstralRiftRecord,
  type AstralRiftId,
  type AstralRiftIntensity,
  type AstralRiftRecord,
  type AstralRiftRecordMap,
} from './astral-rift';
import {
  astralRiftRelics,
  resolveAstralRiftRelicPurchase,
  type AstralRiftRelicId,
} from './astral-rift-relics';
import {
  advanceAstralRiftWeekly,
  astralRiftWeeklyDirectives,
  astralRiftWeeklyKey,
  type AstralRiftDirectiveId,
} from './astral-rift-weekly';
import {
  astralRiftHonors,
  newlyEarnedAstralRiftHonors,
  type AstralRiftHonorId,
} from './astral-rift-honors';
import {
  astralRiftClearCount,
  canEnterConvergence,
  celestialGuardianDefinitions,
  convergencePower,
  resolveConvergence,
  updateConvergenceRecord,
  type CelestialGuardianId,
  type ConvergenceIntensity,
  type ConvergenceRecord,
  type ConvergenceRecordMap,
} from './celestial-convergence';
import {
  guardianBoons,
  resolveGuardianBoonPurchase,
  sanitizeGuardianBoons,
  type GuardianBoonId,
} from './guardian-boons';
import {
  advanceConvergenceWeekly,
  convergenceWeeklyDirectives,
  convergenceWeeklyKey,
  type ConvergenceDirectiveId,
} from './convergence-weekly';
import {
  convergenceHonors,
  newlyEarnedConvergenceHonors,
  type ConvergenceHonorId,
} from './convergence-honors';
import { callingMasteryLevel } from './calling-mastery';
import { celestialAscensionProgress } from './celestial-ascension';
import { sanctuaryGrandProgress } from './sanctuary-grand-milestones';

export type GameState = Base.GameState & {
  astralRiftRecords:AstralRiftRecordMap;
  astralRiftEchoes:number;
  purchasedAstralRiftRelics:AstralRiftRelicId[];
  astralRiftWeeklyKey:string|null;
  astralRiftWeeklyProgress:Record<string,number>;
  rewardedAstralRiftDirectives:string[];
  claimedAstralRiftHonors:AstralRiftHonorId[];
  celestialConvergenceRecords:ConvergenceRecordMap;
  guardianSigils:number;
  purchasedGuardianBoons:GuardianBoonId[];
  convergenceWeeklyKey:string|null;
  convergenceWeeklyProgress:Record<string,number>;
  rewardedConvergenceDirectives:string[];
  claimedConvergenceHonors:ConvergenceHonorId[];
};

export type Action = Base.Action
  | { type:'CLEAR_ASTRAL_RIFT'; riftId:AstralRiftId; intensity:AstralRiftIntensity }
  | { type:'PURCHASE_ASTRAL_RIFT_RELIC'; relicId:AstralRiftRelicId }
  | { type:'CLEAR_CELESTIAL_CONVERGENCE'; guardianId:CelestialGuardianId; intensity:ConvergenceIntensity }
  | { type:'PURCHASE_GUARDIAN_BOON'; boonId:GuardianBoonId };

export const initialState:GameState = {
  ...Base.initialState,
  astralRiftRecords:{},
  astralRiftEchoes:0,
  purchasedAstralRiftRelics:[],
  astralRiftWeeklyKey:null,
  astralRiftWeeklyProgress:{},
  rewardedAstralRiftDirectives:[],
  claimedAstralRiftHonors:[],
  celestialConvergenceRecords:{},
  guardianSigils:0,
  purchasedGuardianBoons:[],
  convergenceWeeklyKey:null,
  convergenceWeeklyProgress:{},
  rewardedConvergenceDirectives:[],
  claimedConvergenceHonors:[],
};

const isRecord = (value:unknown):value is Record<string,unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const safeInt = (value:unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0,Math.floor(value)) : 0;
const validRiftIds = astralRiftDefinitions.map(item => item.id);
const validRelicIds = astralRiftRelics.map(item => item.id);
const validRiftHonorIds = astralRiftHonors.map(item => item.id);
const validGuardianIds = celestialGuardianDefinitions.map(item => item.id);
const validConvergenceHonorIds = convergenceHonors.map(item => item.id);
const riftDirectiveTargets:Record<AstralRiftDirectiveId,number> = { rift_clear:2, high_grade:1, featured_rift:1 };
const convergenceDirectiveTargets:Record<ConvergenceDirectiveId,number> = { convergence_clear:2, high_grade:1, featured_guardian:1 };

function sanitizeRiftRecords(raw:unknown):AstralRiftRecordMap {
  if (!isRecord(raw)) return {};
  const result:AstralRiftRecordMap = {};
  for (const [key,value] of Object.entries(raw)) {
    const [riftId,intensity] = key.split(':');
    if (!validRiftIds.includes(riftId as AstralRiftId) || !['1','2','3'].includes(intensity) || !isRecord(value)) continue;
    if (!['B','A','S'].includes(String(value.grade))) continue;
    const clearCount = safeInt(value.clearCount);
    if (clearCount < 1) continue;
    result[key] = {
      grade:value.grade as AstralRiftRecord['grade'],
      bestPower:safeInt(value.bestPower),
      clearCount,
    };
  }
  return result;
}

function sanitizeConvergenceRecords(raw:unknown):ConvergenceRecordMap {
  if (!isRecord(raw)) return {};
  const result:ConvergenceRecordMap = {};
  for (const [key,value] of Object.entries(raw)) {
    const [guardianId,intensity] = key.split(':');
    if (!validGuardianIds.includes(guardianId as CelestialGuardianId) || !['1','2','3'].includes(intensity) || !isRecord(value)) continue;
    if (!['B','A','S'].includes(String(value.grade))) continue;
    const clearCount = safeInt(value.clearCount);
    if (clearCount < 1) continue;
    result[key] = {
      grade:value.grade as ConvergenceRecord['grade'],
      bestPower:safeInt(value.bestPower),
      clearCount,
    };
  }
  return result;
}

function sanitizeRelics(raw:unknown):AstralRiftRelicId[] {
  if (!Array.isArray(raw)) return [];
  return validRelicIds.filter(id => raw.includes(id));
}

function sanitizeWeeklyKey(raw:unknown):string|null {
  if (typeof raw !== 'string') return null;
  const match = /^(\d+)-(\d+)-([1-4])$/.exec(raw);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  return year >= 1 && month >= 1 && month <= 12 ? `${year}-${month}-${match[3]}` : null;
}

function sanitizeProgress(raw:unknown,targets:Record<string,number>):Record<string,number> {
  if (!isRecord(raw)) return {};
  const result:Record<string,number> = {};
  for (const [id,target] of Object.entries(targets)) {
    if (!(id in raw)) continue;
    result[id] = Math.min(target,safeInt(raw[id]));
  }
  return result;
}

function sanitizeRewardedDirectives(raw:unknown,pattern:RegExp):string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((value):value is string => typeof value === 'string' && pattern.test(value)))];
}

function sanitizeRiftHonors(raw:unknown):AstralRiftHonorId[] {
  if (!Array.isArray(raw)) return [];
  return validRiftHonorIds.filter(id => raw.includes(id));
}

function sanitizeConvergenceHonors(raw:unknown):ConvergenceHonorId[] {
  if (!Array.isArray(raw)) return [];
  return validConvergenceHonorIds.filter(id => raw.includes(id));
}

export function hydrateGameState(raw:unknown):GameState {
  const source = isRecord(raw) ? raw : {};
  return {
    ...Base.hydrateGameState(raw),
    astralRiftRecords:sanitizeRiftRecords(source.astralRiftRecords),
    astralRiftEchoes:safeInt(source.astralRiftEchoes),
    purchasedAstralRiftRelics:sanitizeRelics(source.purchasedAstralRiftRelics),
    astralRiftWeeklyKey:sanitizeWeeklyKey(source.astralRiftWeeklyKey),
    astralRiftWeeklyProgress:sanitizeProgress(source.astralRiftWeeklyProgress,riftDirectiveTargets),
    rewardedAstralRiftDirectives:sanitizeRewardedDirectives(source.rewardedAstralRiftDirectives,/^\d+-(?:[1-9]|1[0-2])-[1-4]:(rift_clear|high_grade|featured_rift)$/),
    claimedAstralRiftHonors:sanitizeRiftHonors(source.claimedAstralRiftHonors),
    celestialConvergenceRecords:sanitizeConvergenceRecords(source.celestialConvergenceRecords),
    guardianSigils:safeInt(source.guardianSigils),
    purchasedGuardianBoons:sanitizeGuardianBoons(source.purchasedGuardianBoons),
    convergenceWeeklyKey:sanitizeWeeklyKey(source.convergenceWeeklyKey),
    convergenceWeeklyProgress:sanitizeProgress(source.convergenceWeeklyProgress,convergenceDirectiveTargets),
    rewardedConvergenceDirectives:sanitizeRewardedDirectives(source.rewardedConvergenceDirectives,/^\d+-(?:[1-9]|1[0-2])-[1-4]:(convergence_clear|high_grade|featured_guardian)$/),
    claimedConvergenceHonors:sanitizeConvergenceHonors(source.claimedConvergenceHonors),
  };
}

function sanctuaryScore(state:Base.GameState):number {
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
    sanctuaryGrandProgress:sanctuaryScore(state),
  });
}

function currentCallingLevel(state:Base.GameState):number {
  if (!state.activeCalling) return 0;
  return callingMasteryLevel(state.callingMastery?.[state.activeCalling] ?? 0);
}

function endgameState(state:GameState) {
  return {
    astralRiftRecords:state.astralRiftRecords,
    astralRiftEchoes:state.astralRiftEchoes,
    purchasedAstralRiftRelics:state.purchasedAstralRiftRelics,
    astralRiftWeeklyKey:state.astralRiftWeeklyKey,
    astralRiftWeeklyProgress:state.astralRiftWeeklyProgress,
    rewardedAstralRiftDirectives:state.rewardedAstralRiftDirectives,
    claimedAstralRiftHonors:state.claimedAstralRiftHonors,
    celestialConvergenceRecords:state.celestialConvergenceRecords,
    guardianSigils:state.guardianSigils,
    purchasedGuardianBoons:state.purchasedGuardianBoons,
    convergenceWeeklyKey:state.convergenceWeeklyKey,
    convergenceWeeklyProgress:state.convergenceWeeklyProgress,
    rewardedConvergenceDirectives:state.rewardedConvergenceDirectives,
    claimedConvergenceHonors:state.claimedConvergenceHonors,
  };
}

export function reducer(state:GameState,action:Action):GameState {
  if (action.type === 'RESET') return initialState;

  if (action.type === 'PURCHASE_GUARDIAN_BOON') {
    const result = resolveGuardianBoonPurchase({ boonId:action.boonId, sigils:state.guardianSigils, purchased:state.purchasedGuardianBoons });
    if (!result.accepted) return state;
    return {
      ...state,
      guardianSigils:result.sigils,
      purchasedGuardianBoons:result.purchased,
      gold:state.gold + result.reward.gold,
      gems:state.gems + result.reward.gems,
    };
  }

  if (action.type === 'CLEAR_CELESTIAL_CONVERGENCE') {
    if (!canEnterConvergence({
      guardianId:action.guardianId,
      intensity:action.intensity,
      riftRecords:state.astralRiftRecords,
      riftRelicCount:state.purchasedAstralRiftRelics.length,
    })) return state;
    const power = convergencePower({
      ascensionScore:ascensionScore(state),
      sanctuaryGrandProgress:sanctuaryScore(state),
      callingMasteryLevel:currentCallingLevel(state),
      astralRiftClearCount:astralRiftClearCount(state.astralRiftRecords),
      riftRelicCount:state.purchasedAstralRiftRelics.length,
      activeCalling:state.activeCalling,
      guardianId:action.guardianId,
    });
    const recordKey = `${action.guardianId}:${action.intensity}`;
    const firstClear = !state.celestialConvergenceRecords[recordKey];
    const resolved = resolveConvergence(action.guardianId,action.intensity,power,firstClear);
    if (!resolved.success) return state;
    const records = updateConvergenceRecord(state.celestialConvergenceRecords,action.guardianId,action.intensity,{ grade:resolved.grade, power });
    const weekKey = convergenceWeeklyKey(state.year,state.month,state.week);
    const directives = convergenceWeeklyDirectives(state.year,state.month,state.week);
    const weekly = advanceConvergenceWeekly({
      directives,
      progress:state.convergenceWeeklyKey === weekKey ? state.convergenceWeeklyProgress : {},
      rewardedKeys:state.rewardedConvergenceDirectives,
      weekKey,
      event:{ guardianId:action.guardianId, grade:resolved.grade, success:true },
    });
    const earnedHonors = newlyEarnedConvergenceHonors(records,state.claimedConvergenceHonors);
    return {
      ...state,
      celestialConvergenceRecords:records,
      guardianSigils:state.guardianSigils + resolved.sigils + weekly.sigils,
      convergenceWeeklyKey:weekKey,
      convergenceWeeklyProgress:weekly.progress,
      rewardedConvergenceDirectives:weekly.rewardedKeys,
      claimedConvergenceHonors:[...state.claimedConvergenceHonors,...earnedHonors.map(item => item.id)],
      gold:state.gold + earnedHonors.reduce((sum,item) => sum + item.reward.gold,0),
      gems:state.gems + earnedHonors.reduce((sum,item) => sum + item.reward.gems,0),
    };
  }

  if (action.type === 'PURCHASE_ASTRAL_RIFT_RELIC') {
    const result = resolveAstralRiftRelicPurchase({
      relicId:action.relicId,
      echoes:state.astralRiftEchoes,
      purchased:state.purchasedAstralRiftRelics,
    });
    if (!result.accepted) return state;
    return { ...state, astralRiftEchoes:result.echoes, purchasedAstralRiftRelics:result.purchased };
  }

  if (action.type === 'CLEAR_ASTRAL_RIFT') {
    const ascension = ascensionScore(state);
    if (!canEnterAstralRift({ riftId:action.riftId, intensity:action.intensity, ascensionScore:ascension, records:state.astralRiftRecords })) return state;
    const power = astralRiftPower({
      ascensionScore:ascension,
      sanctuaryGrandProgress:sanctuaryScore(state),
      callingMasteryLevel:currentCallingLevel(state),
      blessingCount:state.purchasedAstralBlessings?.length ?? 0,
    });
    const recordKey = `${action.riftId}:${action.intensity}`;
    const firstClear = !state.astralRiftRecords[recordKey];
    const resolved = resolveAstralRift(action.riftId,action.intensity,power,firstClear);
    if (!resolved.success) return state;

    const records = updateAstralRiftRecord(state.astralRiftRecords,action.riftId,action.intensity,{ grade:resolved.grade, power });
    const weekKey = astralRiftWeeklyKey(state.year,state.month,state.week);
    const directives = astralRiftWeeklyDirectives(state.year,state.month,state.week);
    const weekly = advanceAstralRiftWeekly({
      directives,
      progress:state.astralRiftWeeklyKey === weekKey ? state.astralRiftWeeklyProgress : {},
      rewardedKeys:state.rewardedAstralRiftDirectives,
      weekKey,
      event:{ riftId:action.riftId, grade:resolved.grade, success:true },
    });
    const earnedHonors = newlyEarnedAstralRiftHonors(records,state.claimedAstralRiftHonors);
    return {
      ...state,
      astralRiftRecords:records,
      astralRiftEchoes:state.astralRiftEchoes + resolved.echoes + weekly.echoes,
      astralRiftWeeklyKey:weekKey,
      astralRiftWeeklyProgress:weekly.progress,
      rewardedAstralRiftDirectives:weekly.rewardedKeys,
      claimedAstralRiftHonors:[...state.claimedAstralRiftHonors,...earnedHonors.map(item => item.id)],
      gold:state.gold + earnedHonors.reduce((sum,item) => sum + item.reward.gold,0),
      gems:state.gems + earnedHonors.reduce((sum,item) => sum + item.reward.gems,0),
    };
  }

  const baseNext = Base.reducer(state,action as Base.Action);
  if (baseNext === state) return state;
  return { ...baseNext, ...endgameState(state) };
}
