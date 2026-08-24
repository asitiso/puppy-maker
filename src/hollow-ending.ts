import {resolveModularEnding,type ModularEnding} from './campaign-winter-season';
import {sanitizeCampaignSeasonalObjectiveClaimKeys} from './campaign-seasonal-claim-keys';
import {hydrateLegacyState} from './legacy-state';
import type {MajorOutcomeResult} from './campaign-model';
import type {V3PersistentState} from './v3-persistent-state';
import type {WorldFactId} from './world-history';

export type HollowOutcomeCost='none'|'high';
export type HollowMemoryId='veyr_hollow_victory'|'veyr_hollow_costly_victory'|'veyr_hollow_defeat';

export type AcceptedHollowOutcome={
  accepted:true;
  outcome:MajorOutcomeResult;
  memoryId:HollowMemoryId;
  failForward:true;
};

export function resolveHollowOutcome(input:{battleResult:unknown;cost:unknown}):
  | AcceptedHollowOutcome
  | {accepted:false;reason:'invalid_outcome'}{
  if((input.battleResult!=='victory'&&input.battleResult!=='defeat')||(input.cost!=='none'&&input.cost!=='high')){
    return {accepted:false,reason:'invalid_outcome'};
  }
  if(input.battleResult==='defeat'){
    return {accepted:true,outcome:'defeat',memoryId:'veyr_hollow_defeat',failForward:true};
  }
  if(input.cost==='high'){
    return {accepted:true,outcome:'costly_victory',memoryId:'veyr_hollow_costly_victory',failForward:true};
  }
  return {accepted:true,outcome:'victory',memoryId:'veyr_hollow_victory',failForward:true};
}

function hasWinterClaim(state:V3PersistentState):boolean{
  return sanitizeCampaignSeasonalObjectiveClaimKeys(state.campaignRun.claimedSeasonalObjectives)
    .includes(`${state.campaignRun.runNumber}-winter:hollow:hollow_winter_veyr_convergence`);
}

export function commitHollowOutcome(state:V3PersistentState,result:AcceptedHollowOutcome):
  | {committed:true;state:V3PersistentState;reward:{kind:'hollow_memory';memoryId:HollowMemoryId}}
  | {committed:false;state:V3PersistentState;reason:'not_ready'|'already_committed'}{
  const run=state.campaignRun;
  if(run.activeRoute!=='hollow')return {committed:false,state,reason:'not_ready'};
  if(
    run.majorOutcomes.long_night!==undefined||
    run.seasonMilestones.includes('winter_resolved')||
    run.claimedCampaignRewards.includes('winter_resolved')
  ){
    return {committed:false,state,reason:'already_committed'};
  }
  if(
    run.dangerState.finalChoiceResolution!=='accepted'||
    run.activeCampaign===null||
    run.phase!=='winter'||
    !run.seasonMilestones.includes('autumn_resolved')||
    !hasWinterClaim(state)
  ){
    return {committed:false,state,reason:'not_ready'};
  }
  const memories=[...state.characterBonds.veyr.memories];
  if(!memories.includes(result.memoryId))memories.push(result.memoryId);
  const failForwardOutcomes=result.outcome==='defeat'&&!run.failForwardOutcomes.includes('long_night')
    ? [...run.failForwardOutcomes,'long_night' as const]
    : run.failForwardOutcomes;
  return {
    committed:true,
    reward:{kind:'hollow_memory',memoryId:result.memoryId},
    state:{
      ...state,
      campaignRun:{
        ...run,
        phase:'ending',
        majorOutcomes:{...run.majorOutcomes,long_night:result.outcome},
        failForwardOutcomes,
        seasonMilestones:[...run.seasonMilestones,'winter_resolved'],
        claimedCampaignRewards:[...run.claimedCampaignRewards,'winter_resolved'],
      },
      characterBonds:{
        ...state.characterBonds,
        veyr:{...state.characterBonds.veyr,memories},
      },
    },
  };
}

export function resolveHollowEnding(input:{
  bondResolution:unknown;
  worldResolution:unknown;
  careerResolution:unknown;
}):
  | {accepted:true;ending:ModularEnding}
  | {accepted:false;reason:'invalid_dimension'}{
  return resolveModularEnding({
    campaignResolution:'hollow',
    bondResolution:input.bondResolution,
    worldResolution:input.worldResolution,
    careerResolution:input.careerResolution,
  });
}

function validHollowEnding(ending:ModularEnding):boolean{
  if(ending.dimensions.campaign!=='hollow')return false;
  const resolved=resolveHollowEnding({
    bondResolution:ending.dimensions.bond,
    worldResolution:ending.dimensions.world,
    careerResolution:ending.dimensions.career,
  });
  return resolved.accepted&&resolved.ending.id===ending.id;
}

function memoryForOutcome(outcome:MajorOutcomeResult|undefined):HollowMemoryId|null{
  if(outcome==='victory'||outcome==='exceptional_victory')return 'veyr_hollow_victory';
  if(outcome==='costly_victory')return 'veyr_hollow_costly_victory';
  if(outcome==='defeat')return 'veyr_hollow_defeat';
  return null;
}

const hollowWorldFacts:readonly WorldFactId[]=['hollow_shortcut_taken','hollow_rift_entrenched'];

export function commitHollowEnding(state:V3PersistentState,ending:ModularEnding):
  | {committed:true;state:V3PersistentState}
  | {committed:false;state:V3PersistentState;reason:'not_ready'|'already_committed'|'invalid_ending'}{
  const run=state.campaignRun;
  if(run.activeRoute!=='hollow')return {committed:false,state,reason:'not_ready'};
  if(
    run.seasonMilestones.includes('ending_committed')||
    state.legacy.runSummaries.some(summary=>summary.runNumber===run.runNumber)
  ){
    return {committed:false,state,reason:'already_committed'};
  }
  if(
    run.dangerState.finalChoiceResolution!=='accepted'||
    run.activeCampaign===null||
    run.phase!=='ending'||
    !run.seasonMilestones.includes('winter_resolved')||
    run.majorOutcomes.long_night===undefined
  ){
    return {committed:false,state,reason:'not_ready'};
  }
  if(!validHollowEnding(ending))return {committed:false,state,reason:'invalid_ending'};
  const memoryId=memoryForOutcome(run.majorOutcomes.long_night);
  if(!memoryId||!state.characterBonds.veyr.memories.includes(memoryId)){
    return {committed:false,state,reason:'not_ready'};
  }
  const majorWorldOutcomes=state.worldHistory.currentFacts.filter(
    (fact):fact is WorldFactId=>hollowWorldFacts.includes(fact),
  );
  const legacy=hydrateLegacyState({
    ...state.legacy,
    completedRuns:state.legacy.completedRuns+1,
    completedCampaigns:[...state.legacy.completedCampaigns,run.activeCampaign],
    endingCollection:[...state.legacy.endingCollection,ending.id],
    careerCollection:[...state.legacy.careerCollection,ending.dimensions.career],
    runSummaries:[...state.legacy.runSummaries,{
      runNumber:run.runNumber,
      campaign:run.activeCampaign,
      route:'hollow',
      ending:ending.id,
      career:ending.dimensions.career,
      majorWorldOutcomes,
      keyBondMemories:[{characterId:'veyr',memoryId}],
      trueClues:[],
    }],
  });
  return {
    committed:true,
    state:{
      ...state,
      campaignRun:{...run,seasonMilestones:[...run.seasonMilestones,'ending_committed']},
      legacy,
    },
  };
}
