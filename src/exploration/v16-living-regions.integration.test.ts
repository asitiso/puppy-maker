import {describe,expect,it} from 'vitest';
import {emptyV3PersistentState,hydrateV3PersistentState,pickV3PersistentState} from '../v3-persistent-state';
import {livingRegionExplorationBuilders} from './living-region-explorations';
import {applyLivingRegionUpdate,emptyLivingRegionState,type LivingRegionState} from './living-region-state';
import {outingCrossroadsWorld} from './outing-crossroads';
import {LIVING_REGION_IDS} from './region-registry';

const context={
  personality:{courage:8,kindness:8,curiosity:8,calmness:8},
  affection:50,
  worldFacts:['v16_cross_region_memory'],
  inheritedWorldFacts:[] as string[],
};

function saveAndReload(livingRegions:LivingRegionState):LivingRegionState{
  const snapshot=pickV3PersistentState({...emptyV3PersistentState(),livingRegions});
  const serialized=JSON.stringify(snapshot);
  return hydrateV3PersistentState(JSON.parse(serialized)).livingRegions;
}

describe('V16 living regions cross-region integration',()=>{
  it('keeps every living region reachable from the shared crossroads',()=>{
    const destinations=outingCrossroadsWorld.interactables
      .filter(item=>item.kind==='portal')
      .map(item=>item.destinationId);
    for(const id of LIVING_REGION_IDS)expect(destinations).toContain(id);
  });

  it('runs every living region through save-safe persistent quest and revisit phases',()=>{
    for(const id of LIVING_REGION_IDS){
      let state=emptyLivingRegionState();
      state=applyLivingRegionUpdate(state,id,{kind:'enter'});
      state=saveAndReload(state);
      expect(state[id].phase).toBe('active');

      const active=livingRegionExplorationBuilders[id](state[id],context);
      expect(active.world.interactables.some(item=>item.kind==='exit')).toBe(true);
      expect(active.world.interactables.some(item=>item.id===active.questStartInteractionId)).toBe(true);
      expect(Object.keys(active.discoveryByInteraction).length).toBeGreaterThanOrEqual(2);

      state=applyLivingRegionUpdate(state,id,{kind:'recordInteraction',interactionId:active.questStartInteractionId});
      state=applyLivingRegionUpdate(state,id,{kind:'startMainQuest'});
      state=saveAndReload(state);
      expect(state[id].phase).toBe('mainQuestInProgress');
      expect(state[id].completedInteractions).toContain(active.questStartInteractionId);

      const inProgress=livingRegionExplorationBuilders[id](state[id],context);
      expect(inProgress.world.interactables.some(item=>item.id===inProgress.questResolveInteractionId)).toBe(true);

      for(const [interactionId,discoveryId] of Object.entries(inProgress.discoveryByInteraction)){
        state=applyLivingRegionUpdate(state,id,{kind:'recordInteraction',interactionId});
        state=applyLivingRegionUpdate(state,id,{kind:'recordDiscovery',discoveryId});
      }
      state=saveAndReload(state);
      expect(state[id].discoveries).toEqual(expect.arrayContaining(Object.values(inProgress.discoveryByInteraction)));
      expect(state[id].completedInteractions).toEqual(expect.arrayContaining(Object.keys(inProgress.discoveryByInteraction)));

      state=applyLivingRegionUpdate(state,id,{kind:'recordInteraction',interactionId:inProgress.questResolveInteractionId});
      state=applyLivingRegionUpdate(state,id,{kind:'resolveMainQuest'});
      state=saveAndReload(state);
      expect(state[id].phase).toBe('mainQuestResolved');
      expect(state[id].completedInteractions).toContain(inProgress.questResolveInteractionId);

      const resolved=livingRegionExplorationBuilders[id](state[id],context);
      expect(resolved.world.objective).not.toBe(active.world.objective);
      expect(resolved.world.interactables.some(item=>item.id===resolved.postResolutionInteractionId)).toBe(true);

      state=applyLivingRegionUpdate(state,id,{kind:'recordInteraction',interactionId:resolved.postResolutionInteractionId});
      state=applyLivingRegionUpdate(state,id,{kind:'advancePostResolution'});
      state=saveAndReload(state);
      expect(state[id].phase).toBe('postResolution');

      const revisited=livingRegionExplorationBuilders[id](state[id],context);
      expect(revisited.world.interactables.some(item=>item.id===revisited.postResolutionInteractionId&&item.repeatable===true)).toBe(true);
      expect(state[id].completedInteractions).toEqual(expect.arrayContaining([
        active.questStartInteractionId,
        ...Object.keys(inProgress.discoveryByInteraction),
        inProgress.questResolveInteractionId,
        resolved.postResolutionInteractionId,
      ]));
      expect(state[id].discoveries).toEqual(expect.arrayContaining(Object.values(inProgress.discoveryByInteraction)));
    }
  });
});
