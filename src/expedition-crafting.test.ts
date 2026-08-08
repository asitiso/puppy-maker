import { describe, expect, it } from 'vitest';
import { applyCrafting, canCraft, craftingRecipes, emptyExpeditionMaterials } from './expedition-crafting';

describe('expedition crafting', () => {
  it('defines the four approved deterministic recipes', () => {
    expect(craftingRecipes.map(recipe => recipe.id)).toEqual(['star_cookie_recipe', 'fox_charm_recipe', 'herb_tea_recipe', 'guardian_thread_recipe']);
  });

  it('rejects insufficient materials without mutation', () => {
    const materials = emptyExpeditionMaterials();
    expect(canCraft('star_cookie_recipe', materials)).toBe(false);
    expect(applyCrafting('star_cookie_recipe', materials)).toEqual({ crafted: false, materials, gift: null, relic: null });
  });

  it('spends exactly two regional materials for gifts', () => {
    const materials = { star_bark: 3, arcane_shard: 2, wind_pearl: 2 };
    const star = applyCrafting('star_cookie_recipe', materials);
    expect(star.crafted).toBe(true);
    expect(star.materials.star_bark).toBe(1);
    expect(star.gift).toBe('star_cookie');
  });

  it('requires three of every regional material for guardian thread', () => {
    const result = applyCrafting('guardian_thread_recipe', { star_bark: 3, arcane_shard: 3, wind_pearl: 3 });
    expect(result.crafted).toBe(true);
    expect(result.materials).toEqual({ star_bark: 0, arcane_shard: 0, wind_pearl: 0 });
    expect(result.relic).toBe('guardian_thread');
  });
});
