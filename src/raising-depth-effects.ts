import type { GiftItemId } from './adventure';
import type { ActivityId, MasteryState, Personality, Stats } from './game-core';
import { activeCallingTraits, type GrowthTraitId } from './growth-traits';
import type { GuardianCallingId } from './guardian-callings';
import { personalityArchetype, runaPreferences } from './runa-personality';

const clamp = (value:number) => Math.max(0, Math.min(100, value));

const personalityKeyByActivity: Record<ActivityId, keyof Personality> = {
  hunt:'courage',
  magic:'curiosity',
  rest:'calmness',
  herb:'curiosity',
};

function incrementMasteryXp(mastery: MasteryState, activity: ActivityId): void {
  const currentXp = Number.isFinite(mastery[activity]?.xp) ? Math.max(0, Math.floor(mastery[activity].xp)) : 0;
  mastery[activity] = { xp:currentXp + 1 };
}

export type TrainingIdentityInput = {
  stats:Stats;
  personality:Personality;
  mastery:MasteryState;
  schedule:ActivityId[];
  trainingScore:number;
  activeCalling:GuardianCallingId | null;
  purchasedTraits:GrowthTraitId[];
};

export function applyTrainingIdentityEffects(input:TrainingIdentityInput) {
  const stats = { ...input.stats };
  const personality = { ...input.personality };
  const mastery = Object.fromEntries(Object.entries(input.mastery).map(([id, entry]) => [id, { ...entry }])) as MasteryState;
  const preferences = runaPreferences(personalityArchetype(input.personality), input.activeCalling);
  const activeTraits = new Set(activeCallingTraits(input.activeCalling, input.purchasedTraits));

  if (input.schedule.includes(preferences.favoriteActivity)) {
    const key = personalityKeyByActivity[preferences.favoriteActivity];
    personality[key] = clamp(personality[key] + 1);
    incrementMasteryXp(mastery, preferences.favoriteActivity);
  }

  if (activeTraits.has('vanguard_power') && input.schedule.includes('hunt')) stats.strength = clamp(stats.strength + 1);
  if (activeTraits.has('arcanist_mana') && input.schedule.includes('magic')) stats.magic = clamp(stats.magic + 1);
  if (activeTraits.has('arcanist_insight') && input.schedule.includes('magic')) stats.intelligence = clamp(stats.intelligence + 1);
  if (activeTraits.has('caretaker_rest') && input.schedule.includes('rest')) stats.fatigue = clamp(stats.fatigue - 2);
  if (activeTraits.has('pathfinder_herb') && input.schedule.includes('herb')) stats.intelligence = clamp(stats.intelligence + 1);
  const trainingScore = Number.isFinite(input.trainingScore) ? Math.max(0, input.trainingScore) : 0;
  if (activeTraits.has('vanguard_focus') && input.schedule.includes('hunt') && trainingScore >= 650) {
    incrementMasteryXp(mastery, 'hunt');
  }

  return { stats, personality, mastery, preferences };
}

export type GiftIdentityInput = {
  stats:Stats;
  personality:Personality;
  item:GiftItemId;
  activeCalling:GuardianCallingId | null;
  purchasedTraits:GrowthTraitId[];
};

export function applyGiftIdentityEffects(input:GiftIdentityInput) {
  const stats = { ...input.stats };
  const preferences = runaPreferences(personalityArchetype(input.personality), input.activeCalling);
  const activeTraits = new Set(activeCallingTraits(input.activeCalling, input.purchasedTraits));
  if (input.item === preferences.favoriteGift) stats.affection = clamp(stats.affection + 2);
  if (activeTraits.has('caretaker_bond')) stats.affection = clamp(stats.affection + 1);
  return { stats, preferences };
}
