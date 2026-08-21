import { describe, expect, it } from 'vitest';
import { applyCrafting, canCraft, craftingRecipes, emptyExpeditionMaterials } from './expedition-crafting';

describe('expedition crafting', () => {
  it('defines the four approved deterministic recipes', () => {
    expect(craftingRecipes.map(recipe => recipe.id)).toEqual(['star_cookie_recipe', 'fox_charm_recipe', 'herb_tea_recipe', 'guardian_thread_recipe']);
  });

  it('rejects insufficient materials without mutation', () => {
    const materials = emptyExpeditionMaterials();
    expect(canCraft('star_cookie_recipe', materials)).toBe(false);
    expect(applyCrafting('star_cookie_recipe', materials)).toEqual({ crafted: false, materials, gift: null, relic: null, milestone: null });
  });

  it('spends exactly two regional materials for gifts', () => {
    const materials = { star_bark: 3, arcane_shard: 2, wind_pearl: 2 };
    const star = applyCrafting('star_cookie_recipe', materials);
    expect(star.crafted).toBe(true);
    expect(star.materials.star_bark).toBe(1);
    expect(star.gift).toBe('star_cookie');
    expect(star.milestone).toBe('crafted_star_cookie');
  });

  it('requires three of every regional material for guardian thread', () => {
    const result = applyCrafting('guardian_thread_recipe', { star_bark: 3, arcane_shard: 3, wind_pearl: 3 });
    expect(result.crafted).toBe(true);
    expect(result.materials).toEqual({ star_bark: 0, arcane_shard: 0, wind_pearl: 0 });
    expect(result.relic).toBe('guardian_thread');
    expect(result.milestone).toBe('crafted_guardian_thread');
  });

  it('does not consume materials when the one-time guardian thread was already crafted', () => {
    const materials = { star_bark: 3, arcane_shard: 3, wind_pearl: 3 };
    const result = applyCrafting('guardian_thread_recipe', materials, {
      craftingMilestones:['crafted_guardian_thread'],
      ownedRelics:['guardian_thread'],
    });
    expect(result.crafted).toBe(false);
    expect(result.materials).toEqual(materials);
    expect(canCraft('guardian_thread_recipe', materials, {
      craftingMilestones:['crafted_guardian_thread'],
      ownedRelics:['guardian_thread'],
    })).toBe(false);
  });

  it('blocks guardian thread recrafting from the milestone even if relic ownership is stale', () => {
    const materials = { star_bark: 3, arcane_shard: 3, wind_pearl: 3 };
    const result = applyCrafting('guardian_thread_recipe', materials, {
      craftingMilestones:['crafted_guardian_thread'],
      ownedRelics:[],
    });

    expect(result.crafted).toBe(false);
    expect(result.materials).toEqual(materials);
    expect(result.relic).toBeNull();
    expect(result.milestone).toBeNull();
  });

  it('blocks guardian thread recrafting from relic ownership even if the milestone is stale', () => {
    const materials = { star_bark: 3, arcane_shard: 3, wind_pearl: 3 };
    const result = applyCrafting('guardian_thread_recipe', materials, {
      craftingMilestones:[],
      ownedRelics:['guardian_thread'],
    });

    expect(result.crafted).toBe(false);
    expect(result.materials).toEqual(materials);
    expect(result.relic).toBeNull();
    expect(result.milestone).toBeNull();
  });

  it('fails guardian thread crafting atomically when any one material is short', () => {
    const materials = { star_bark: 3, arcane_shard: 2, wind_pearl: 3 };
    const result = applyCrafting('guardian_thread_recipe', materials);

    expect(result).toEqual({
      crafted: false,
      materials,
      gift: null,
      relic: null,
      milestone: null,
    });
    expect(materials).toEqual({ star_bark: 3, arcane_shard: 2, wind_pearl: 3 });
  });

  it('keeps gift recipes repeatable after their milestone was recorded', () => {
    const materials = { star_bark: 4, arcane_shard: 0, wind_pearl: 0 };
    expect(canCraft('star_cookie_recipe', materials, { craftingMilestones:['crafted_star_cookie'] })).toBe(true);
  });

  it('rejects non-finite material balances instead of enabling infinite crafting', () => {
    const materials = { star_bark: Number.POSITIVE_INFINITY, arcane_shard: 3, wind_pearl: 3 };

    expect(canCraft('star_cookie_recipe', materials)).toBe(false);
    expect(applyCrafting('star_cookie_recipe', materials)).toEqual({
      crafted: false,
      materials,
      gift: null,
      relic: null,
      milestone: null,
    });
    expect(canCraft('guardian_thread_recipe', materials)).toBe(false);
  });
});