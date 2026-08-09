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
import { callingMasteryLevel } from './calling-mastery';
import { celestialAscensionProgress } from './celestial-ascension';
import { sanctuaryGrandProgress } from './sanctuary-grand-milestones';
import {
  resolveSeasonLegacyUnlock,
  seasonLegacyNodes,
  type SeasonLegacyNodeId,
} from './season-legacy-board';

export type GameState = Base.GameState & {
  astralRiftRecords:AstralRiftRecordMap;
  astralRiftEchoes:number;
  purchasedAstralRiftRelics:AstralRiftRelicId[];
  astralRiftWeeklyKey:string|null;
  astralRiftWeeklyProgress:Record<string,number>;
  rewardedAstralRiftDirectives:string[];
  claimedAstralRiftHonors:AstralRiftHonorId[];
  unlockedSeasonLegacyNodes:SeasonLegacyNodeId[];
};

export type Action = Base.Action
  | { type:'CLEAR_ASTRAL_RIFT'; riftId:AstralRiftId; intensity:AstralRiftIntensity }
  | { type:'PURCHASE_ASTRAL_RIFT_RELIC'; relicId:AstralRiftRelicId }
  | { type:'UNLOCK_SEASON_LEGACY_NODE'; nodeId:SeasonLegacyNodeId };

export const initialState:GameState = {
  ...Base.initialState,
  astralRiftRecords:{},
  astralRiftEchoes:0,
  purchasedAstralRiftRelics:[],
  astralRiftWeeklyKey:null,
  astralRiftWeeklyProgress:{},
  rewardedAstralRiftDirectives:[],
  claimedAstralRiftHonors:[],
  unlockedSeasonLegacyNodes:[],
};

const isRecord = (value:unknown):value is Record<string,unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const safeInt = (value:unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0,Math.floor(value)) : 0;
const validRiftIds = astralRiftDefinitions.map(item => item.id);
const validRelicIds = astralRiftRelics.map(item => item.id);
const validHonorIds = astralRiftHonors.map(item => item.id);
const validLegacyNodeIds = seasonLegacyNodes.map(item => item.id);
const directiveTargets:Record<AstralRiftDirectiveId,number> = { rift_clear:2, high_grade:1, featured_rift:1 };

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

function sanitizeWeeklyProgress(raw:unknown):Record<string,number> {
  if (!isRecord(raw)) return {};
  const result:Record<string,number> = {};
  for (const id of Object.keys(directiveTargets) as AstralRiftDirectiveId[]) {
    if (!(id in raw)) continue;
    result[id] = Math.min(directiveTargets[id],safeInt(raw[id]));
  }
  return result;
}

function sanitizeRewardedDirectives(raw:unknown):string[] {
  if (!Array.isArray(raw)) return [];
  const valid = raw.filter((value):value is string => typeof value === 'string' && /^\d+-(?:[1-9]|1[0-2])-[1-4]:(rift_clear|high_grade|featured_rift)$/.test(value));
  return [...new Set(valid)];
}

function sanitizeHonors(raw:unknown):AstralRiftHonorId[] {
  if (!Array.isArray(raw)) return [];
  return validHonorIds.filter(id => raw.includes(id));
}

function sanitizeLegacyNodes(raw:unknown):SeasonLegacyNodeId[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((value):value is SeasonLegacyNodeId => typeof value === 'string' && validLegacyNodeIds.includes(value as SeasonLegacyNodeId)))];
}

export function hydrateGameState(raw:unknown):GameState {
  const source = isRecord(raw) ? raw : {};
  return {
    ...Base.hydrateGameState(raw),
    astralRiftRecords:sanitizeRiftRecords(source.astralRiftRecords),
    astralRiftEchoes:safeInt(source.astralRiftEchoes),
    purchasedAstralRiftRelics:sanitizeRelics(source.purchasedAstralRiftRelics),
    astralRiftWeeklyKey:sanitizeWeeklyKey(source.astralRiftWeeklyKey),
    astralRiftWeeklyProgress:sanitizeWeeklyProgress(source.astralRiftWeeklyProgress),
    rewardedAstralRiftDirectives:sanitizeRewardedDirectives(source.rewardedAstralRiftDirectives),
    claimedAstralRiftHonors:sanitizeHonors(source.claimedAstralRiftHonors),
    unlockedSeasonLegacyNodes:sanitizeLegacyNodes(source.unlockedSeasonLegacyNodes),
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

function metaState(state:GameState) {
  return {
    astralRiftRecords:state.astralRiftRecords,
    astralRiftEchoes:state.astralRiftEchoes,
    purchasedAstralRiftRelics:state.purchasedAstralRiftRelics,
    astralRiftWeeklyKey:state.astralRiftWeeklyKey,
    astralRiftWeeklyProgress:state.astralRiftWeeklyProgress,
    rewardedAstralRiftDirectives:state.rewardedAstralRiftDirectives,
    claimedAstralRiftHonors:state.claimedAstralRiftHonors,
    unlockedSeasonLegacyNodes:state.unlockedSeasonLegacyNodes,
  };
}

export function reducer(state:GameState,action:Action):GameState {
  if (action.type === 'RESET') return initialState;

  if (action.type === 'UNLOCK_SEASON_LEGACY_NODE') {
    const result = resolveSeasonLegacyUnlock({
      nodeId:action.nodeId,
      history:state.seasonJourneyHistory,
      honors:state.claimedSeasonCompletionHonors ?? [],
      unlocked:state.unlockedSeasonLegacyNodes,
    });
    if (!result.accepted) return state;
    return {
      ...state,
      unlockedSeasonLegacyNodes:result.unlocked,
      gold:state.gold + result.reward.gold,
      gems:state.gems + result.reward.gems,
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
  return { ...baseNext, ...metaState(state) };
}
