import {mainCampaignIds,type MainCampaignId} from './campaign-model';
import type {CampaignRunState} from './campaign-state';
import type {CharacterBondsState} from './character-bonds';
import {
  applyFirstCommitmentCharacterBond,
  commitSpringCampaign,
  openPathConvergence,
  pathConvergence,
  resolveFirstCommitment,
  type SpringAffinityEvidence,
  type SpringPathCandidate,
} from './spring-raising';

type SpringIntegrationState={
  month:number;
  week:number;
  mastery:{
    rest:{xp:number};
    herb:{xp:number};
    hunt:{xp:number};
    magic:{xp:number};
  };
  personality:{courage:number;kindness:number;curiosity:number;calmness:number};
  stats:{affection:number};
  lastChoice?:string;
  discoveries:readonly unknown[];
  tacticalBattleRecords:object;
  activeCalling:string|null;
  campaignRun:CampaignRunState;
  characterBonds:CharacterBondsState;
};

const trainingSources=[
  ['caretaker','rest','You kept returning to recovery and care.'],
  ['pathfinder','herb','You kept learning through fieldwork and discovery.'],
  ['vanguard','hunt','You kept choosing demanding combat training.'],
  ['arcanist','magic','You kept studying magic and unusual rules.'],
] as const;

const personalitySources=[
  ['caretaker','kindness','Your kindness kept shaping how you respond.'],
  ['pathfinder','curiosity','Your curiosity kept pulling you toward the unknown.'],
  ['vanguard','courage','Your courage kept pushing you toward direct challenges.'],
  ['arcanist','calmness','Your calm focus kept drawing you toward difficult rules.'],
] as const;

const positive=(value:number)=>Number.isFinite(value)?Math.max(0,value):0;

function tacticalClearCount(records:object):number{
  let total=0;
  for(const raw of Object.values(records as Record<string,unknown>)){
    if(!raw||typeof raw!=='object'||Array.isArray(raw))continue;
    const clearCount=(raw as {clearCount?:unknown}).clearCount;
    if(typeof clearCount==='number'&&Number.isFinite(clearCount))total+=Math.max(0,Math.floor(clearCount));
  }
  return total;
}

export function deriveSpringAffinityEvidence(state:SpringIntegrationState):SpringAffinityEvidence[]{
  const evidence:SpringAffinityEvidence[]=trainingSources.map(([campaign,activity,reason])=>({
    campaign,
    source:'training',
    amount:positive(state.mastery[activity].xp),
    reason,
  }));

  for(const [campaign,key,reason] of personalitySources){
    evidence.push({campaign,source:'personality',amount:positive(state.personality[key]-20),reason});
  }

  if(state.activeCalling&&mainCampaignIds.includes(state.activeCalling as MainCampaignId)){
    evidence.push({
      campaign:state.activeCalling as MainCampaignId,
      source:'calling',
      amount:6,
      reason:'Your chosen Calling kept reinforcing this direction.',
    });
  }

  if(state.lastChoice==='hug'){
    evidence.push({campaign:'caretaker',source:'dialogue',amount:3,reason:'You answered a tense moment with warmth.'});
  }else if(state.lastChoice==='scold'){
    evidence.push({campaign:'vanguard',source:'dialogue',amount:3,reason:'You answered a tense moment directly.'});
  }else if(state.lastChoice==='snack'){
    evidence.push({campaign:'caretaker',source:'dialogue',amount:2,reason:'You chose a small act of practical care.'});
  }

  evidence.push({
    campaign:'caretaker',
    source:'bond',
    amount:positive(state.stats.affection-72),
    reason:'The bond you built kept making protection matter more.',
  });
  evidence.push({
    campaign:'pathfinder',
    source:'exploration',
    amount:state.discoveries.length,
    reason:'Your discoveries kept opening paths beyond the familiar route.',
  });
  evidence.push({
    campaign:'vanguard',
    source:'tactical',
    amount:tacticalClearCount(state.tacticalBattleRecords),
    reason:'Your completed Tactical battles showed a taste for direct pressure.',
  });
  return evidence;
}

export function springPathCandidates(state:SpringIntegrationState):SpringPathCandidate[]{
  const evidence=deriveSpringAffinityEvidence(state);
  const eligibleThird=mainCampaignIds.filter(campaign=>{
    const sources=new Set(evidence.filter(item=>item.campaign===campaign&&item.amount>0).map(item=>item.source));
    return sources.size>=2;
  });
  return pathConvergence(evidence,{eligibleThird});
}

export function springConvergenceReady(state:Pick<SpringIntegrationState,'month'|'week'>):boolean{
  return (state.month===4||state.month===5)&&state.week>=1&&state.week<=4;
}

export function openSpringPathConvergence(state:SpringIntegrationState):CampaignRunState{
  if(!springConvergenceReady(state))return state.campaignRun;
  return openPathConvergence(state.campaignRun,deriveSpringAffinityEvidence(state)).state;
}

export function commitSpringPath(
  state:SpringIntegrationState,
  selection:MainCampaignId,
):{campaignRun:CampaignRunState;characterBonds:CharacterBondsState}{
  const committed=commitSpringCampaign(state.campaignRun,springPathCandidates(state),selection);
  if(!committed.committed)return {campaignRun:state.campaignRun,characterBonds:state.characterBonds};
  const commitment=resolveFirstCommitment(committed.state);
  return {
    campaignRun:commitment.state,
    characterBonds:commitment.event
      ? applyFirstCommitmentCharacterBond(state.characterBonds,commitment.event)
      : state.characterBonds,
  };
}
