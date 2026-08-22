import {mainCampaignIds,type CharacterId,type MainCampaignId} from './campaign-model';
import type {CampaignRunState} from './campaign-state';
import type {CharacterBondsState} from './character-bonds';

export const springAffinitySources=['training','dialogue','bond','exploration','tactical','calling','personality'] as const;
export type SpringAffinitySource=typeof springAffinitySources[number];

export type SpringAffinityEvidence={
  campaign:MainCampaignId;
  source:SpringAffinitySource;
  amount:number;
  reason:string;
};

export const SPRING_AFFINITY_SOURCE_CAP=6;

export type SpringPathTendency='faint_tendency'|'emerging_possibility'|'strongly_opening_path';
export type SpringPathCandidate={
  campaign:MainCampaignId;
  tendency:SpringPathTendency;
  reasons:string[];
};
export type PathConvergenceOptions={eligibleThird?:readonly MainCampaignId[]};

export type CampaignCommitResult={
  state:CampaignRunState;
  committed:boolean;
  reason?:'locked'|'not_candidate'|'not_ready';
};

export type FirstCommitmentEvent={
  type:'first_commitment';
  key:`first_commitment:${MainCampaignId}`;
  campaign:MainCampaignId;
  character:CharacterId;
  memory:string;
};

const emptyAffinities=():Record<MainCampaignId,number>=>({caretaker:0,pathfinder:0,vanguard:0,arcanist:0});
const safeAffinityAmount=(value:number):number=>Number.isFinite(value)&&value>0?Math.floor(value):0;

export function scoreSpringAffinityEvidence(evidence:readonly SpringAffinityEvidence[]):Record<MainCampaignId,number>{
  const scores=emptyAffinities();
  for(const item of evidence)scores[item.campaign]+=safeAffinityAmount(item.amount);
  return scores;
}

export function scoreCappedSpringAffinities(
  evidence:readonly SpringAffinityEvidence[],sourceCap=SPRING_AFFINITY_SOURCE_CAP,
):Record<MainCampaignId,number>{
  const scores=emptyAffinities();
  const safeCap=Number.isFinite(sourceCap)&&sourceCap>0?Math.floor(sourceCap):SPRING_AFFINITY_SOURCE_CAP;
  const sourceTotals=new Map<string,number>();
  for(const item of evidence){
    const amount=safeAffinityAmount(item.amount);
    if(amount===0)continue;
    const key=`${item.campaign}:${item.source}`;
    sourceTotals.set(key,Math.min(safeCap,(sourceTotals.get(key)??0)+amount));
  }
  for(const [key,amount] of sourceTotals){
    const campaign=key.slice(0,key.indexOf(':')) as MainCampaignId;
    scores[campaign]+=amount;
  }
  return scores;
}

const tendencyFor=(score:number):SpringPathTendency=>score>=10?'strongly_opening_path':score>=4?'emerging_possibility':'faint_tendency';
const fallbackReasons:Record<MainCampaignId,string>={
  caretaker:'Your Spring still leaves room to protect what matters.',
  pathfinder:'Your Spring still leaves an unexplored road open.',
  vanguard:'Your Spring still leaves a challenge worth facing.',
  arcanist:'Your Spring still leaves a mystery worth understanding.',
};
function reasonsFor(campaign:MainCampaignId,evidence:readonly SpringAffinityEvidence[]):string[]{
  const reasons:string[]=[];
  for(const item of evidence){
    if(item.campaign!==campaign||safeAffinityAmount(item.amount)===0)continue;
    const reason=item.reason.trim();
    if(reason&&!reasons.includes(reason))reasons.push(reason);
    if(reasons.length===2)break;
  }
  return reasons.length?reasons:[fallbackReasons[campaign]];
}

export function pathConvergence(
  evidence:readonly SpringAffinityEvidence[],options:PathConvergenceOptions={},
):SpringPathCandidate[]{
  const scores=scoreCappedSpringAffinities(evidence);
  const ranked=[...mainCampaignIds].sort((left,right)=>scores[right]-scores[left]||mainCampaignIds.indexOf(left)-mainCampaignIds.indexOf(right));
  const selected=ranked.slice(0,2);
  const third=ranked[2];
  const secondScore=scores[ranked[1]];
  const thirdScore=scores[third];
  if(thirdScore>0&&thirdScore>=Math.max(1,secondScore*0.75)&&new Set(options.eligibleThird??[]).has(third))selected.push(third);
  return selected.map(campaign=>({campaign,tendency:tendencyFor(scores[campaign]),reasons:reasonsFor(campaign,evidence)}));
}

export function openPathConvergence(
  state:CampaignRunState,evidence:readonly SpringAffinityEvidence[],options:PathConvergenceOptions={},
):{state:CampaignRunState;candidates:SpringPathCandidate[]}{
  const candidates=pathConvergence(evidence,options);
  if(state.activeCampaign!==null||state.phase!=='spring_exploration')return {state,candidates};
  return {state:{...state,phase:'path_selection',campaignAffinities:scoreCappedSpringAffinities(evidence),seasonMilestones:state.seasonMilestones.includes('path_convergence')?state.seasonMilestones:[...state.seasonMilestones,'path_convergence']},candidates};
}

export function commitSpringCampaign(
  state:CampaignRunState,candidates:readonly SpringPathCandidate[],selection:MainCampaignId,
):CampaignCommitResult{
  if(state.activeCampaign!==null)return {state,committed:false,reason:'locked'};
  if(state.phase!=='path_selection')return {state,committed:false,reason:'not_ready'};
  if(!candidates.some(candidate=>candidate.campaign===selection))return {state,committed:false,reason:'not_candidate'};
  return {state:{...state,activeCampaign:selection},committed:true};
}

const representativeByCampaign:Record<MainCampaignId,CharacterId>={caretaker:'mira',pathfinder:'kael',vanguard:'rex',arcanist:'selene'};

export function resolveFirstCommitment(state:CampaignRunState):{state:CampaignRunState;event:FirstCommitmentEvent|null}{
  if(state.phase!=='path_selection'||state.activeCampaign===null||state.activeCampaign==='true_path')return {state,event:null};
  const campaign=state.activeCampaign;
  const character=representativeByCampaign[campaign];
  return {
    state:{...state,phase:'summer'},
    event:{type:'first_commitment',key:`first_commitment:${campaign}`,campaign,character,memory:`${character}_first_commitment`},
  };
}

export function applyFirstCommitmentCharacterBond(
  bonds:CharacterBondsState,event:FirstCommitmentEvent,
):CharacterBondsState{
  const current=bonds[event.character];
  if(current.memories.includes(event.memory))return bonds;
  return {...bonds,[event.character]:{...current,trust:current.trust+3,memories:[...current.memories,event.memory]}};
}
