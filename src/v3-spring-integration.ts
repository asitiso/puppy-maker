import type {MainCampaignId} from './campaign-model';
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
  campaignRun:CampaignRunState;
  characterBonds:CharacterBondsState;
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
