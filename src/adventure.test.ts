import { describe, expect, it } from 'vitest';
import {
  applyGiftEffects,
  applyOutingEffects,
  giftDefinitions,
  outingDefinitions,
  startingInventory,
} from './adventure';

describe('outing and gift rules', () => {
  it('defines three stable outing locations', () => {
    expect(Object.keys(outingDefinitions)).toEqual(['forest', 'village', 'lakeside']);
    expect(outingDefinitions.forest.rewardItem).toBe('star_cookie');
    expect(outingDefinitions.village.rewardItem).toBe('fox_charm');
    expect(outingDefinitions.lakeside.rewardItem).toBe('herb_tea');
  });

  it('defines three consumable gifts', () => {
    expect(Object.keys(giftDefinitions)).toEqual(['star_cookie', 'herb_tea', 'fox_charm']);
    expect(giftDefinitions.star_cookie.name).toBe('별빛 쿠키');
    expect(giftDefinitions.herb_tea.name).toBe('허브티');
    expect(giftDefinitions.fox_charm.name).toBe('여우 부적');
  });

  it('creates a fresh starting inventory', () => {
    const first = startingInventory();
    const second = startingInventory();
    expect(first).toEqual({ star_cookie: 2, herb_tea: 1, fox_charm: 1 });
    first.star_cookie = 0;
    expect(second.star_cookie).toBe(2);
  });

  it('applies outing effects while clamping stats', () => {
    const forest = applyOutingEffects(
      { strength: 10, intelligence: 10, magic: 10, morality: 10, affection: 10, stress: 10, fatigue: 98 },
      { courage: 10, kindness: 10, curiosity: 99, calmness: 10 },
      'forest',
    );
    expect(forest.stats.fatigue).toBe(100);
    expect(forest.personality.curiosity).toBe(100);

    const lakeside = applyOutingEffects(
      { strength: 10, intelligence: 10, magic: 10, morality: 10, affection: 10, stress: 4, fatigue: 10 },
      { courage: 10, kindness: 10, curiosity: 10, calmness: 99 },
      'lakeside',
    );
    expect(lakeside.stats.stress).toBe(0);
    expect(lakeside.personality.calmness).toBe(100);
  });

  it('applies gift effects while clamping stats and personality', () => {
    const cookie = applyGiftEffects(
      { strength: 10, intelligence: 10, magic: 10, morality: 10, affection: 98, stress: 2, fatigue: 10 },
      { courage: 10, kindness: 10, curiosity: 10, calmness: 10 },
      'star_cookie',
    );
    expect(cookie.stats.affection).toBe(100);
    expect(cookie.stats.stress).toBe(0);

    const tea = applyGiftEffects(
      { strength: 10, intelligence: 10, magic: 10, morality: 10, affection: 10, stress: 10, fatigue: 4 },
      { courage: 10, kindness: 10, curiosity: 10, calmness: 99 },
      'herb_tea',
    );
    expect(tea.stats.fatigue).toBe(0);
    expect(tea.personality.calmness).toBe(100);
  });
});
