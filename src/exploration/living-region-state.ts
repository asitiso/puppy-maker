import {LIVING_REGION_IDS,type LivingRegionId} from './region-registry';

export const REGION_PROGRESS_PHASES = [
  'unvisited',
  'active',
  'mainQuestInProgress',
  'mainQuestResolved',
  'postResolution',
] as const;

export type RegionProgressPhase = typeof REGION_PROGRESS_PHASES[number];

export type LivingRegionProgress = {
  phase:RegionProgressPhase;
  discoveries:string[];
  completedInteractions:string[];
};

export type LivingRegionState = Record<LivingRegionId,LivingRegionProgress>;

function emptyLivingRegionProgress():LivingRegionProgress {
  return {phase:'unvisited',discoveries:[],completedInteractions:[]};
}

export function emptyLivingRegionState():LivingRegionState {
  return {
    old_shrine:emptyLivingRegionProgress(),
    herb_hills:emptyLivingRegionProgress(),
    expedition_outpost:emptyLivingRegionProgress(),
  };
}

function isRecord(value:unknown):value is Record<string,unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isRegionProgressPhase(value:unknown):value is RegionProgressPhase {
  return typeof value === 'string' && (REGION_PROGRESS_PHASES as readonly string[]).includes(value);
}

function sanitizeStringList(value:unknown):string[] {
  if(!Array.isArray(value)) return [];
  const result:string[]=[];
  for(const entry of value){
    if(typeof entry !== 'string') continue;
    const normalized=entry.trim();
    if(!normalized || result.includes(normalized)) continue;
    result.push(normalized);
  }
  return result;
}

function hydrateLivingRegionProgress(raw:unknown):LivingRegionProgress {
  if(!isRecord(raw)) return emptyLivingRegionProgress();
  return {
    phase:isRegionProgressPhase(raw.phase)?raw.phase:'unvisited',
    discoveries:sanitizeStringList(raw.discoveries),
    completedInteractions:sanitizeStringList(raw.completedInteractions),
  };
}

export function hydrateLivingRegionState(raw:unknown):LivingRegionState {
  const source=isRecord(raw)?raw:{};
  const hydrated=emptyLivingRegionState();
  for(const id of LIVING_REGION_IDS){
    hydrated[id]=hydrateLivingRegionProgress(source[id]);
  }
  return hydrated;
}

function transitionRegionPhase(
  state:LivingRegionState,
  id:LivingRegionId,
  from:RegionProgressPhase,
  to:RegionProgressPhase,
):LivingRegionState {
  const current=state[id];
  if(current.phase!==from) return state;
  return {
    ...state,
    [id]:{...current,phase:to},
  };
}

export function enterLivingRegion(state:LivingRegionState,id:LivingRegionId):LivingRegionState {
  return transitionRegionPhase(state,id,'unvisited','active');
}

export function startLivingRegionMainQuest(state:LivingRegionState,id:LivingRegionId):LivingRegionState {
  return transitionRegionPhase(state,id,'active','mainQuestInProgress');
}

export function resolveLivingRegionMainQuest(state:LivingRegionState,id:LivingRegionId):LivingRegionState {
  return transitionRegionPhase(state,id,'mainQuestInProgress','mainQuestResolved');
}

export function advanceLivingRegionPostResolution(state:LivingRegionState,id:LivingRegionId):LivingRegionState {
  return transitionRegionPhase(state,id,'mainQuestResolved','postResolution');
}

function recordUniqueRegionValue(
  state:LivingRegionState,
  id:LivingRegionId,
  key:'discoveries'|'completedInteractions',
  value:string,
):LivingRegionState {
  const normalized=value.trim();
  const current=state[id];
  if(!normalized || current[key].includes(normalized)) return state;
  return {
    ...state,
    [id]:{
      ...current,
      [key]:[...current[key],normalized],
    },
  };
}

export function recordLivingRegionDiscovery(
  state:LivingRegionState,
  id:LivingRegionId,
  discoveryId:string,
):LivingRegionState {
  return recordUniqueRegionValue(state,id,'discoveries',discoveryId);
}

export function recordLivingRegionInteraction(
  state:LivingRegionState,
  id:LivingRegionId,
  interactionId:string,
):LivingRegionState {
  return recordUniqueRegionValue(state,id,'completedInteractions',interactionId);
}
