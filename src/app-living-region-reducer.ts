import {reducer,type GameState} from './game';
import {applyLivingRegionUpdate,type LivingRegionUpdate} from './exploration/living-region-state';
import type {LivingRegionId} from './exploration/region-registry';

export type AppLivingRegionAction={
  type:'UPDATE_LIVING_REGION';
  regionId:LivingRegionId;
  update:LivingRegionUpdate;
};

export type AppAction=Parameters<typeof reducer>[1]|AppLivingRegionAction;

export function appReducer(state:GameState,action:AppAction):GameState{
  if(action.type==='UPDATE_LIVING_REGION'){
    const livingRegions=applyLivingRegionUpdate(state.livingRegions,action.regionId,action.update);
    return livingRegions===state.livingRegions?state:{...state,livingRegions};
  }
  return reducer(state,action);
}
