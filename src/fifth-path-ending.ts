import {resolveModularEnding,type ModularEnding} from './campaign-winter-season';
import {sanitizeCampaignSeasonalObjectiveClaimKeys} from './campaign-seasonal-claim-keys';
import {hydrateLegacyState} from './legacy-state';
import type {MajorOutcomeResult} from './campaign-model';
import type {V3PersistentState} from './v3-persistent-state';
import type {WorldFactId} from './world-history';

export type FifthPathOutcomeCost='none'|'high';
export type FifthPathMemoryId='lyra_true_path_victory'|'lyra_true_path_costly_victory'|'lyra_true_path_defeat';

export type AcceptedFifthPathOutcome={
  accepted:true;
  outcome:MajorOutcomeResult;
  memoryId:FifthPathMemoryId;
  worldFact:'true_path_cycle_rejoined'|'true_path_cost_borne';
  failForward:boolean;
};

export function resolveFifthPathOutcome(input:{battleResult:unknown;cost:unknown}):
  | AcceptedFifthPathOutcome
  | {accepted:false;reason:'invalid_outcome'}{
  if((input.battleResult!=='victory'&&input.battleResult!=='defeat')||(input.cost!=='none'&&input.cost!=='high')){
    return {accepted:false,reason:'invalid_outcome'};
  }
  if(input.battleResult==='defeat'){
    return {
      accepted:true,
      outcome:'defeat',
      memoryId:'lyra_true_path_defeat',
      worldFact:'true_path_cost_borne',
      failForward:true,
    };
  }
  if(input.cost==='high'){
    return {
      accepted:true,
      outcome:'costly_victory',
      memoryId:'lyra_true_path_costly_victory',
      worldFact:'true_path_cost_borne',
      failForward:false,
    };
  }
  return {
    accepted:true,
    outcome:'victory',
    memoryId:'lyra_true_path_victory',
    worldFact:'true_path_cycle_rejoined',
    failForward:false,
  };
}

function hasWinterClaim(state:V3PersistentState):boolean{
  return sanitizeCampaignSeasonalObjectiveClaimKeys(state.campaignRun.claimedSeasonalObjectives)
    .some(key=>/-winter:true_path:fifth_winter_last_possibility$/.test(key));
}

export function commitFifthPathOutcome(state:V3PersistentState,result:AcceptedFifthPathOutcome):
  | {committed:true;state:V3PersistentState;reward:{kind:'true_path_memory';memoryId:FifthPathMemoryId}}
  | {committed:false;state:V3PersistentState;reason:'not_ready'|'already_committed'}{
  const run=state.campaignRun;
  if(
    run.activeCampaign!=='true_path'||
    run.phase!=='winter'||
    !run.seasonMilestones.includes('autumn_resolved')||
    !hasWinterClaim(state)
  ){
    return {committed:false,state,reason:'not_ready'};
  }
  if(
    run.majorOutcomes.long_night!==undefined||
    run.seasonMilestones.includes('winter_resolved')||
    run.claimedCampaignRewards.includes('winter_resolved')
  ){
    return {committed:false,state,reason:'already_committed'};
  }
  const seasonMilestones=[...run.seasonMilestones,'winter_resolved' as const];
  const failForwardOutcomes=result.failForward&&!run.failForwardOutcomes.includes('long_night')
    ? [...run.failForwardOutcomes,'long_night' as const]
    : run.failForwardOutcomes;
  const currentFacts=[...state.worldHistory.currentFacts];
  if(!currentFacts.includes(result.worldFact))currentFacts.push(result.worldFact);
  const memories=[...state.characterBonds.lyra.memories];
  if(!memories.includes(result.memoryId))memories.push(result.memoryId);
  return {
    committed:true,
    reward:{kind:'true_path_memory',memoryId:result.memoryId},
    state:{
      ...state,
      campaignRun:{
        ...run,
        phase:'ending',
        majorOutcomes:{...run.majorOutcomes,long_night:result.outcome},
        failForwardOutcomes,
        seasonMilestones,
        claimedCampaignRewards:[...run.claimedCampaignRewards,'winter_resolved'],
      },
      worldHistory:{...state.worldHistory,currentFacts},
      characterBonds:{
        ...state.characterBonds,
        lyra:{...state.characterBonds.lyra,memories},
      },
    },
  };
}

export function resolveFifthTrueEnding(input:{
  bondResolution:unknown;
  worldResolution:unknown;
  careerResolution:unknown;
}):
  | {accepted:true;ending:ModularEnding}
  | {accepted:false;reason:'invalid_dimension'}{
  return resolveModularEnding({
    campaignResolution:'true_path',
    bondResolution:input.bondResolution,
    worldResolution:input.worldResolution,
    careerResolution:input.careerResolution,
  });
}

function validFifthEnding(ending:ModularEnding):boolean{
  if(ending.dimensions.campaign!=='true_path')return false;
  const resolved=resolveFifthTrueEnding({
    bondResolution:ending.dimensions.bond,
    worldResolution:ending.dimensions.world,
    careerResolution:ending.dimensions.career,
  });
  return resolved.accepted&&resolved.ending.id===ending.id;
}

function finalWorldFact(state:V3PersistentState):WorldFactId|null{
  const outcome=state.campaignRun.majorOutcomes.long_night;
  if(outcome==='victory'||outcome==='exceptional_victory')return 'true_path_cycle_rejoined';
  if(outcome==='costly_victory'||outcome==='defeat')return 'true_path_cost_borne';
  return null;
}

export function commitFifthPathEnding(state:V3PersistentState,ending:ModularEnding):
  | {committed:true;state:V3PersistentState}
  | {committed:false;state:V3PersistentState;reason:'not_ready'|'already_committed'|'invalid_ending'}{
  const run=state.campaignRun;
  if(
    run.activeCampaign!=='true_path'||
    run.phase!=='ending'||
    !run.seasonMilestones.includes('winter_resolved')||
    run.majorOutcomes.long_night===undefined
  ){
    return {committed:false,state,reason:'not_ready'};
  }
  if(run.seasonMilestones.includes('ending_committed')||state.legacy.runSummaries.some(summary=>summary.runNumber===run.runNumber)){
    return {committed:false,state,reason:'already_committed'};
  }
  if(!validFifthEnding(ending))return {committed:false,state,reason:'invalid_ending'};
  const worldFact=finalWorldFact(state);
  const memoryId=state.characterBonds.lyra.memories.find(memory=>
    memory==='lyra_true_path_victory'||memory==='lyra_true_path_costly_victory'||memory==='lyra_true_path_defeat'
  );
  if(!worldFact||!memoryId)return {committed:false,state,reason:'not_ready'};
  const legacy=hydrateLegacyState({
    ...state.legacy,
    completedRuns:state.legacy.completedRuns+1,
    completedCampaigns:[...state.legacy.completedCampaigns,'true_path'],
    endingCollection:[...state.legacy.endingCollection,ending.id],
    careerCollection:[...state.legacy.careerCollection,ending.dimensions.career],
    runSummaries:[...state.legacy.runSummaries,{
      runNumber:run.runNumber,
      campaign:'true_path',
      route:run.activeRoute,
      ending:ending.id,
      career:ending.dimensions.career,
      majorWorldOutcomes:[worldFact],
      keyBondMemories:[{characterId:'lyra',memoryId}],
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
