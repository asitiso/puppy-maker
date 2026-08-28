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

  'category.life.background':fallbackAsset('life',{src:'/assets/home/home_bg_layer.webp'}),
  'category.growth.background':fallbackAsset('growth',{src:'/assets/training/focus_training_bg.webp'}),
  'category.adventure.background':fallbackAsset('adventure',{src:'/assets/outing/forest_walk_bg.webp'}),
  'category.bond.background':fallbackAsset('bond',{src:'/assets/outing/park_bg.webp'}),
  'category.records.background':fallbackAsset('records',{src:'/assets/event/special_event_bg.webp'}),

  'feature.raising.background':fallbackAsset('growth',{src:'/assets/training/focus_training_bg.webp'}),
  'feature.ambition.background':fallbackAsset('growth',{src:'/assets/training/magic_training_bg.webp'}),
  'feature.season.background':fallbackAsset('records',{src:'/assets/event/special_event_bg.webp'}),
  'feature.sanctuary.background':fallbackAsset('records',{src:'/assets/home/home_bg_layer.webp'}),
  'feature.expedition.background':fallbackAsset('adventure',{src:'/assets/outing/forest_walk_bg.webp'}),
  'feature.world.background':fallbackAsset('adventure',{src:'/assets/outing/village_bg.webp'}),
  'feature.archive.background':fallbackAsset('records',{src:'/assets/event/special_event_bg.webp'}),

  'battle.default.background':fallbackAsset('battle',{src:'/assets/training/fight_training_bg.webp',overlay:'light'}),
  'battle.forest.background':fallbackAsset('adventure',{src:'/assets/outing/forest_walk_bg.webp',overlay:'light'}),
  'battle.ruins.background':fallbackAsset('records',{src:'/assets/event/special_event_bg.webp',overlay:'light'}),
  'battle.rift.background':fallbackAsset('battle',{src:'/assets/training/magic_training_bg.webp',overlay:'heavy'}),
  'battle.result.victory':fallbackAsset('victory',{src:'/assets/result/training_result_bg.webp',overlay:'light'}),
  'battle.result.defeat':fallbackAsset('defeat',{src:'/assets/result/training_result_bg.webp',overlay:'medium'}),

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
