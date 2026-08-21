import type { GiftItemId } from './adventure';
import type { ActivityId, MasteryState, Personality, Stats } from './game-core';
import { activeCallingTraits, type GrowthTraitId } from './growth-traits';
import type { GuardianCallingId } from './guardian-callings';
import { personalityArchetype, runaPreferences } from './runa-personality';

const clamp = (value:number) => {
  const safe = Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(100, safe));
};
const safeXp = (value:number) => Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

const personalityKeyByActivity: Record<ActivityId, keyof Personality> = {
  hunt:'courage',
  magic:'curiosity',
  rest:'calmness',
  herb:'curiosity',
};

function canonicalStats(stats:Stats): Stats {
  return {
    strength:clamp(stats.strength),
    intelligence:clamp(stats.intelligence),
    magic:clamp(stats.magic),
    morality:clamp(stats.morality),
    affection:clamp(stats.affection),
    stress:clamp(stats.stress),
    fatigue:clamp(stats.fatigue),
  };
}

function canonicalPersonality(personality:Personality): Personality {
  return {
    courage:clamp(personality.courage),
    kindness:clamp(personality.kindness),
    curiosity:clamp(personality.curiosity),
    calmness:clamp(personality.calmness),
  };
}

function canonicalMastery(mastery:MasteryState): MasteryState {
  return Object.fromEntries(
    Object.entries(mastery).map(([id, entry]) => [id, { xp:safeXp(entry?.xp) }]),
  ) as MasteryState;
}

function incrementMasteryXp(mastery:MasteryState, activity:ActivityId): void {
  mastery[activity] = { xp:safeXp(mastery[activity]?.xp) + 1 };
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
  const stats = canonicalStats(input.stats);
  const personality = canonicalPersonality(input.personality);
  const mastery = canonicalMastery(input.mastery);
  const preferences = runaPreferences(personalityArchetype(input.personality), input.activeCalling);
  const activeTraits = new Set(activeCallingTraits(input.activeCalling, input.purchasedTraits));

  const preferredActivityCount = input.schedule.filter(activity => activity === preferences.favoriteActivity).length;
  if (preferredActivityCount > 0) {
    const key = personalityKeyByActivity[preferences.favoriteActivity];
    personality[key] = clamp(personality[key] + preferredActivityCount);
    for (let count = 0; count < preferredActivityCount; count += 1) incrementMasteryXp(mastery, preferences.favoriteActivity);
  }

  if (activeTraits.has('vanguard_power') && input.schedule.includes('hunt')) stats.strength = clamp(stats.strength + 1);
  if (activeTraits.has('arcanist_mana') && input.schedule.includes('magic')) stats.magic = clamp(stats.magic + 1);
  if (activeTraits.has('arcanist_insight') && input.schedule.includes('magic')) stats.intelligence = clamp(stats.intelligence + 1);
  if (activeTraits.has('caretaker_rest') && input.schedule.includes('rest')) stats.fatigue = clamp(stats.fatigue - 2);
  if (activeTraits.has('pathfinder_herb') && input.schedule.includes('herb')) stats.intelligence = clamp(stats.intelligence + 1);
  const trainingScore = Number.isFinite(input.trainingScore) ? Math.max(0, input.trainingScore) : 0;
  if (activeTraits.has('vanguard_focus') && input.schedule.includes('hunt') && trainingScore >= 650) incrementMasteryXp(mastery, 'hunt');

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
  const stats = canonicalStats(input.stats);
  const preferences = runaPreferences(personalityArchetype(input.personality), input.activeCalling);
  const activeTraits = new Set(activeCallingTraits(input.activeCalling, input.purchasedTraits));
  if (input.item === preferences.favoriteGift) stats.affection = clamp(stats.affection + 2);
  if (activeTraits.has('caretaker_bond')) stats.affection = clamp(stats.affection + 1);
  return { stats, preferences };
}
