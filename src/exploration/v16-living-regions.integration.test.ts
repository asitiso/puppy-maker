import {describe,expect,it} from 'vitest';
import {livingRegionExplorationBuilders} from './living-region-explorations';
import {applyLivingRegionUpdate,emptyLivingRegionState} from './living-region-state';
import {outingCrossroadsWorld} from './outing-crossroads';
import {LIVING_REGION_IDS} from './region-registry';

const context={
  personality:{courage:8,kindness:8,curiosity:8,calmness:8},
  affection:50,
  worldFacts:['v16_cross_region_memory'],
  inheritedWorldFacts:[] as string[],
};

describe('V16 living regions cross-region integration',()=>{
  it('keeps every living region reachable from the shared crossroads',()=>{
    const destinations=outingCrossroadsWorld.interactables
      .filter(item=>item.kind==='portal')
      .map(item=>item.destinationId);
    for(const id of LIVING_REGION_IDS)expect(destinations).toContain(id);
  });

  it('runs every living region through the shared persistent quest and revisit phases',()=>{
    for(const id of LIVING_REGION_IDS){
      let state=emptyLivingRegionState();
      state=applyLivingRegionUpdate(state,id,{kind:'enter'});
      expect(state[id].phase).toBe('active');

      const active=livingRegionExplorationBuilders[id](state[id],context);
      expect(active.world.interactables.some(item=>item.kind==='exit')).toBe(true);
      expect(active.world.interactables.some(item=>item.id===active.questStartInteractionId)).toBe(true);
      expect(Object.keys(active.discoveryByInteraction).length).toBeGreaterThanOrEqual(2);

      state=applyLivingRegionUpdate(state,id,{kind:'recordInteraction',interactionId:active.questStartInteractionId});
      state=applyLivingRegionUpdate(state,id,{kind:'startMainQuest'});
      expect(state[id].phase).toBe('mainQuestInProgress');

      const inProgress=livingRegionExplorationBuilders[id](state[id],context);
      expect(inProgress.world.interactables.some(item=>item.id===inProgress.questResolveInteractionId)).toBe(true);

      state=applyLivingRegionUpdate(state,id,{kind:'recordInteraction',interactionId:inProgress.questResolveInteractionId});
      state=applyLivingRegionUpdate(state,id,{kind:'resolveMainQuest'});
      expect(state[id].phase).toBe('mainQuestResolved');

      const resolved=livingRegionExplorationBuilders[id](state[id],context);
      expect(resolved.world.objective).not.toBe(active.world.objective);
      expect(resolved.world.interactables.some(item=>item.id===resolved.postResolutionInteractionId)).toBe(true);

      state=applyLivingRegionUpdate(state,id,{kind:'recordInteraction',interactionId:resolved.postResolutionInteractionId});
      state=applyLivingRegionUpdate(state,id,{kind:'advancePostResolution'});
      expect(state[id].phase).toBe('postResolution');

      const revisited=livingRegionExplorationBuilders[id](state[id],context);
      expect(revisited.world.interactables.some(item=>item.id===revisited.postResolutionInteractionId&&item.repeatable===true)).toBe(true);
      expect(state[id].completedInteractions).toEqual(expect.arrayContaining([
        active.questStartInteractionId,
        inProgress.questResolveInteractionId,
        resolved.postResolutionInteractionId,
      ]));
    }
  });
});
