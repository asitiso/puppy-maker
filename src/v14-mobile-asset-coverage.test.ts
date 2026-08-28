import {describe,expect,it} from 'vitest';
import {mobileVisualAssets,type MobileVisualSlot} from './mobile-visual-assets';

const backdropSlots:MobileVisualSlot[]=[
  'home.background',
  'category.life.background',
  'category.growth.background',
  'category.adventure.background',
  'category.bond.background',
  'category.records.background',
  'feature.raising.background',
  'feature.ambition.background',
  'feature.season.background',
  'feature.sanctuary.background',
  'feature.expedition.background',
  'feature.world.background',
  'feature.archive.background',
  'battle.default.background',
  'battle.forest.background',
  'battle.ruins.background',
  'battle.rift.background',
  'battle.result.victory',
  'battle.result.defeat',
];

describe('V14 concrete mobile visual coverage',()=>{
  it.each(backdropSlots)('%s uses a real repository asset instead of a fallback-only surface',slot=>{
    expect(mobileVisualAssets[slot].src).toMatch(/^\/assets\//);
  });
});
