import type {MainCampaignId} from './campaign-model';

export const springAffinitySources=['training','dialogue','bond','exploration','tactical','calling','personality'] as const;
export type SpringAffinitySource=typeof springAffinitySources[number];

export type SpringAffinityEvidence={
  campaign:MainCampaignId;
  source:SpringAffinitySource;
  amount:number;
  reason:string;
};

const emptyAffinities=():Record<MainCampaignId,number>=>({
  caretaker:0,
  pathfinder:0,
  vanguard:0,
  arcanist:0,
});

const safeAffinityAmount=(value:number):number=>
  Number.isFinite(value)&&value>0?Math.floor(value):0;

export function scoreSpringAffinityEvidence(
  evidence:readonly SpringAffinityEvidence[],
):Record<MainCampaignId,number>{
  const scores=emptyAffinities();
  for(const item of evidence){
    scores[item.campaign]+=safeAffinityAmount(item.amount);
  }
  return scores;
}
