import {pickExplorationOutcome,type DiscoveryId,type ExplorationOutcome,type OutingLocationId} from '../../adventure';

export function resolveOutingOutcome(location:OutingLocationId,xp:number,discoveries:DiscoveryId[],roll:number):ExplorationOutcome{
  return pickExplorationOutcome(location,xp,discoveries,roll);
}
