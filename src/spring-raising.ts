import type {MainCampaignId} from './campaign-model';

export const springAffinitySources=['training','dialogue','bond','exploration','tactical','calling','personality'] as const;
export type SpringAffinitySource=typeof springAffinitySources[number];

export type SpringAffinityEvidence={
  campaign:MainCampaignId;
  source:SpringAffinitySource;
  amount:number;
  reason:string;
};

export const SPRING_AFFINITY_SOURCE_CAP=6;

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

export function scoreCappedSpringAffinities(
  evidence:readonly SpringAffinityEvidence[],
  sourceCap=SPRING_AFFINITY_SOURCE_CAP,
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
