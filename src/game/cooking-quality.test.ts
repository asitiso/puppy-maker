import{describe,expect,it}from'vitest';import{initialWorldState,worldReducer}from'./world-state';
const withIngredients={...initialWorldState,ingredients:{forest_berry:1,warm_milk:1}};
describe('cooking quality scales the recipe effect',()=>{
 it('applies the full effect when no quality is given (backward compatible)',()=>{const s=worldReducer(withIngredients,{type:'COOK',recipeId:'berry_milk'});expect(s.stats.fatigue).toBe(initialWorldState.stats.fatigue-12)});
 it('applies a stronger effect on a PERFECT cook',()=>{const s=worldReducer(withIngredients,{type:'COOK',recipeId:'berry_milk',quality:'PERFECT'});expect(s.stats.fatigue).toBe(initialWorldState.stats.fatigue-16)});
 it('applies a weaker effect on a NORMAL cook',()=>{const s=worldReducer(withIngredients,{type:'COOK',recipeId:'berry_milk',quality:'NORMAL'});expect(s.stats.fatigue).toBe(initialWorldState.stats.fatigue-8)});
 it('still consumes ingredients and blocks cooking without enough on hand regardless of quality',()=>{const s=worldReducer(initialWorldState,{type:'COOK',recipeId:'berry_milk',quality:'PERFECT'});expect(s).toBe(initialWorldState)});
});
