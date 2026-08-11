import type{IngredientId}from'../exploration';import type{Recipe}from'../cooking';
// Cooking used to be a single tap that instantly resolved the recipe.
// This gives it an actual mini-game: memorize the recipe's own
// ingredient order, then tap them back into the pot in that order —
// same "memorize → reproduce" shape as the magic training rune game
// (see minigames/sequence.ts), but built from the recipe's real
// ingredients instead of abstract symbols, and scored 0-1 the same way.
export const recipeSequence=(recipe:Recipe):IngredientId[]=>{
 const seq:IngredientId[]=[];
 for(const[id,count]of Object.entries(recipe.ingredients))for(let i=0;i<(count??0);i++)seq.push(id as IngredientId);
 return seq;
};
export function cookingAccuracy(target:IngredientId[],input:IngredientId[]):number{
 if(target.length===0)return 1;
 let correct=0;
 for(let i=0;i<target.length;i++)if(input[i]===target[i])correct++;
 return correct/target.length;
}
export type CookingQuality='PERFECT'|'GOOD'|'NORMAL';
export const cookingQuality=(accuracy:number):CookingQuality=>accuracy>=.95?'PERFECT':accuracy>=.6?'GOOD':'NORMAL';
export const qualityMultiplier=(quality:CookingQuality):number=>quality==='PERFECT'?1.3:quality==='GOOD'?1:.7;
