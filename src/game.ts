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
import { commitTruePath } from './fifth-path-state';
import {
  contributeToPublicProject,
  deriveLegacyWorldMarkers,
  emptyGenerationalWorldState,
  hydrateGenerationalWorldState,
  startPublicProject,
  type GenerationalWorldState,
  type PublicProjectId,
} from './generational-world';
import { resolveHollowFinalChoice,type HollowFinalChoice } from './hollow-choice';
import { prepareNewPossibilityV3State } from './ngplus-replay';
import { selectCompletedRunHandoff } from './campaign-winter-season';
import { resetTacticalForNgPlus } from './tactical-ngplus-reset';
import { hydrateTacticalPersistentState } from './tactical-state';
import {
  buildAncestorRecord,
  canStartNextGeneration,
  emptyLineageState,
  hydrateLineageState,
  type LineageState,
} from './lineage';
import { weekKey } from './weekly-calendar';
import {
  emptyWeeklyLifeState,
  hydrateWeeklyLifeState,
  selectWeeklyFocus,
  weeklyEventEffect,
  weeklyEventFor,
  weeklyEventResolutionKey,
  type WeeklyFocusId,
  type WeeklyLifeState,
} from './weekly-life';
import {
  emptyV3PersistentState,
  hydrateV3PersistentState,
  pickV3PersistentState,
  type V3PersistentState,
} from './v3-persistent-state';
import {
  acquireEquipment,
  beginRunLoadout,
  endRunLoadout,
  equipItem,
  setOutfit,
  setParty,
  type EquipmentId,
  type PlayableCharacterId,
} from './v12-character-builds';

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

export type GameState = Omit<Base.GameState,'memories'|'lastGrowthReport'> & V3PersistentState & {
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
  weeklyLife:WeeklyLifeState;
  lineage:LineageState;
  generationalWorld:GenerationalWorldState;
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
  type:'START_NEXT_GENERATION';
} | {
  type:'START_PUBLIC_PROJECT';
  projectId:PublicProjectId;
} | {
  type:'COMMIT_TRUE_PATH';
} | {
  type:'RESOLVE_HOLLOW_FINAL_CHOICE';
  choice:HollowFinalChoice;
} | {
  type:'EVENT_CHOICE';
  eventId:string;
  choiceId:string;
} | {
  type:'SELECT_WEEKLY_FOCUS';
  focus:WeeklyFocusId;
} | {
  type:'COMPLETE_WEEKLY_FOCUS';
} | {
  type:'ADVANCE_WEEK';
} | {
  type:'ACQUIRE_V12_EQUIPMENT';
  equipmentId:EquipmentId;
} | {
  type:'SET_V12_EQUIPMENT';
  equipmentId:EquipmentId;
} | {
  type:'SET_V12_OUTFIT';
  outfitId:string;
} | {
  type:'SET_V12_PARTY';
  party:[PlayableCharacterId,PlayableCharacterId,PlayableCharacterId];
  leader:PlayableCharacterId;
} | {
  type:'BEGIN_V12_RUN';
} | {
  type:'END_V12_RUN';
};

const tacticalDefaults = hydrateTacticalPersistentState(undefined);
const v3Defaults = emptyV3PersistentState();

