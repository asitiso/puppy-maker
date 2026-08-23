import {emptyCampaignRunState} from './campaign-state';
import {emptyCharacterBondsState} from './character-bonds';
import {selectCompletedRunHandoff} from './campaign-winter-season';
import {resolveFifthPathEligibility} from './fifth-path-eligibility';
import {
  hydrateLegacyState,
  ngPlusUnlockIds,
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
  if(resolveFifthPathEligibility(legacy).eligible)selected.add('fifth_path_candidate');

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
  return hydrateLegacyState({
    ...promoted,
    ngPlusUnlocks:selectNgPlusUnlocks(promoted),
  });
}

const trueEndingIdPattern=/^v3:true_path:([a-z][a-z0-9_]{0,63}):([a-z][a-z0-9_]{0,63}):([a-z][a-z0-9_]{0,63})$/;

function selectCompletedTruePathHandoff(current:V3PersistentState):{runNumber:number}|null{
  const run=current.campaignRun;
  if(
    run.activeCampaign!=='true_path'||
    !run.seasonMilestones.includes('ending_committed')||
    run.majorOutcomes.long_night===undefined
  )return null;

  const summary=current.legacy.runSummaries.find(item=>item.runNumber===run.runNumber&&item.campaign==='true_path');
  if(!summary)return null;
  const match=trueEndingIdPattern.exec(summary.ending);
  if(!match||summary.career!==match[3])return null;
  return {runNumber:run.runNumber};
}

export function prepareNewPossibilityV3State(current:V3PersistentState):
  | {started:false;state:V3PersistentState;reason:'not_ready'}
  | {started:true;state:V3PersistentState;sourceRunNumber:number;nextRunNumber:number}{
  const handoff=selectCompletedRunHandoff(current)??selectCompletedTruePathHandoff(current);
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
