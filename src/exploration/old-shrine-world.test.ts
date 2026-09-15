import {describe,expect,it} from 'vitest';
import type {LivingRegionProgress} from './living-region-state';
import {oldShrineExploration} from './old-shrine-world';

const progress=(phase:LivingRegionProgress['phase'],completedInteractions:string[]=[]):LivingRegionProgress=>({
  phase,discoveries:[],completedInteractions,
});
const context={
  personality:{courage:4,kindness:4,curiosity:4,calmness:4},
  affection:20,
  worldFacts:[] as string[],
  inheritedWorldFacts:[] as string[],
};

describe('V16 Old Shrine authored region',()=>{
  it('meets the living-region traversal and content completeness contract',()=>{
    const exploration=oldShrineExploration(progress('active'),context);
    const {world,storyFrames,discoveryByInteraction}=exploration;
    expect(world.width).toBeGreaterThan(844);
    expect(world.height).toBeGreaterThan(844);
    expect(world.start.x).toBeGreaterThan(0);
    expect(world.start.x).toBeLessThan(world.width);
    expect(world.start.y).toBeGreaterThan(0);
    expect(world.start.y).toBeLessThan(world.height);
    expect(world.obstacles.length).toBeGreaterThanOrEqual(6);
    expect(world.interactables.some(item=>item.kind==='exit')).toBe(true);
    expect(Object.keys(discoveryByInteraction).length).toBeGreaterThanOrEqual(3);
    expect(world.interactables.filter(item=>item.id.startsWith('shrine-echo-')).length).toBeGreaterThanOrEqual(3);
    expect(world.interactables.filter(item=>item.requiresCompleted?.length).length).toBeGreaterThanOrEqual(2);
    for(const item of world.interactables){
      if(item.storyFrameId)expect(storyFrames[item.storyFrameId]).toBeDefined();
      if(item.artSrc)expect(item.artSrc).toContain('/assets/exploration/old-shrine/');
    }
  });

  it('changes the gate and revisit presentation after the main quest resolves',()=>{
    const active=oldShrineExploration(progress('active'),context);
    const resolved=oldShrineExploration(progress('mainQuestResolved'),context);
    const post=oldShrineExploration(progress('postResolution'),context);
    expect(active.world.interactables.some(item=>item.id==='shrine-sealed-arch')).toBe(true);
    expect(active.world.interactables.some(item=>item.id==='shrine-open-sanctum')).toBe(false);
    expect(resolved.world.interactables.some(item=>item.id==='shrine-open-sanctum')).toBe(true);
    expect(post.world.objective).toContain('다시');
    expect(resolved.world.layers.some(layer=>layer.src.includes('resolved'))).toBe(true);
  });

  it('unlocks the rune quest chain only after the seal interaction is completed',()=>{
    const active=oldShrineExploration(progress('active'),context);
    const inProgress=oldShrineExploration(progress('mainQuestInProgress',['shrine-sealed-arch']),context);
    expect(active.world.interactables.find(item=>item.id==='shrine-rune-device')?.requiresCompleted).toContain('shrine-sealed-arch');
    expect(inProgress.questStartInteractionId).toBe('shrine-sealed-arch');
    expect(inProgress.questResolveInteractionId).toBe('shrine-rune-core');
    expect(inProgress.discoveryByInteraction['shrine-memory-shard']).toBe('memory_shard');
  });

  it('changes authored dialogue for curiosity and inherited world knowledge',()=>{
    const curious=oldShrineExploration(progress('active'),{
      ...context,personality:{...context.personality,curiosity:12},
    });
    const inherited=oldShrineExploration(progress('active'),{
      ...context,inheritedWorldFacts:['ancestor_guardian_oath'],
    });
    expect(curious.storyFrames['shrine-child-echo'].text).toContain('궁금');
    expect(inherited.storyFrames['shrine-warden-echo'].text).toContain('이어진');
  });
});
