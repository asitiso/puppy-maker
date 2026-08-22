import type {CampaignRunState} from './campaign-state';
import {
  openPathConvergence,
  pathConvergence,
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
  campaignRun:CampaignRunState;
};

const trainingSources=[
  ['caretaker','rest','You kept returning to recovery and care.'],
  ['pathfinder','herb','You kept learning through fieldwork and discovery.'],
  ['vanguard','hunt','You kept choosing demanding combat training.'],
  ['arcanist','magic','You kept studying magic and unusual rules.'],
] as const;

export function deriveSpringAffinityEvidence(state:SpringIntegrationState):SpringAffinityEvidence[]{
  return trainingSources.map(([campaign,activity,reason])=>({
    campaign,
    source:'training' as const,
    amount:state.mastery[activity].xp,
    reason,
  }));
}

export function springPathCandidates(state:SpringIntegrationState):SpringPathCandidate[]{
  return pathConvergence(deriveSpringAffinityEvidence(state));
}

export function springConvergenceReady(state:Pick<SpringIntegrationState,'month'|'week'>):boolean{
  return (state.month===4||state.month===5)&&state.week>=1&&state.week<=4;
}

export function openSpringPathConvergence(state:SpringIntegrationState):CampaignRunState{
  if(!springConvergenceReady(state))return state.campaignRun;
  return openPathConvergence(state.campaignRun,deriveSpringAffinityEvidence(state)).state;
}
