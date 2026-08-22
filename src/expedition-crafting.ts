import type { GiftItemId } from './adventure';
import type { ExpeditionRelicId } from './expedition-relics';

export type ExpeditionMaterialId = 'star_bark' | 'arcane_shard' | 'wind_pearl';
export type ExpeditionMaterials = Record<ExpeditionMaterialId, number>;
export type ExpeditionCraftingRecipeId = 'star_cookie_recipe' | 'fox_charm_recipe' | 'herb_tea_recipe' | 'guardian_thread_recipe';
export type CraftingMilestoneId = 'crafted_star_cookie' | 'crafted_fox_charm' | 'crafted_herb_tea' | 'crafted_guardian_thread';

export const expeditionMaterialIds: ExpeditionMaterialId[] = ['star_bark', 'arcane_shard', 'wind_pearl'];
export const craftingMilestoneIds: CraftingMilestoneId[] = ['crafted_star_cookie', 'crafted_fox_charm', 'crafted_herb_tea', 'crafted_guardian_thread'];

export type ExpeditionCraftingRecipe = {
  id: ExpeditionCraftingRecipeId;
  label: string;
  costs: Partial<ExpeditionMaterials>;
  gift: GiftItemId | null;
  relic: ExpeditionRelicId | null;
  milestone: CraftingMilestoneId;
};

export type ExpeditionCraftingProgress = {
  craftingMilestones?: readonly CraftingMilestoneId[];
  ownedRelics?: readonly ExpeditionRelicId[];
};

export const craftingRecipes: ExpeditionCraftingRecipe[] = [
  { id: 'star_cookie_recipe', label: '별빛 쿠키 제작', costs: { star_bark: 2 }, gift: 'star_cookie', relic: null, milestone: 'crafted_star_cookie' },
  { id: 'fox_charm_recipe', label: '여우 부적 제작', costs: { arcane_shard: 2 }, gift: 'fox_charm', relic: null, milestone: 'crafted_fox_charm' },
  { id: 'herb_tea_recipe', label: '허브티 제작', costs: { wind_pearl: 2 }, gift: 'herb_tea', relic: null, milestone: 'crafted_herb_tea' },
  { id: 'guardian_thread_recipe', label: '수호자의 실 제작', costs: { star_bark: 3, arcane_shard: 3, wind_pearl: 3 }, gift: null, relic: 'guardian_thread', milestone: 'crafted_guardian_thread' },
];

export function emptyExpeditionMaterials(): ExpeditionMaterials {
  return { star_bark: 0, arcane_shard: 0, wind_pearl: 0 };
}

function isOneTimeRecipeCompleted(recipe: ExpeditionCraftingRecipe, progress: ExpeditionCraftingProgress): boolean {
  return Boolean(recipe.relic && (
    (progress.craftingMilestones ?? []).includes(recipe.milestone)
    || (progress.ownedRelics ?? []).includes(recipe.relic)
  ));
}

function hasValidMaterialBalances(materials: ExpeditionMaterials): boolean {
  return expeditionMaterialIds.every(id => Number.isFinite(materials[id]) && materials[id] >= 0);
}

export function canCraft(
  recipeId: ExpeditionCraftingRecipeId,
  materials: ExpeditionMaterials,
  progress: ExpeditionCraftingProgress = {},
): boolean {
  const recipe = craftingRecipes.find(item => item.id === recipeId);
  if (!recipe || isOneTimeRecipeCompleted(recipe, progress) || !hasValidMaterialBalances(materials)) return false;
  return expeditionMaterialIds.every(id => materials[id] >= (recipe.costs[id] ?? 0));
}

export function applyCrafting(
  recipeId: ExpeditionCraftingRecipeId,
  materials: ExpeditionMaterials,
  progress: ExpeditionCraftingProgress = {},
) {
  const recipe = craftingRecipes.find(item => item.id === recipeId);
  if (!recipe || !canCraft(recipeId, materials, progress)) return { crafted: false as const, materials, gift: null, relic: null, milestone: null };
  const next = { ...materials };
  for (const id of expeditionMaterialIds) next[id] = Math.max(0, next[id] - (recipe.costs[id] ?? 0));
  return { crafted: true as const, materials: next, gift: recipe.gift, relic: recipe.relic, milestone: recipe.milestone };
}
