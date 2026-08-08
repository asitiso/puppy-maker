import type { GiftItemId } from './adventure';
import type { ActivityId, Personality } from './game-core';

export type RunaPersonalityArchetype = 'brave' | 'gentle' | 'curious' | 'serene' | 'balanced';
export type PreferenceCallingId = 'vanguard' | 'arcanist' | 'caretaker' | 'pathfinder';

const personalityKeys: Array<keyof Personality> = ['courage', 'kindness', 'curiosity', 'calmness'];
const archetypeByKey: Record<keyof Personality, Exclude<RunaPersonalityArchetype, 'balanced'>> = {
  courage: 'brave',
  kindness: 'gentle',
  curiosity: 'curious',
  calmness: 'serene',
};

export function personalityArchetype(personality: Personality): RunaPersonalityArchetype {
  const ranked = personalityKeys
    .map(key => ({ key, value: Number.isFinite(personality[key]) ? personality[key] : 0 }))
    .sort((a, b) => b.value - a.value);
  if (ranked.length < 2 || ranked[0].value - ranked[1].value < 5) return 'balanced';
  return archetypeByKey[ranked[0].key];
}

const activityByCalling: Record<PreferenceCallingId, ActivityId> = {
  vanguard: 'hunt',
  arcanist: 'magic',
  caretaker: 'rest',
  pathfinder: 'herb',
};

const giftByCalling: Record<PreferenceCallingId, GiftItemId> = {
  vanguard: 'fox_charm',
  arcanist: 'star_cookie',
  caretaker: 'herb_tea',
  pathfinder: 'star_cookie',
};

export function runaPreferences(archetype: RunaPersonalityArchetype, calling: PreferenceCallingId | null): { favoriteActivity: ActivityId; favoriteGift: GiftItemId } {
  if (archetype === 'brave') return { favoriteActivity: 'hunt', favoriteGift: 'fox_charm' };
  if (archetype === 'serene') return { favoriteActivity: 'rest', favoriteGift: 'herb_tea' };
  if (archetype === 'curious') return { favoriteActivity: calling === 'pathfinder' ? 'herb' : 'magic', favoriteGift: 'star_cookie' };
  if (archetype === 'gentle') return { favoriteActivity: calling === 'pathfinder' ? 'herb' : 'rest', favoriteGift: 'herb_tea' };
  if (calling) return { favoriteActivity: activityByCalling[calling], favoriteGift: giftByCalling[calling] };
  return { favoriteActivity: 'rest', favoriteGift: 'herb_tea' };
}
