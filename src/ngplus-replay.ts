import {emptyCampaignRunState} from './campaign-state';
import {emptyCharacterBondsState} from './character-bonds';
import {mainCampaignIds} from './campaign-model';
import {selectCompletedRunHandoff} from './campaign-winter-season';
import {
  hydrateLegacyState,
  ngPlusUnlockIds,
  trueClueIds,
  type LegacyState,
  type NgPlusUnlockId,
} from './legacy-state';
import type {V3PersistentState} from './v3-persistent-state';

export function selectNgPlusUnlocks(legacy:LegacyState):NgPlusUnlockId[]{
  const selected=new Set<NgPlusUnlockId>();

  if(legacy.runSummaries.length>0)selected.add('past_life_dialogue');
  if(Object.values(legacy.relationshipEchoes).some(memories=>Array.isArray(memories)&&memories.length>0)){
    selected.add('relationship_reunion');
  }
  if(legacy.legacyWorldFacts.length>0)selected.add('world_echo');

  const completedCampaigns=new Set(legacy.completedCampaigns);
  const clues=new Set(legacy.trueClues);
  const allMainCampaigns=mainCampaignIds.every(id=>completedCampaigns.has(id));
  const allTrueClues=trueClueIds.every(id=>clues.has(id));
  if(allMainCampaigns&&allTrueClues)selected.add('fifth_path_candidate');

  return ngPlusUnlockIds.filter(id=>selected.has(id));
}

function promoteLegacyEchoes(legacy:LegacyState):LegacyState{
  const relationshipEchoes:Record<string,string[]>={};
  for(const [characterId,memories] of Object.entries(legacy.relationshipEchoes)){
    relationshipEchoes[characterId]=Array.isArray(memories)?[...memories]:[];
  }

  const legacyWorldFacts=[...legacy.legacyWorldFacts];
  const trueClues=[...legacy.trueClues];
  for(const summary of legacy.runSummaries){
    legacyWorldFacts.push(...summary.majorWorldOutcomes);
    trueClues.push(...summary.trueClues);
    for(const memory of summary.keyBondMemories){
      const current=relationshipEchoes[memory.characterId]??[];
      relationshipEchoes[memory.characterId]=[...current,memory.memoryId];
    }
  }

  const promoted=hydrateLegacyState({
    ...legacy,
    legacyWorldFacts,
    relationshipEchoes,
    trueClues,
  });
  const ngPlusUnlocks=[...promoted.ngPlusUnlocks,...selectNgPlusUnlocks(promoted)];
  return hydrateLegacyState({...promoted,ngPlusUnlocks});
}

export function prepareNewPossibilityV3State(current:V3PersistentState):
  | {started:false;state:V3PersistentState;reason:'not_ready'}
  | {started:true;state:V3PersistentState;sourceRunNumber:number;nextRunNumber:number}{
  const handoff=selectCompletedRunHandoff(current);
  if(!handoff)return {started:false,state:current,reason:'not_ready'};

  const legacy=promoteLegacyEchoes(current.legacy);
  const nextRunNumber=handoff.runNumber+1;
  const campaignRun={...emptyCampaignRunState(),runNumber:nextRunNumber};
  const state:V3PersistentState={
    campaignRun,
    worldHistory:{currentFacts:[],inheritedFacts:[...legacy.legacyWorldFacts]},
    characterBonds:emptyCharacterBondsState(),
    legacy,
  };
  return {
    started:true,
    state,
    sourceRunNumber:handoff.runNumber,
    nextRunNumber,
  };
}
