export * from './game-sanctuary-base';

import * as Base from './game-sanctuary-base';
import {
  advanceSanctuaryContracts,
  sanctuaryContractSet,
  sanctuaryPrestigeRank,
  sanctuaryPrestigeReward,
  type SanctuaryContractId,
  type SanctuaryContractKind,
  type SanctuaryPrestigeRankId,
} from './sanctuary-contracts';
import { sanctuaryWeeklyChestReady, sanctuaryWeeklyChestReward } from './sanctuary-weekly-chest';
import {
  resolveSeasonLegacyUnlock,
  seasonLegacyNodes,
  type SeasonLegacyNodeId,
} from './season-legacy-board';
import {
  resolveSanctuarySpecialization,
  sanctuarySpecializations as sanctuarySpecializationDefinitions,
  type SanctuarySpecializationId,
  type SanctuarySpecializationState,
} from './sanctuary-specializations';

export type GameState = Base.GameState & {
  sanctuaryContractWeekKey:string|null;
  sanctuaryContractProgress:Record<string,number>;
  rewardedSanctuaryContracts:string[];
  sanctuaryPrestige:number;
  claimedSanctuaryPrestigeRanks:SanctuaryPrestigeRankId[];
  claimedSanctuaryWeeklyChests:string[];
  unlockedSeasonLegacyNodes:SeasonLegacyNodeId[];
  sanctuarySpecializations:SanctuarySpecializationState;
};

export type Action =
  | Base.Action
  | { type:'UNLOCK_SEASON_LEGACY_NODE'; nodeId:SeasonLegacyNodeId }
  | { type:'SET_SANCTUARY_SPECIALIZATION'; specialization:SanctuarySpecializationId };

export const initialState:GameState = {
  ...Base.initialState,
  sanctuaryContractWeekKey:null,
  sanctuaryContractProgress:{},
  rewardedSanctuaryContracts:[],
  sanctuaryPrestige:0,
  claimedSanctuaryPrestigeRanks:[],
  claimedSanctuaryWeeklyChests:[],
  unlockedSeasonLegacyNodes:[],
  sanctuarySpecializations:{},
};

const contractIds:SanctuaryContractId[] = ['training_focus','field_patrol','warm_bond','guardian_sortie'];
const prestigeRanks:{ id:Exclude<SanctuaryPrestigeRankId,'outpost'>; threshold:number }[] = [
  { id:'haven', threshold:20 },
  { id:'sanctum', threshold:50 },
  { id:'citadel', threshold:100 },
  { id:'celestial', threshold:180 },
];
const seasonLegacyNodeIds = seasonLegacyNodes.map(node => node.id);
const specializationByFacility = new Map(sanctuarySpecializationDefinitions.map(item => [`${item.facility}:${item.id}`,item]));
const weekKeyPattern = /^\d+-(?:[1-9]|1[0-2])-[1-4]$/;
const rewardKeyPattern = /^\d+-(?:[1-9]|1[0-2])-[1-4]:(training_focus|field_patrol|warm_bond|guardian_sortie)$/;
const isRecord = (value:unknown):value is Record<string,unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const safeInt = (value:unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0,Math.floor(value)) : 0;

function sanitizeContractProgress(raw:unknown):Record<string,number> {
  if (!isRecord(raw)) return {};
  const result:Record<string,number> = {};
  for (const id of contractIds) if (Object.prototype.hasOwnProperty.call(raw,id)) result[id] = safeInt(raw[id]);
  return result;
}

function sanitizeRewardedContracts(raw:unknown):string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((value):value is string => typeof value === 'string' && rewardKeyPattern.test(value)))];
}

function sanitizePrestigeRanks(raw:unknown):SanctuaryPrestigeRankId[] {
  const ids:SanctuaryPrestigeRankId[] = ['haven','sanctum','citadel','celestial'];
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((value):value is SanctuaryPrestigeRankId => typeof value === 'string' && ids.includes(value as SanctuaryPrestigeRankId)))];
}

function sanitizeWeeklyChestKeys(raw:unknown):string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((value):value is string => typeof value === 'string' && weekKeyPattern.test(value)))];
}

function sanitizeSeasonLegacyNodes(raw:unknown):SeasonLegacyNodeId[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((value):value is SeasonLegacyNodeId => typeof value === 'string' && seasonLegacyNodeIds.includes(value as SeasonLegacyNodeId)))];
}

function sanitizeSanctuarySpecializations(raw:unknown):SanctuarySpecializationState {
  if (!isRecord(raw)) return {};
  const result:SanctuarySpecializationState = {};
  for (const facility of ['training_hall','archive_library','herb_garden','observatory'] as const) {
    const value = raw[facility];
    if (typeof value !== 'string') continue;
    const definition = specializationByFacility.get(`${facility}:${value}`);
    if (definition) result[facility] = definition.id;
  }
  return result;
}