export const initialState:GameState = {
  ...Base.initialState,
  tacticalBattleRecords:{},
  claimedTacticalFirstClears:[],
  selectedTacticalCompanions:tacticalDefaults.selectedCompanions,
  tacticalCompanionBonds:tacticalDefaults.companionBonds,
  tacticalAutoBattle:tacticalDefaults.autoBattle,
  tacticalBattleSpeed:tacticalDefaults.battleSpeed,
  weeklyLife:emptyWeeklyLifeState(),
  lineage:emptyLineageState(),
  generationalWorld:emptyGenerationalWorldState(),
  ...v3Defaults,
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

function resetWeeklySelection(state:WeeklyLifeState):WeeklyLifeState {
  return {...state,focusKey:null,focus:null,completedWeekKey:null,lastEvent:null};
}

function applyWeeklyEffect(state:GameState,event:ReturnType<typeof weeklyEventFor>):GameState {
  const effect=weeklyEventEffect(event);
  const stats={...state.stats} as Base.Stats;
  for(const [key,delta] of Object.entries(effect.stats) as [keyof Base.Stats,number][]){
    stats[key]=Math.max(0,(stats[key]??0)+delta);
  }
  return {...state,gold:Math.max(0,state.gold+effect.gold),stats};
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
  const v3 = hydrateV3PersistentState(source);
  const lineage=hydrateLineageState(source.lineage);
  const generationalWorld=hydrateGenerationalWorldState(source.generationalWorld);
  const hydratedWeeklyLife = hydrateWeeklyLifeState(source.weeklyLife);
  const currentWeekKey = weekKey(base.year,base.month,base.week);
  const weeklyLife:WeeklyLifeState = {
    ...hydratedWeeklyLife,
    focusKey:hydratedWeeklyLife.focusKey===currentWeekKey?currentWeekKey:null,
    focus:hydratedWeeklyLife.focusKey===currentWeekKey?hydratedWeeklyLife.focus:null,
    completedWeekKey:hydratedWeeklyLife.completedWeekKey===currentWeekKey?currentWeekKey:null,
    lastEvent:hydratedWeeklyLife.completedWeekKey===currentWeekKey?hydratedWeeklyLife.lastEvent:null,
  };
  return {
    ...base,
    ...(typeof source.monthsCompleted==='number'?{monthsCompleted:safeInt(source.monthsCompleted)}:{}),
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
    weeklyLife,
    lineage,
    generationalWorld,
    ...v3,
  } as GameState;
}

function withCharacterBuilds(state:GameState,characterBuilds:GameState['v12Builds']['characterBuilds']):GameState {
  if(characterBuilds===state.v12Builds.characterBuilds)return state;
  return {...state,v12Builds:{...state.v12Builds,characterBuilds}};
}

export function reducer(state:GameState,action:Action):GameState {
  if (action.type === 'RESET') return initialState;
  if (action.type === 'START_NEXT_GENERATION') {
    const handoff=selectCompletedRunHandoff(pickV3PersistentState(state));
    if(!canStartNextGeneration({
      year:state.year,
      resolvedEnding:state.resolvedEnding??null,
      campaignCompleted:Boolean(handoff),
    }))return state;
    if(state.lineage.ancestors.some(ancestor=>ancestor.generation===state.lineage.generation))return state;
    const route=state.campaignRun.activeRoute==='hollow'
      ? 'hollow' as const
      : state.campaignRun.activeCampaign;
    const ending=typeof state.resolvedEnding==='string'&&state.resolvedEnding.trim().length>0
      ? state.resolvedEnding
      : handoff?.endingId??null;
    const ancestor=buildAncestorRecord({
      generation:state.lineage.generation,
      yearsLived:state.year,
      route,
      ending,
      guardianRank:Base.currentGuardianStatus(state as Base.GameState).rank,
      personality:state.personality,
      worldFacts:[...state.worldHistory.inheritedFacts,...state.worldHistory.currentFacts],
    });
    const lineage=hydrateLineageState({
      generation:state.lineage.generation+1,
      heritageTraits:ancestor.heritageTraits,
      ancestors:[...state.lineage.ancestors,ancestor],
    });
    const generationalWorld=hydrateGenerationalWorldState({
      legacyMarkers:deriveLegacyWorldMarkers({
        ancestors:lineage.ancestors,
        inheritedFacts:state.worldHistory.inheritedFacts,
      }),
      activeProject:null,
      projectProgress:0,
      completedProjects:state.generationalWorld.completedProjects,
    });
    return {...initialState,lineage,generationalWorld} as GameState;
  }
  if (action.type === 'NEW_RUN') {
    const transition = prepareNewPossibilityV3State(pickV3PersistentState(state));
    if (!transition.started) return state;
    const tactical = resetTacticalForNgPlus(state);
    return {
      ...initialState,
      ...transition.state,
      lineage:state.lineage,
      generationalWorld:state.generationalWorld,
      tacticalBattleRecords:{...tactical.tacticalBattleRecords},
      claimedTacticalFirstClears:[...tactical.claimedTacticalFirstClears],
      selectedTacticalCompanions:[...tactical.selectedTacticalCompanions],
      tacticalCompanionBonds:{...tactical.tacticalCompanionBonds},
      tacticalAutoBattle:tactical.tacticalAutoBattle,
      tacticalBattleSpeed:tactical.tacticalBattleSpeed,
    } as GameState;
  }
  if (action.type === 'COMMIT_TRUE_PATH') {
    const transition=commitTruePath(pickV3PersistentState(state));
    if(!transition.committed)return state;
    return {...state,...transition.state} as GameState;
  }
  if (action.type === 'RESOLVE_HOLLOW_FINAL_CHOICE') {
    const transition=resolveHollowFinalChoice(state.campaignRun,action.choice);
    if(!transition.committed)return state;
    return {...state,campaignRun:transition.state};
  }
  if (action.type === 'EVENT_CHOICE') return state;

  if(action.type==='START_PUBLIC_PROJECT'){
    const generationalWorld=startPublicProject(state.generationalWorld,action.projectId);
    return generationalWorld===state.generationalWorld?state:{...state,generationalWorld};
  }

  if(action.type==='SELECT_WEEKLY_FOCUS'){
    const current=weekKey(state.year,state.month,state.week);
    const weeklyLife=selectWeeklyFocus(state.weeklyLife,current,action.focus);
    return weeklyLife===state.weeklyLife?state:{...state,weeklyLife};
  }

  if(action.type==='COMPLETE_WEEKLY_FOCUS'){
    const current=weekKey(state.year,state.month,state.week);
    const weekly=state.weeklyLife;
    if(weekly.focusKey!==current||!weekly.focus||weekly.completedWeekKey===current) return state;
    const event=weeklyEventFor({
      year:state.year,
      month:state.month,
      week:state.week,
      focus:weekly.focus,
      activeCampaign:state.campaignRun.activeCampaign,
      activeRoute:state.campaignRun.activeRoute,
      runNumber:state.campaignRun.runNumber,
      inheritedFactCount:state.worldHistory.inheritedFacts.length,
      heritageTraits:state.lineage.heritageTraits,
      generation:state.lineage.generation,
      legacyMarkers:state.generationalWorld.legacyMarkers,
      completedProjects:state.generationalWorld.completedProjects,
    });
    const resolutionKey=weeklyEventResolutionKey(state.year,state.month,state.week,event);
    const alreadyResolved=weekly.resolvedEventKeys.includes(resolutionKey);
    const weeklyLife:WeeklyLifeState={
      ...weekly,
      completedWeekKey:current,
      lastEvent:event,
      resolvedEventKeys:alreadyResolved?weekly.resolvedEventKeys:[...weekly.resolvedEventKeys,resolutionKey].slice(-96),
    };
    if(alreadyResolved) return {...state,weeklyLife};
    const generationalWorld=weekly.focus==='world'
      ? contributeToPublicProject(state.generationalWorld,10)
      : state.generationalWorld;
    return {...applyWeeklyEffect(state,event),weeklyLife,generationalWorld};
  }

  if(action.type==='ADVANCE_WEEK'){
    const current=weekKey(state.year,state.month,state.week);
    if(state.weeklyLife.completedWeekKey!==current) return state;
    if(state.week<4){
      return {...state,week:state.week+1,weeklyLife:resetWeeklySelection(state.weeklyLife)};
    }
    const settled=reducer(state,{type:'NEXT_MONTH'} as Action);
    if(settled===state) return state;
    return {...settled,week:1,weeklyLife:resetWeeklySelection(state.weeklyLife)};
  }

  if(action.type==='ACQUIRE_V12_EQUIPMENT'){
    return withCharacterBuilds(state,acquireEquipment(state.v12Builds.characterBuilds,action.equipmentId));
  }

  if(action.type==='SET_V12_EQUIPMENT'){
    return withCharacterBuilds(state,equipItem(state.v12Builds.characterBuilds,action.equipmentId));
  }

  if(action.type==='SET_V12_OUTFIT'){
    return withCharacterBuilds(state,setOutfit(state.v12Builds.characterBuilds,action.outfitId));
  }

  if(action.type==='SET_V12_PARTY'){
    const characterBuilds=setParty(state.v12Builds.characterBuilds,action.party,action.leader);
    if(characterBuilds===state.v12Builds.characterBuilds)return state;
    const companions=action.party.filter((id):id is CompanionId=>id!=='runa'&&companionIds.includes(id as CompanionId));
    return {
      ...state,
      v12Builds:{...state.v12Builds,characterBuilds},
      ...(action.party.includes('runa')&&companions.length===2?{selectedTacticalCompanions:companions}:{}),
    };
  }

  if(action.type==='BEGIN_V12_RUN'){
    return withCharacterBuilds(state,beginRunLoadout(state.v12Builds.characterBuilds));
  }

  if(action.type==='END_V12_RUN'){
    return withCharacterBuilds(state,endRunLoadout(state.v12Builds.characterBuilds));
  }

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
    const rounds = Math.max(1,safeInt(action.rounds));
    const survivingAllies = Math.min(3,safeInt(action.survivingAllies));
    const damageTaken = safeInt(action.damageTaken);
    const grade = gradeTacticalBattle({
      result:action.result,
      rounds,
      survivingAllies,
      damageTaken,
    });
    const firstClear = !state.claimedTacticalFirstClears.includes(action.encounterId);
    const reward = tacticalEncounterReward(action.encounterId,grade,firstClear);
    return {
      ...state,
      tacticalCompanionBonds,
      tacticalBattleRecords:{
        ...state.tacticalBattleRecords,
        [action.encounterId]:updateTacticalRecord(state.tacticalBattleRecords[action.encounterId],{ grade,rounds }),
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
    ...pickV3PersistentState(state),
  } as GameState;
}
