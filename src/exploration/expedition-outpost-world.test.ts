import {describe,expect,it} from 'vitest';
import type {LivingRegionProgress} from './living-region-state';
import {expeditionOutpostConditionalEventIds,expeditionOutpostExploration} from './expedition-outpost-world';
import {nearestInteractable} from './exploration-runtime';
const progress=(phase:LivingRegionProgress['phase'],completedInteractions:string[]=[]):LivingRegionProgress=>({phase,discoveries:[],completedInteractions});
const context={personality:{courage:4,kindness:4,curiosity:4,calmness:4},affection:20,worldFacts:[] as string[],inheritedWorldFacts:[] as string[]};
describe('V16 Expedition Outpost authored region',()=>{
 it('meets the living-region completeness contract',()=>{const x=expeditionOutpostExploration(progress('active'),context);expect(x.world.width).toBeGreaterThan(844);expect(x.world.height).toBeGreaterThan(844);expect(x.world.obstacles.length).toBeGreaterThanOrEqual(6);expect(x.world.interactables.filter(i=>i.id.startsWith('outpost-npc-')).length).toBe(3);expect(Object.keys(x.discoveryByInteraction)).toHaveLength(3);expect(expeditionOutpostConditionalEventIds.length).toBeGreaterThanOrEqual(2);expect(x.world.interactables.some(i=>i.kind==='exit')).toBe(true);for(const item of x.world.interactables){if(item.storyFrameId)expect(x.storyFrames[item.storyFrameId]).toBeDefined();if(item.artSrc)expect(item.artSrc).toContain('/assets/exploration/expedition-outpost/');}});
 it('keeps the supply officer and opening briefing in comfortably walkable space',()=>{
  const x=expeditionOutpostExploration(progress('active'),context);
  const bottomClearance=(interactionId:string,obstacleId:string)=>{
   const interaction=x.world.interactables.find(item=>item.id===interactionId);
   const obstacle=x.world.obstacles.find(item=>item.id===obstacleId);
   expect(interaction).toBeDefined();
   expect(obstacle).toBeDefined();
   return interaction!.position.y-(obstacle!.y+obstacle!.height+x.world.playerRadius);
  };
  expect(bottomClearance('outpost-npc-ara','supply-tent')).toBeGreaterThanOrEqual(24);
  expect(bottomClearance(x.questStartInteractionId,'command-tent')).toBeGreaterThanOrEqual(24);
 });
 it('lets the active briefing win over nearby repeatable Sena chatter',()=>{const x=expeditionOutpostExploration(progress('active'),context);expect(nearestInteractable({x:830,y:1225},x.world.interactables)?.id).toBe(x.questStartInteractionId);});
 it('requires the patrol evidence chain before signal repair',()=>{const x=expeditionOutpostExploration(progress('mainQuestInProgress',['outpost-captain-briefing']),context);expect(x.questStartInteractionId).toBe('outpost-captain-briefing');expect(x.questResolveInteractionId).toBe('outpost-signal-mast');expect(x.world.interactables.find(i=>i.id==='outpost-supply-seal')?.requiresCompleted).toEqual(['outpost-broken-marker','outpost-beast-tracks']);expect(x.world.interactables.find(i=>i.id==='outpost-signal-mast')?.requiresCompleted).toContain('outpost-supply-seal');});
 it('shows a persistent repaired defense state and revisit after resolution',()=>{const active=expeditionOutpostExploration(progress('active'),context);const resolved=expeditionOutpostExploration(progress('mainQuestResolved'),context);const post=expeditionOutpostExploration(progress('postResolution'),context);expect(active.world.interactables.some(i=>i.id==='outpost-watchfire')).toBe(false);expect(resolved.world.interactables.some(i=>i.id==='outpost-watchfire')).toBe(true);expect(resolved.world.layers.some(l=>l.id==='repaired-signal')).toBe(true);expect(post.world.objective).toContain('다시');});
 it('changes local dialogue for courage, bond and world history',()=>{const brave=expeditionOutpostExploration(progress('active'),{...context,personality:{...context.personality,courage:12}});const experienced=expeditionOutpostExploration(progress('active'),{...context,inheritedWorldFacts:['old_patrol_memory']});const bonded=expeditionOutpostExploration(progress('mainQuestResolved'),{...context,affection:65});expect(brave.storyFrames['outpost-sena'].text).toContain('겁먹지');expect(experienced.storyFrames['outpost-min'].text).toContain('여러 지역');expect(bonded.storyFrames['outpost-sena'].text).toContain('동료');});
});
