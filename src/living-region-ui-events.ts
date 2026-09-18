import type {LivingRegionUpdate} from './exploration/living-region-state';
import type {LivingRegionId} from './exploration/region-registry';

export type LivingRegionUpdateRequest={
  regionId:LivingRegionId;
  updates:readonly LivingRegionUpdate[];
};

export const livingRegionUpdateRequestEvent='puppy-maker:living-region-update';

export function requestLivingRegionUpdates(regionId:LivingRegionId,updates:readonly LivingRegionUpdate[]):void{
  if(typeof window==='undefined'||updates.length===0)return;
  window.dispatchEvent(new CustomEvent<LivingRegionUpdateRequest>(livingRegionUpdateRequestEvent,{
    detail:{regionId,updates},
  }));
}

export function requestLivingRegionUpdate(regionId:LivingRegionId,update:LivingRegionUpdate):void{
  requestLivingRegionUpdates(regionId,[update]);
}
