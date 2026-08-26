export type MobileVisualOverlay='none'|'light'|'medium'|'heavy';
export type MobileVisualFallback='home'|'life'|'growth'|'adventure'|'bond'|'records'|'battle'|'victory'|'defeat'|'character';

export type MobileVisualAsset={
  src?:string;
  fit:'cover'|'contain';
  position:string;
  overlay:MobileVisualOverlay;
  alt?:string;
  fallback:MobileVisualFallback;
};

export type MobileVisualSlot=
  |'home.background'|'home.hero'
  |'category.life.background'|'category.growth.background'|'category.adventure.background'|'category.bond.background'|'category.records.background'
  |'feature.raising.background'|'feature.ambition.background'|'feature.season.background'|'feature.sanctuary.background'|'feature.expedition.background'|'feature.world.background'|'feature.archive.background'
  |'battle.default.background'|'battle.forest.background'|'battle.ruins.background'|'battle.rift.background'
  |'battle.result.victory'|'battle.result.defeat'
  |'companion.bear.portrait'|'companion.owl.portrait'|'companion.wolf.portrait'|'companion.cat.portrait'
  |'companion.bear.battle'|'companion.owl.battle'|'companion.wolf.battle'|'companion.cat.battle';

const fallbackAsset=(fallback:MobileVisualFallback,overrides:Partial<MobileVisualAsset>={}):MobileVisualAsset=>({
  fit:'cover',
  position:'center',
  overlay:'medium',
  fallback,
  ...overrides,
});

export const mobileVisualAssets:Record<MobileVisualSlot,MobileVisualAsset>={
  'home.background':fallbackAsset('home',{src:'/assets/home/home_bg_layer.webp',overlay:'medium'}),
  'home.hero':fallbackAsset('character',{src:'/assets/home/runa_idle_layer.png',fit:'contain',position:'center bottom',overlay:'none',alt:'루나'}),

  'category.life.background':fallbackAsset('life'),
  'category.growth.background':fallbackAsset('growth'),
  'category.adventure.background':fallbackAsset('adventure'),
  'category.bond.background':fallbackAsset('bond'),
  'category.records.background':fallbackAsset('records'),

  'feature.raising.background':fallbackAsset('growth'),
  'feature.ambition.background':fallbackAsset('growth'),
  'feature.season.background':fallbackAsset('records'),
  'feature.sanctuary.background':fallbackAsset('records'),
  'feature.expedition.background':fallbackAsset('adventure'),
  'feature.world.background':fallbackAsset('adventure'),
  'feature.archive.background':fallbackAsset('records'),

  'battle.default.background':fallbackAsset('battle',{overlay:'light'}),
  'battle.forest.background':fallbackAsset('adventure',{overlay:'light'}),
  'battle.ruins.background':fallbackAsset('records',{overlay:'light'}),
  'battle.rift.background':fallbackAsset('battle',{overlay:'heavy'}),
  'battle.result.victory':fallbackAsset('victory',{overlay:'light'}),
  'battle.result.defeat':fallbackAsset('defeat',{overlay:'medium'}),

  'companion.bear.portrait':fallbackAsset('character',{fit:'contain',overlay:'none',alt:'곰 동료'}),
  'companion.owl.portrait':fallbackAsset('character',{fit:'contain',overlay:'none',alt:'올빼미 동료'}),
  'companion.wolf.portrait':fallbackAsset('character',{fit:'contain',overlay:'none',alt:'늑대 동료'}),
  'companion.cat.portrait':fallbackAsset('character',{fit:'contain',overlay:'none',alt:'고양이 동료'}),
  'companion.bear.battle':fallbackAsset('character',{fit:'contain',overlay:'none',alt:'전투 중인 곰 동료'}),
  'companion.owl.battle':fallbackAsset('character',{fit:'contain',overlay:'none',alt:'전투 중인 올빼미 동료'}),
  'companion.wolf.battle':fallbackAsset('character',{fit:'contain',overlay:'none',alt:'전투 중인 늑대 동료'}),
  'companion.cat.battle':fallbackAsset('character',{fit:'contain',overlay:'none',alt:'전투 중인 고양이 동료'}),
};

export function getMobileVisualAsset(slot:MobileVisualSlot):MobileVisualAsset{
  return mobileVisualAssets[slot];
}
