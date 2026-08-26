// @ts-ignore -- Vitest executes this source contract in Node; app tsconfig intentionally excludes Node globals.
import {existsSync,readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

function source(path:string){
  const url=new URL(path,import.meta.url);
  return existsSync(url)?readFileSync(url,'utf8'):'';
}

const registry=source('./mobile-visual-assets.ts');
const scene=source('./MobileSceneBackground.tsx');
const character=source('./MobileCharacterArt.tsx');

const required=[
  'home.background','home.hero',
  'category.life.background','category.growth.background','category.adventure.background','category.bond.background','category.records.background',
  'feature.raising.background','feature.ambition.background','feature.season.background','feature.sanctuary.background','feature.expedition.background','feature.world.background','feature.archive.background',
  'battle.default.background','battle.forest.background','battle.ruins.background','battle.rift.background','battle.result.victory','battle.result.defeat',
  'companion.bear.portrait','companion.owl.portrait','companion.wolf.portrait','companion.cat.portrait',
  'companion.bear.battle','companion.owl.battle','companion.wolf.battle','companion.cat.battle',
] as const;

describe('V9 replaceable mobile visual assets',()=>{
  it('centralizes every required semantic visual slot',()=>{
    expect(registry.length).toBeGreaterThan(0);
    expect(registry).toContain('export type MobileVisualSlot');
    expect(registry).toContain('export const mobileVisualAssets');
    expect(registry).toContain('export function getMobileVisualAsset');
    for(const slot of required)expect(registry).toContain(`'${slot}'`);
  });

  it('requires deterministic fallbacks and image-error handling',()=>{
    expect(registry).toContain('fallback:');
    expect(scene).toContain('v9-scene-fallback');
    expect(scene).toContain('onError');
    expect(character).toContain('v9-character-art');
    expect(character).toContain('onError');
  });

  it('keeps final visual paths out of consumers by exposing semantic renderers',()=>{
    expect(scene).toContain('getMobileVisualAsset(slot)');
    expect(character).toContain('getMobileVisualAsset(slot)');
  });
});
