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

export type TacticalBattleRecordMap = Partial<Record<TacticalEncounterId,TacticalBattleRecord>>;

export type GameState = Base.GameState & {
  tacticalBattleRecords:TacticalBattleRecordMap;
  claimedTacticalFirstClears:TacticalEncounterId[];
};

export type Action = Base.Action | {
  type:'COMPLETE_TACTICAL_BATTLE';
  encounterId:TacticalEncounterId;
  result:BattleResult;
  rounds:number;
  survivingAllies:number;
  damageTaken:number;
};

export const initialState:GameState = {
  ...Base.initialState,
  tacticalBattleRecords:{},
  claimedTacticalFirstClears:[],
};

const encounterIds = tacticalEncounterDefinitions.map(item => item.id);
const grades:TacticalBattleGrade[] = ['S','A','B','C'];
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

export function hydrateGameState(raw:unknown):GameState {
  const source = isRecord(raw) ? raw : {};
  return {
    ...Base.hydrateGameState(raw),
    tacticalBattleRecords:sanitizeTacticalRecords(source.tacticalBattleRecords),
    claimedTacticalFirstClears:sanitizeTacticalFirstClears(source.claimedTacticalFirstClears),
  };
}

export function reducer(state:GameState,action:Action):GameState {
  if (action.type === 'RESET') return initialState;

  if (action.type === 'COMPLETE_TACTICAL_BATTLE') {
    if (action.result !== 'victory' || !encounterIds.includes(action.encounterId)) return state;
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
      tacticalBattleRecords:{
        ...state.tacticalBattleRecords,
        [action.encounterId]:updateTacticalRecord(state.tacticalBattleRecords[action.encounterId],{ grade,rounds:action.rounds }),
      },
      claimedTacticalFirstClears:firstClear ? [...state.claimedTacticalFirstClears,action.encounterId] : state.claimedTacticalFirstClears,
      gold:state.gold + reward.gold,
      gems:state.gems + reward.gems,
    };
  }

  const next = Base.reducer(state,action as Base.Action);
  if (next === state) return state;
  return {
    ...next,
    tacticalBattleRecords:state.tacticalBattleRecords,
    claimedTacticalFirstClears:state.claimedTacticalFirstClears,
  };
}
