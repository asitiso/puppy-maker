import {characterBondIdRegistry} from './character-bonds';
import {
  campaignIds,campaignRoutes,characterIds,
  type CampaignId,type CampaignRoute,type CharacterId,
} from './campaign-model';
import {
  isV3Record,safeNonNegativeInt,safeOptionalString,safePositiveInt,uniqueRegistered,
} from './v3-state-sanitize';
import {worldFactIds,type WorldFactId} from './world-history';

export const trueClueIds=['caretaker_life_anomaly','pathfinder_world_route','vanguard_hidden_conflict_record','arcanist_rift_cycle'] as const;
export const ngPlusUnlockIds=['past_life_dialogue','relationship_reunion','world_echo','fifth_path_candidate'] as const;
export const truePathEvidenceIds=[
  'significant_fail_forward','sanctuary_history','astral_history','celestial_history','rift_history',
] as const;
export type TrueClueId=typeof trueClueIds[number];
export type NgPlusUnlockId=typeof ngPlusUnlockIds[number];
export type TruePathEvidenceId=typeof truePathEvidenceIds[number];
export type CharacterMemoryRef={characterId:CharacterId;memoryId:string};

export type RunSummary={
  runNumber:number;
  campaign:CampaignId;
  route:CampaignRoute;
  ending:string|null;
  career:string|null;
  majorWorldOutcomes:WorldFactId[];
  keyBondMemories:CharacterMemoryRef[];
  trueClues:TrueClueId[];
  truePathEvidence:TruePathEvidenceId[];
};

export type LegacyState={
  completedRuns:number;
  completedCampaigns:CampaignId[];
  endingCollection:string[];
  careerCollection:string[];
  trueClues:TrueClueId[];
  legacyWorldFacts:WorldFactId[];
  relationshipEchoes:Partial<Record<CharacterId,string[]>>;
  ngPlusUnlocks:NgPlusUnlockId[];
  runSummaries:RunSummary[];
};

function uniqueStrings(raw:unknown):string[]{
  if(!Array.isArray(raw))return [];
  return [...new Set(raw.map(safeOptionalString).filter((value):value is string=>value!==null))];
}

function validCampaign(value:unknown):value is CampaignId{
  return typeof value==='string'&&(campaignIds as readonly string[]).includes(value);
}
function validRoute(value:unknown):value is CampaignRoute{
  return typeof value==='string'&&(campaignRoutes as readonly string[]).includes(value);
}

function hydrateMemoryRefs(raw:unknown):CharacterMemoryRef[]{
  if(!Array.isArray(raw))return [];
  const out:CharacterMemoryRef[]=[];
  for(const value of raw){
    if(!isV3Record(value)||typeof value.characterId!=='string'||typeof value.memoryId!=='string')continue;
    if(!(characterIds as readonly string[]).includes(value.characterId))continue;
    const characterId=value.characterId as CharacterId;
    if(!characterBondIdRegistry[characterId].memories.includes(value.memoryId))continue;
    if(!out.some(item=>item.characterId===characterId&&item.memoryId===value.memoryId)){
      out.push({characterId,memoryId:value.memoryId});
    }
  }
  return out;
}

function hydrateRelationshipEchoes(raw:unknown):Partial<Record<CharacterId,string[]>>{
  const source=isV3Record(raw)?raw:{};
  const out:Partial<Record<CharacterId,string[]>>={};
  for(const characterId of characterIds){
    const memories=uniqueRegistered(source[characterId],characterBondIdRegistry[characterId].memories);
    if(memories.length)out[characterId]=memories;
  }
  return out;
}

function hydrateRunSummaries(raw:unknown):RunSummary[]{
  if(!Array.isArray(raw))return [];
  const out:RunSummary[]=[];
  const accepted=new Set<number>();
  for(const value of raw){
    if(!isV3Record(value)||!validCampaign(value.campaign)||!validRoute(value.route))continue;
    const runNumber=safePositiveInt(value.runNumber,0);
    if(runNumber<1||accepted.has(runNumber))continue;
    accepted.add(runNumber);
    out.push({
      runNumber,
      campaign:value.campaign,
      route:value.route,
      ending:safeOptionalString(value.ending),
      career:safeOptionalString(value.career),
      majorWorldOutcomes:uniqueRegistered(value.majorWorldOutcomes,worldFactIds),
      keyBondMemories:hydrateMemoryRefs(value.keyBondMemories),
      trueClues:uniqueRegistered(value.trueClues,trueClueIds),
      truePathEvidence:uniqueRegistered(value.truePathEvidence,truePathEvidenceIds),
    });
  }
  return out.sort((a,b)=>a.runNumber-b.runNumber);
}

export function emptyLegacyState():LegacyState{
  return {
    completedRuns:0,completedCampaigns:[],endingCollection:[],careerCollection:[],trueClues:[],legacyWorldFacts:[],relationshipEchoes:{},ngPlusUnlocks:[],runSummaries:[],
  };
}

export function hydrateLegacyState(raw:unknown):LegacyState{
  const source=isV3Record(raw)?raw:{};
  return {
    completedRuns:safeNonNegativeInt(source.completedRuns),
    completedCampaigns:uniqueRegistered(source.completedCampaigns,campaignIds),
    endingCollection:uniqueStrings(source.endingCollection),
    careerCollection:uniqueStrings(source.careerCollection),
    trueClues:uniqueRegistered(source.trueClues,trueClueIds),
    legacyWorldFacts:uniqueRegistered(source.legacyWorldFacts,worldFactIds),
    relationshipEchoes:hydrateRelationshipEchoes(source.relationshipEchoes),
    ngPlusUnlocks:uniqueRegistered(source.ngPlusUnlocks,ngPlusUnlockIds),
    runSummaries:hydrateRunSummaries(source.runSummaries),
  };
}
