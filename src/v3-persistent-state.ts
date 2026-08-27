import {emptyCampaignRunState,hydrateCampaignRunState,type CampaignRunState} from './campaign-state';
import {emptyCharacterBondsState,hydrateCharacterBondsState,type CharacterBondsState} from './character-bonds';
import {emptyLegacyState,hydrateLegacyState,type LegacyState} from './legacy-state';
import {sanitizeActivityCheckpoint,type ActivityCheckpoint} from './scene/activity-checkpoint';
import {isV3Record} from './v3-state-sanitize';
import {emptyWorldHistoryState,hydrateWorldHistoryState,type WorldHistoryState} from './world-history';
import {emptyV12PersistentBuildState,hydrateV12PersistentBuildState,type V12PersistentBuildState} from './v12-persistent-builds';

export type V3PersistentState={
  campaignRun:CampaignRunState;
  worldHistory:WorldHistoryState;
  characterBonds:CharacterBondsState;
  legacy:LegacyState;
  v12Builds:V12PersistentBuildState;
  sceneCheckpoint?:ActivityCheckpoint|null;
};

export function emptyV3PersistentState():V3PersistentState{
  return {
    campaignRun:emptyCampaignRunState(),
    worldHistory:emptyWorldHistoryState(),
    characterBonds:emptyCharacterBondsState(),
    legacy:emptyLegacyState(),
    v12Builds:emptyV12PersistentBuildState(),
    sceneCheckpoint:null,
  };
}

function hasLegacyV3Shape(source:Record<string,unknown>):boolean{
  return ['campaignRun','worldHistory','characterBonds','legacy','v12Builds'].some(key=>Object.prototype.hasOwnProperty.call(source,key));
}

export function hydrateV3PersistentState(raw:unknown):V3PersistentState{
  const source=isV3Record(raw)?raw:{};
  const legacySource=isV3Record(source.legacy)?source.legacy:{endingCollection:source.endingCollection};
  const sceneCheckpoint=Object.prototype.hasOwnProperty.call(source,'sceneCheckpoint')
    ? {sceneCheckpoint:sanitizeActivityCheckpoint(source.sceneCheckpoint)}
    : hasLegacyV3Shape(source)
      ? {}
      : {sceneCheckpoint:null};
  return {
    campaignRun:hydrateCampaignRunState(source.campaignRun),
    worldHistory:hydrateWorldHistoryState(source.worldHistory),
    characterBonds:hydrateCharacterBondsState(source.characterBonds),
    legacy:hydrateLegacyState(legacySource),
    v12Builds:hydrateV12PersistentBuildState(source.v12Builds),
    ...sceneCheckpoint,
  };
}

export function pickV3PersistentState(state:V3PersistentState):V3PersistentState{
  const sceneCheckpoint=state.sceneCheckpoint===undefined
    ? {}
    : {sceneCheckpoint:sanitizeActivityCheckpoint(state.sceneCheckpoint)};
  return {
    campaignRun:state.campaignRun,
    worldHistory:state.worldHistory,
    characterBonds:state.characterBonds,
    legacy:state.legacy,
    v12Builds:state.v12Builds,
    ...sceneCheckpoint,
  };
}

export function prepareNewRunState(current:V3PersistentState):V3PersistentState{
  return {
    campaignRun:emptyCampaignRunState(),
    worldHistory:{currentFacts:[],inheritedFacts:[...current.legacy.legacyWorldFacts]},
    characterBonds:emptyCharacterBondsState(),
    legacy:current.legacy,
    v12Builds:current.v12Builds,
    sceneCheckpoint:null,
  };
}