export function hydrateGameState(raw:unknown):GameState {
  const source = isRecord(raw) ? raw : {};
  return {
    ...Base.hydrateGameState(raw),
    sanctuaryContractWeekKey:typeof source.sanctuaryContractWeekKey === 'string' && weekKeyPattern.test(source.sanctuaryContractWeekKey) ? source.sanctuaryContractWeekKey : null,
    sanctuaryContractProgress:sanitizeContractProgress(source.sanctuaryContractProgress),
    rewardedSanctuaryContracts:sanitizeRewardedContracts(source.rewardedSanctuaryContracts),
    sanctuaryPrestige:safeInt(source.sanctuaryPrestige),
    claimedSanctuaryPrestigeRanks:sanitizePrestigeRanks(source.claimedSanctuaryPrestigeRanks),
    claimedSanctuaryWeeklyChests:sanitizeWeeklyChestKeys(source.claimedSanctuaryWeeklyChests),
    unlockedSeasonLegacyNodes:sanitizeSeasonLegacyNodes(source.unlockedSeasonLegacyNodes),
    sanctuarySpecializations:sanitizeSanctuarySpecializations(source.sanctuarySpecializations),
  };
}

function persistentMeta(state:GameState) {
  return {
    sanctuaryContractWeekKey:state.sanctuaryContractWeekKey ?? null,
    sanctuaryContractProgress:state.sanctuaryContractProgress ?? {},
    rewardedSanctuaryContracts:state.rewardedSanctuaryContracts ?? [],
    sanctuaryPrestige:state.sanctuaryPrestige ?? 0,
    claimedSanctuaryPrestigeRanks:state.claimedSanctuaryPrestigeRanks ?? [],
    claimedSanctuaryWeeklyChests:state.claimedSanctuaryWeeklyChests ?? [],
    unlockedSeasonLegacyNodes:state.unlockedSeasonLegacyNodes ?? [],
    sanctuarySpecializations:state.sanctuarySpecializations ?? {},
  };
}

function actionKind(action:Action):SanctuaryContractKind|null {
  if (action.type === 'FINISH_TRAINING') return 'training';
  if (action.type === 'GO_OUTING') return 'outing';
  if (action.type === 'GIVE_GIFT') return 'gift';
  if (action.type === 'FINISH_EXPEDITION_STAGE') return 'expedition';
  return null;
}

function applyPrestigeRewards(prestige:number,claimed:SanctuaryPrestigeRankId[]) {
  const nextClaimed = [...claimed];
  let gold = 0;
  let gems = 0;
  for (const rank of prestigeRanks) {
    if (prestige < rank.threshold || nextClaimed.includes(rank.id)) continue;
    const reward = sanctuaryPrestigeReward(rank.id);
    nextClaimed.push(rank.id);
    gold += reward.gold;
    gems += reward.gems;
  }
  return { claimed:nextClaimed, gold, gems };
}

function applyContractAction(previous:GameState,next:GameState,kind:SanctuaryContractKind):GameState {
  const key = `${previous.year}-${previous.month}-${previous.week}`;
  const progress = previous.sanctuaryContractWeekKey === key ? (previous.sanctuaryContractProgress ?? {}) : {};
  const contracts = sanctuaryContractSet(previous.year,previous.month,previous.week,previous.sanctuaryLevels);
  if (!contracts.length) return next;
  const rewarded = previous.rewardedSanctuaryContracts ?? [];
  const completedThisWeek = rewarded
    .filter(item => item.startsWith(`${key}:`))
    .map(item => item.slice(key.length + 1));
  const advanced = advanceSanctuaryContracts(contracts,progress,{ kind },completedThisWeek);
  const newlyCompleted = advanced.completed.filter(item => !rewarded.includes(`${key}:${item.id}`));
  const prestigeGain = newlyCompleted.reduce((sum,item) => sum + item.prestige,0);
  const prestige = (previous.sanctuaryPrestige ?? 0) + prestigeGain;
  const rankRewards = applyPrestigeRewards(prestige,previous.claimedSanctuaryPrestigeRanks ?? []);
  const rewardedNext = [...rewarded,...newlyCompleted.map(item => `${key}:${item.id}`)];
  const claimedChests = previous.claimedSanctuaryWeeklyChests ?? [];
  const chestReady = sanctuaryWeeklyChestReady(key,contracts.map(item => item.id),rewardedNext,claimedChests);
  const chestReward = chestReady ? sanctuaryWeeklyChestReward(sanctuaryPrestigeRank(prestige).id) : { gold:0, gems:0 };
  return {
    ...next,
    sanctuaryContractWeekKey:key,
    sanctuaryContractProgress:advanced.progress,
    rewardedSanctuaryContracts:rewardedNext,
    sanctuaryPrestige:prestige,
    claimedSanctuaryPrestigeRanks:rankRewards.claimed,
    claimedSanctuaryWeeklyChests:chestReady ? [...claimedChests,key] : claimedChests,
    gold:next.gold + newlyCompleted.reduce((sum,item) => sum + item.reward.gold,0) + rankRewards.gold + chestReward.gold,
    gems:next.gems + newlyCompleted.reduce((sum,item) => sum + item.reward.gems,0) + rankRewards.gems + chestReward.gems,
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
    };
  }

  if (action.type === 'SET_SANCTUARY_SPECIALIZATION') {
    const result = resolveSanctuarySpecialization({
      specialization:action.specialization,
      levels:state.sanctuaryLevels,
      selected:state.sanctuarySpecializations ?? {},
    });
    if (!result.accepted) return state;
    return { ...state, sanctuarySpecializations:result.selected };
  }

  const baseNext = Base.reducer(state,action as Base.Action);
  if (baseNext === state) return state;
  const next:GameState = { ...baseNext, ...persistentMeta(state) };
  const kind = actionKind(action);
  if (!kind) return next;
  if (kind === 'expedition' && !next.lastExpeditionResult?.accepted) return next;
  return applyContractAction(state,next,kind);
}
