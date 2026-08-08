import type { Personality, Stats } from './game';

export type OutingLocationId = 'forest' | 'village' | 'lakeside';
export type GiftItemId = 'star_cookie' | 'herb_tea' | 'fox_charm';
export type Inventory = Record<GiftItemId, number>;

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

export function startingInventory(): Inventory {
  return { star_cookie: 2, herb_tea: 1, fox_charm: 1 };
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
