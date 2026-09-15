import type {LivingRegionUpdate} from './exploration/living-region-state';
import type {LivingRegionId} from './exploration/region-registry';

export type LivingRegionUpdateRequest={
  regionId:LivingRegionId;
  update:LivingRegionUpdate;
};

export const livingRegionUpdateRequestEvent='puppy-maker:living-region-update';

export function requestLivingRegionUpdate(regionId:LivingRegionId,update:LivingRegionUpdate):void{
  if(typeof window==='undefined')return;
  window.dispatchEvent(new CustomEvent<LivingRegionUpdateRequest>(livingRegionUpdateRequestEvent,{
    detail:{regionId,update},
  }));
}
