import{describe,expect,it}from'vitest';import{recipeSequence,cookingAccuracy,cookingQuality,qualityMultiplier}from'./cooking-tap';import{recipeById}from'../cooking';
describe('cooking mini-game logic',()=>{
 it('expands a recipe into a flat ingredient sequence matching its counts',()=>{const recipe=recipeById('promise_cake')!;const seq=recipeSequence(recipe);expect(seq.filter(x=>x==='forest_berry')).toHaveLength(2);expect(seq.filter(x=>x==='spirit_leaf')).toHaveLength(2);expect(seq).toHaveLength(7)});
 it('scores a perfect match as accuracy 1',()=>{const seq=recipeSequence(recipeById('berry_milk')!);expect(cookingAccuracy(seq,seq)).toBe(1)});
 it('scores a completely wrong input as accuracy 0',()=>{const seq=recipeSequence(recipeById('berry_milk')!);expect(cookingAccuracy(seq,seq.slice().reverse().map(()=>'star_salt' as const))).toBe(0)});
 it('maps accuracy to a quality tier',()=>{expect(cookingQuality(1)).toBe('PERFECT');expect(cookingQuality(.7)).toBe('GOOD');expect(cookingQuality(.2)).toBe('NORMAL')});
 it('gives perfect cooking a bigger multiplier than a normal one',()=>{expect(qualityMultiplier('PERFECT')).toBeGreaterThan(qualityMultiplier('GOOD'));expect(qualityMultiplier('GOOD')).toBeGreaterThan(qualityMultiplier('NORMAL'))});
});
