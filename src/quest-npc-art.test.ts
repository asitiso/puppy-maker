import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {questNpcForCategory} from './world-quest-npcs';
import type {MobileContentCategory} from './mobile-router';

const categories:MobileContentCategory[]=['life','growth','adventure','bond','records'];

function publicAsset(path:string){
  return readFileSync(new URL(`../public${path}`,import.meta.url),'utf8');
}

describe('quest NPC visual assets',()=>{
  it('ships a real world sprite for every district quest issuer',()=>{
    for(const category of categories){
      const npc=questNpcForCategory(category);
      const svg=publicAsset(npc.worldArtSrc);
      expect(svg,npc.id).toContain('<svg');
      expect(svg,npc.id).toContain('viewBox=');
      expect(svg.length,npc.id).toBeGreaterThan(600);
      expect(npc.portraitSrc).toBe(npc.worldArtSrc);
    }
  });

  it('keeps every issuer visually distinct',()=>{
    const art=categories.map(category=>questNpcForCategory(category).worldArtSrc);
    expect(new Set(art).size).toBe(categories.length);
  });
});
