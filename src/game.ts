export * from './game-tactical-base';

import * as Base from './game-tactical-base';
import {
  gradeTacticalBattle,
  tacticalEncounterDefinitions,
  tacticalEncounterReward,
  updateTacticalRecord,
  type TacticalBattleGrade,
  type TacticalBattleRecord,
  type TacticalEncounterId,
} from './tactical-encounters';
import type { BattleResult } from './tactical-battle';
import { grantBattleBond, type CompanionBondState, type CompanionId } from './tactical-companions';
import { hydrateTacticalPersistentState } from './tactical-state';

export type TacticalBattleRecordMap = Partial<Record<TacticalEncounterId,TacticalBattleRecord>>;
export type PersonalityKey = keyof Base.Personality;

export type GrowthReport = Base.GrowthReport & {
  quality:Base.ResultQuality;
  grade:ReturnType<typeof Base.trainingGrade>;
  mostImprovedStat?:keyof Base.Stats;
  masteryGains?:Partial<Record<Base.ActivityId,number>>;
  personalityChanges?:Partial<Base.Personality>;
  newMemory?:string;
  nextCondition?:Base.Condition;
  goldReward?:number;
};

export type GameState = Omit<Base.GameState,'memories'|'lastGrowthReport'> & {
  memories:any[];
  lastGrowthReport:GrowthReport|null;
  monthsCompleted?:number;
  eventHistory?:string[];
  endingCollection?:string[];
  activeEventId?:string;
  resolvedEnding?:string;
  lastMilestone?:string;
  tacticalBattleRecords:TacticalBattleRecordMap;
  claimedTacticalFirstClears:TacticalEncounterId[];
  selectedTacticalCompanions:CompanionId[];
  tacticalCompanionBonds:Record<CompanionId,CompanionBondState>;
  tacticalAutoBattle:boolean;
  tacticalBattleSpeed:1|2;
};

export type Action = Base.Action | {
  type:'COMPLETE_TACTICAL_BATTLE';
  encounterId:TacticalEncounterId;
  result:BattleResult;
  rounds:number;
  survivingAllies:number;
  damageTaken:number;
  companions?:CompanionId[];
} | {
  type:'SET_TACTICAL_PARTY';
  companions:CompanionId[];
} | {
  type:'SET_TACTICAL_PREFERENCES';
  auto:boolean;
  speed:1|2;
} | {
  type:'NEW_RUN';
} | {
  type:'EVENT_CHOICE';
  eventId:string;
  choiceId:string;
};

const tacticalDefaults = hydrateTacticalPersistentState(undefined);

export const initialState:GameState = {
  ...Base.initialState,
  tacticalBattleRecords:{},
  claimedTacticalFirstClears:[],
  selectedTacticalCompanions:tacticalDefaults.selectedCompanions,
  tacticalCompanionBonds:tacticalDefaults.companionBonds,
  tacticalAutoBattle:tacticalDefaults.autoBattle,
  tacticalBattleSpeed:tacticalDefaults.battleSpeed,
};

const encounterIds = tacticalEncounterDefinitions.map(item => item.id);
const grades:TacticalBattleGrade[] = ['S','A','B','C'];
const companionIds:CompanionId[] = ['bear','owl','wolf','cat'];
const isRecord = (value:unknown):value is Record<string,unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const safeInt = (value:unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0,Math.floor(value)) : 0;

function sanitizeTacticalRecords(raw:unknown):TacticalBattleRecordMap {
  if (!isRecord(raw)) return {};
  const result:TacticalBattleRecordMap = {};
  for (const id of encounterIds) {
    const value = raw[id];
    if (!isRecord(value) || !grades.includes(value.grade as TacticalBattleGrade)) continue;
    const bestRounds = safeInt(value.bestRounds);
    const clearCount = safeInt(value.clearCount);
    if (bestRounds < 1 || clearCount < 1) continue;
    result[id] = { grade:value.grade as TacticalBattleGrade,bestRounds,clearCount };
  }
  return result;
}

function sanitizeTacticalFirstClears(raw:unknown):TacticalEncounterId[] {
  if (!Array.isArray(raw)) return [];
  return encounterIds.filter(id => raw.includes(id));
}

function validParty(raw:unknown):CompanionId[]|null {
  if (!Array.isArray(raw) || raw.length !== 2) return null;
  const companions = raw.filter((value):value is CompanionId => typeof value === 'string' && companionIds.includes(value as CompanionId));
  return companions.length === 2 && companions[0] !== companions[1] ? companions : null;
}

function applyBattleBond(state:GameState, companions:CompanionId[], gain:number) {
  if (!companions.length || gain <= 0) return state.tacticalCompanionBonds;
  const next = { ...state.tacticalCompanionBonds };
  for (const companion of companions) next[companion] = grantBattleBond(next[companion],gain);
  return next;
}

