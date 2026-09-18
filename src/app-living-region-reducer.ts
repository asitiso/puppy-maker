import {reducer,type GameState} from './game';
import {applyLivingRegionUpdate,type LivingRegionUpdate} from './exploration/living-region-state';
import type {LivingRegionId} from './exploration/region-registry';

export type AppLivingRegionAction=
  | {
      type:'UPDATE_LIVING_REGION';
      regionId:LivingRegionId;
      update:LivingRegionUpdate;
    }
  | {
      type:'UPDATE_LIVING_REGION_BATCH';
      regionId:LivingRegionId;
      updates:readonly LivingRegionUpdate[];
    };

export type AppAction=Parameters<typeof reducer>[1]|AppLivingRegionAction;

export function appReducer(state:GameState,action:AppAction):GameState{
  if(action.type==='UPDATE_LIVING_REGION'||action.type==='UPDATE_LIVING_REGION_BATCH'){
    const updates=action.type==='UPDATE_LIVING_REGION'?[action.update]:action.updates;
    let livingRegions=state.livingRegions;
    for(const update of updates) livingRegions=applyLivingRegionUpdate(livingRegions,action.regionId,update);
    return livingRegions===state.livingRegions?state:{...state,livingRegions};
  }
  return reducer(state,action);
}
