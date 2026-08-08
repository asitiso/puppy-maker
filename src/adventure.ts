import type { Personality, Stats } from './game';

export type OutingLocationId = 'forest' | 'village' | 'lakeside';
export type GiftItemId = 'star_cookie' | 'herb_tea' | 'fox_charm';
export type Inventory = Record<GiftItemId, number>;
export type ExplorationEventId =
  | 'glowing_tracks'
  | 'ancient_tree'
  | 'street_performance'
  | 'wand_repair'
  | 'silver_fish'
  | 'quiet_breeze';
export type DiscoveryId =
  | 'moon_feather'
  | 'star_mushroom'
  | 'tiny_bell'
  | 'old_spellbook'
  | 'glass_shell'
  | 'wind_crystal';

export type ExplorationOutcome = {
  event: ExplorationEventId | null;
  discovery: DiscoveryId | null;
};

type OutingDefinition = {
  name: string;
  description: string;
  statDelta: Partial<Stats>;
  personalityDelta: Partial<Personality>;
  rewardItem: GiftItemId;
};

type GiftDefinition = {
  name: string;
  description: string;
  statDelta: Partial<Stats>;
  personalityDelta: Partial<Personality>;
};

export const outingDefinitions: Record<OutingLocationId, OutingDefinition> = {
  forest: {
    name: '별빛 숲',
    description: '호기심 ↑ · 피로 +8',
    statDelta: { fatigue: 8 },
    personalityDelta: { curiosity: 2 },
    rewardItem: 'star_cookie',
  },
  village: {
    name: '마법 마을',
    description: '다정함 ↑ · 피로 +6',
    statDelta: { fatigue: 6 },
    personalityDelta: { kindness: 2 },
    rewardItem: 'fox_charm',
  },
  lakeside: {
    name: '바람 호숫가',
    description: '침착함 ↑ · 스트레스 ↓',
    statDelta: { fatigue: 4, stress: -8 },
    personalityDelta: { calmness: 2 },
    rewardItem: 'herb_tea',
  },
};

export const giftDefinitions: Record<GiftItemId, GiftDefinition> = {
  star_cookie: {
    name: '별빛 쿠키',
    description: '호감도 +6 · 스트레스 -4',
    statDelta: { affection: 6, stress: -4 },
    personalityDelta: {},
  },
  herb_tea: {
    name: '허브티',
    description: '피로 -8 · 침착함 +2',
    statDelta: { fatigue: -8 },
    personalityDelta: { calmness: 2 },
  },
  fox_charm: {
    name: '여우 부적',
    description: '호감도 +3 · 용감함 +2',
    statDelta: { affection: 3 },
    personalityDelta: { courage: 2 },
  },
};

export const outingLocationIds: OutingLocationId[] = ['forest', 'village', 'lakeside'];
export const giftItemIds: GiftItemId[] = ['star_cookie', 'herb_tea', 'fox_charm'];
export const discoveryIds: DiscoveryId[] = [
  'moon_feather', 'star_mushroom', 'tiny_bell', 'old_spellbook', 'glass_shell', 'wind_crystal',
];

const commonEvents: Record<OutingLocationId, ExplorationEventId> = {
  forest: 'glowing_tracks',
  village: 'street_performance',
  lakeside: 'silver_fish',
};

const advancedEvents: Record<OutingLocationId, ExplorationEventId> = {
  forest: 'ancient_tree',
  village: 'wand_repair',
  lakeside: 'quiet_breeze',
};

const locationDiscoveries: Record<OutingLocationId, [DiscoveryId, DiscoveryId]> = {
  forest: ['moon_feather', 'star_mushroom'],
  village: ['tiny_bell', 'old_spellbook'],
  lakeside: ['glass_shell', 'wind_crystal'],
};

export function startingInventory(): Inventory {
  return { star_cookie: 2, herb_tea: 1, fox_charm: 1 };
}

export function startingExplorationXp(): Record<OutingLocationId, number> {
  return { forest: 0, village: 0, lakeside: 0 };
}

export function explorationLevel(xp: number): number {
  if (xp >= 18) return 5;
  if (xp >= 12) return 4;
  if (xp >= 7) return 3;
  if (xp >= 3) return 2;
  return 1;
}

export function explorationXpForNextLevel(xp: number): number | null {
  const level = explorationLevel(xp);
  if (level >= 5) return null;
  return [3, 7, 12, 18][level - 1];
}

export function pickExplorationOutcome(
  location: OutingLocationId,
  xp: number,
  discoveries: DiscoveryId[],
  roll: number,
): ExplorationOutcome {
  const level = explorationLevel(xp);
  const safeRoll = Math.max(0, Math.min(0.999999, roll));

  if (safeRoll < 0.3) return { event: commonEvents[location], discovery: null };
  if (level >= 3 && safeRoll < 0.45) return { event: advancedEvents[location], discovery: null };

  const [first, second] = locationDiscoveries[location];
  const discovery = level >= 4 && !discoveries.includes(first) && safeRoll < 0.65
    ? first
    : level >= 4 && !discoveries.includes(second) && safeRoll < 0.65
      ? second
      : level >= 2 && !discoveries.includes(first) && safeRoll < 0.65
        ? first
        : null;

  return { event: null, discovery };
}

const clamp = (value: number) => Math.max(0, Math.min(100, value));

function applyStats(stats: Stats, delta: Partial<Stats>): Stats {
  const next = { ...stats };
  for (const [key, value] of Object.entries(delta)) {
    const statKey = key as keyof Stats;
    next[statKey] = clamp(next[statKey] + (value ?? 0));
  }
  return next;
}

function applyPersonality(personality: Personality, delta: Partial<Personality>): Personality {
  const next = { ...personality };
  for (const [key, value] of Object.entries(delta)) {
    const personalityKey = key as keyof Personality;
    next[personalityKey] = clamp(next[personalityKey] + (value ?? 0));
  }
  return next;
}

export function applyOutingEffects(
  stats: Stats,
  personality: Personality,
  location: OutingLocationId,
): { stats: Stats; personality: Personality } {
  const definition = outingDefinitions[location];
  return {
    stats: applyStats(stats, definition.statDelta),
    personality: applyPersonality(personality, definition.personalityDelta),
  };
}

export function applyGiftEffects(
  stats: Stats,
  personality: Personality,
  item: GiftItemId,
): { stats: Stats; personality: Personality } {
  const definition = giftDefinitions[item];
  return {
    stats: applyStats(stats, definition.statDelta),
    personality: applyPersonality(personality, definition.personalityDelta),
  };
}
