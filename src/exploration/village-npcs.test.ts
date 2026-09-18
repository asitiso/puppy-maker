import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {villageExplorationForContext} from './village-world';
import {nearestInteractable} from './exploration-runtime';
import type {LivingNpcContext} from '../living-npcs';

const villageAsset=(name:string)=>readFileSync(new URL(`../../public/assets/exploration/village/npcs/${name}`,import.meta.url),'utf8');

const caretakerWeek:LivingNpcContext={
  activeCampaign:'caretaker',activeRoute:'normal',week:1,month:4,runNumber:1,inheritedFactCount:0,generation:1,
  legacyMarkers:[],completedProjects:[],
};

const hollowWeek:LivingNpcContext={
  activeCampaign:'vanguard',activeRoute:'hollow',week:2,month:9,runNumber:2,inheritedFactCount:3,generation:2,
  legacyMarkers:['hollow_scar'],completedProjects:['guardian_academy'],
};

describe('living NPC village exploration',()=>{
  it('turns weekly NPC presence into physical repeatable village interactions',()=>{
    const exploration=villageExplorationForContext(caretakerWeek);
    const npcs=exploration.world.interactables.filter(item=>item.id.startsWith('village-npc:'));
    expect(npcs.map(item=>item.id)).toEqual(['village-npc:mira','village-npc:eiden','village-npc:noa']);
    expect(npcs.every(item=>item.kind==='story')).toBe(true);
    expect(npcs.every(item=>item.repeatable===true)).toBe(true);
    expect(npcs.every(item=>item.artSrc?.includes('/assets/exploration/village/npcs/'))).toBe(true);
    for(const npc of npcs){
      expect(npc.storyFrameId).toBeTruthy();
      expect(exploration.storyFrames[npc.storyFrameId!]?.progression).toBe(false);
      expect(exploration.storyFrames[npc.storyFrameId!]?.speaker).toBeTruthy();
    }
  });

  it('does not let overlapping repeatable villagers hide a one-time village discovery',()=>{
    const exploration=villageExplorationForContext(caretakerWeek);
    expect(nearestInteractable({x:1433,y:858},exploration.world.interactables)?.id).toBe('village-square');
  });

  it('changes who is physically present when campaign and route context changes',()=>{
    const normal=villageExplorationForContext(caretakerWeek).world.interactables.filter(item=>item.id.startsWith('village-npc:')).map(item=>item.id);
    const hollow=villageExplorationForContext(hollowWeek).world.interactables.filter(item=>item.id.startsWith('village-npc:')).map(item=>item.id);
    expect(hollow).not.toEqual(normal);
    expect(hollow).toContain('village-npc:veyr');
  });

  it('ships dedicated original world and framed-scene art for every living NPC',()=>{
    for(const id of ['mira','kael','rex','selene','noa','eiden','lyra','veyr']){
      for(const file of [`${id}-world.svg`,`${id}-story.svg`]){
        const svg=villageAsset(file);
        expect(svg).toContain('<svg');
        expect(svg).toContain('viewBox=');
        expect(svg.length).toBeGreaterThan(300);
      }
    }
  });
});