export function hydrateGameState(raw:unknown):GameState {
  const source = isRecord(raw) ? raw : {};
  const base = Base.hydrateGameState(raw);
  const tactical = hydrateTacticalPersistentState({
    selectedCompanions:source.selectedTacticalCompanions,
    companionBonds:source.tacticalCompanionBonds,
    autoBattle:source.tacticalAutoBattle,
    battleSpeed:source.tacticalBattleSpeed,
  });
  return {
    ...base,
    ...(typeof source.monthsCompleted==='number'?{monthsCompleted:Math.max(0,Math.floor(source.monthsCompleted))}:{}),
    ...(Array.isArray(source.eventHistory)?{eventHistory:source.eventHistory.filter((value):value is string=>typeof value==='string')}:{}),
    ...(Array.isArray(source.endingCollection)?{endingCollection:source.endingCollection.filter((value):value is string=>typeof value==='string')}:{}),
    ...(typeof source.activeEventId==='string'?{activeEventId:source.activeEventId}:{}),
    ...(typeof source.resolvedEnding==='string'?{resolvedEnding:source.resolvedEnding}:{}),
    ...(typeof source.lastMilestone==='string'?{lastMilestone:source.lastMilestone}:{}),
    tacticalBattleRecords:sanitizeTacticalRecords(source.tacticalBattleRecords),
    claimedTacticalFirstClears:sanitizeTacticalFirstClears(source.claimedTacticalFirstClears),
    selectedTacticalCompanions:tactical.selectedCompanions,
    tacticalCompanionBonds:tactical.companionBonds,
    tacticalAutoBattle:tactical.autoBattle,
    tacticalBattleSpeed:tactical.battleSpeed,
  } as GameState;
}

export function reducer(state:GameState,action:Action):GameState {
  if (action.type === 'RESET') return initialState;
  if (action.type === 'NEW_RUN' || action.type === 'EVENT_CHOICE') return state;

  if (action.type === 'SET_TACTICAL_PARTY') {
    const companions = validParty(action.companions);
    if (!companions) return state;
    if (companions[0] === state.selectedTacticalCompanions[0] && companions[1] === state.selectedTacticalCompanions[1]) return state;
    return { ...state, selectedTacticalCompanions:companions };
  }

  if (action.type === 'SET_TACTICAL_PREFERENCES') {
    const speed:1|2 = action.speed === 2 ? 2 : 1;
    if (state.tacticalAutoBattle === action.auto && state.tacticalBattleSpeed === speed) return state;
    return { ...state, tacticalAutoBattle:action.auto, tacticalBattleSpeed:speed };
  }

  if (action.type === 'COMPLETE_TACTICAL_BATTLE') {
    if (!encounterIds.includes(action.encounterId)) return state;
    const companions = validParty(action.companions) ?? validParty(state.selectedTacticalCompanions) ?? [];
    const tacticalCompanionBonds = applyBattleBond(state,companions,action.result === 'victory' ? 12 : 3);
    if (action.result !== 'victory') {
      if (tacticalCompanionBonds === state.tacticalCompanionBonds) return state;
      return { ...state, tacticalCompanionBonds };
    }
    const grade = gradeTacticalBattle({
      result:action.result,
      rounds:action.rounds,
      survivingAllies:action.survivingAllies,
      damageTaken:action.damageTaken,
    });
    const firstClear = !state.claimedTacticalFirstClears.includes(action.encounterId);
    const reward = tacticalEncounterReward(action.encounterId,grade,firstClear);
    return {
      ...state,
      tacticalCompanionBonds,
      tacticalBattleRecords:{
        ...state.tacticalBattleRecords,
        [action.encounterId]:updateTacticalRecord(state.tacticalBattleRecords[action.encounterId],{ grade,rounds:action.rounds }),
      },
      claimedTacticalFirstClears:firstClear ? [...state.claimedTacticalFirstClears,action.encounterId] : state.claimedTacticalFirstClears,
      gold:state.gold + reward.gold,
      gems:state.gems + reward.gems,
    };
  }

  const next = Base.reducer(state as Base.GameState,action as Base.Action);
  if (next === state) return state;
  return {
    ...state,
    ...next,
    tacticalBattleRecords:state.tacticalBattleRecords,
    claimedTacticalFirstClears:state.claimedTacticalFirstClears,
    selectedTacticalCompanions:state.selectedTacticalCompanions,
    tacticalCompanionBonds:state.tacticalCompanionBonds,
    tacticalAutoBattle:state.tacticalAutoBattle,
    tacticalBattleSpeed:state.tacticalBattleSpeed,
  } as GameState;
}
