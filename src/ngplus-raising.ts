import {mainCampaignIds,type CampaignId,type CharacterId,type MainCampaignId} from './campaign-model';
import {hydrateLegacyState,type LegacyState,type RunSummary} from './legacy-state';
import {pathConvergence,type SpringAffinityEvidence,type SpringPathCandidate} from './spring-raising';

export type NgPlusRelationshipHookKind='reunion'|'shared_reunion'|'possibility_hint';
export type NgPlusRelationshipHook={
  character:CharacterId;
  kind:NgPlusRelationshipHookKind;
  memoryKeys:string[];
  summaryKey:string;
};

export type NgPlusPastLife={
  runNumber:number;
  campaign:CampaignId;
  endingKey:string|null;
  careerKey:string|null;
  memoryKeys:string[];
};

export type NgPlusNormalCandidate=SpringPathCandidate&{legacyReasons:string[]};
export type NgPlusSpecialCandidate={
  id:'fifth_path_candidate';
  kind:'special_candidate';
  reasons:string[];
};

export type NgPlusRaisingReplay={
  pastLife:NgPlusPastLife|null;
  relationshipHooks:NgPlusRelationshipHook[];
  normalCandidates:NgPlusNormalCandidate[];
  specialCandidate:NgPlusSpecialCandidate|null;
};

const representativeByCampaign:Record<MainCampaignId,CharacterId>={
  caretaker:'mira',
  pathfinder:'kael',
  vanguard:'rex',
  arcanist:'selene',
};

const latestRun=(legacy:LegacyState):RunSummary|null=>legacy.runSummaries.at(-1)??null;
const hasUnlock=(legacy:LegacyState,id:'past_life_dialogue'|'relationship_reunion'|'fifth_path_candidate')=>legacy.ngPlusUnlocks.includes(id);
const isMainCampaign=(campaign:CampaignId):campaign is MainCampaignId=>(mainCampaignIds as readonly CampaignId[]).includes(campaign);

function pastLifeFor(legacy:LegacyState):NgPlusPastLife|null{
  if(!hasUnlock(legacy,'past_life_dialogue'))return null;
  const run=latestRun(legacy);
  if(!run)return null;
  return {
    runNumber:run.runNumber,
    campaign:run.campaign,
    endingKey:run.ending,
    careerKey:run.career,
    memoryKeys:run.keyBondMemories.map(item=>item.memoryId),
  };
}

function reunionHooksFor(legacy:LegacyState):NgPlusRelationshipHook[]{
  if(!hasUnlock(legacy,'relationship_reunion'))return [];
  const latest=latestRun(legacy);
  const hooks:NgPlusRelationshipHook[]=[];

  for(const campaign of mainCampaignIds){
    const character=representativeByCampaign[campaign];
    const persisted=legacy.relationshipEchoes[character]??[];
    const summaryMemories=(latest?.keyBondMemories??[])
      .filter(item=>item.characterId===character)
      .map(item=>item.memoryId);
    const memoryKeys=[...new Set([...persisted,...summaryMemories])];
    if(memoryKeys.length){
      hooks.push({character,kind:'reunion',memoryKeys,summaryKey:`ngplus.reunion.${character}`});
    }
  }

  hooks.push({character:'noa',kind:'shared_reunion',memoryKeys:[],summaryKey:'ngplus.reunion.noa.shared'});
  hooks.push({character:'eiden',kind:'shared_reunion',memoryKeys:[],summaryKey:'ngplus.reunion.eiden.shared'});

  if(hasUnlock(legacy,'fifth_path_candidate')){
    hooks.push({character:'lyra',kind:'possibility_hint',memoryKeys:[],summaryKey:'ngplus.hint.lyra.repetition'});
  }
  return hooks;
}

function legacyReasonsFor(candidate:SpringPathCandidate,legacy:LegacyState):string[]{
  const run=latestRun(legacy);
  if(!run||!hasUnlock(legacy,'past_life_dialogue')||!isMainCampaign(run.campaign)||run.campaign!==candidate.campaign)return [];
  const reasons=[`A past ${run.campaign} life leaves a familiar echo.`];
  if(run.career)reasons.push('A former guardian career still feels faintly familiar.');
  if(run.keyBondMemories.length)reasons.push('A remembered bond makes this path feel known.');
  return reasons.slice(0,2);
}

function specialCandidateFor(legacy:LegacyState):NgPlusSpecialCandidate|null{
  if(!hasUnlock(legacy,'fifth_path_candidate'))return null;
  const reasons=legacy.trueClues.slice(0,2).map(clue=>`Legacy clue remembered: ${clue}.`);
  if(reasons.length===0)reasons.push('Several past possibilities overlap in a way that did not exist before.');
  return {id:'fifth_path_candidate',kind:'special_candidate',reasons};
}

export function resolveNgPlusRaisingReplay(
  rawLegacy:unknown,
  evidence:readonly SpringAffinityEvidence[],
):NgPlusRaisingReplay{
  const legacy=hydrateLegacyState(rawLegacy);
  const normalCandidates=pathConvergence(evidence).map(candidate=>({
    ...candidate,
    legacyReasons:legacyReasonsFor(candidate,legacy),
  }));
  return {
    pastLife:pastLifeFor(legacy),
    relationshipHooks:reunionHooksFor(legacy),
    normalCandidates,
    specialCandidate:specialCandidateFor(legacy),
  };
}
