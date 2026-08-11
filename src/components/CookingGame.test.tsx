import{renderToStaticMarkup}from'react-dom/server';import{describe,expect,it,vi}from'vitest';import{CookingGame}from'./CookingGame';import{recipeById}from'../game/cooking';
describe('CookingGame',()=>{
 it('starts on an intro screen listing the recipe ingredients instead of resolving instantly',()=>{const recipe=recipeById('berry_milk')!;const html=renderToStaticMarkup(<CookingGame recipe={recipe} onComplete={vi.fn()} onCancel={vi.fn()}/>);expect(html).toContain('숲열매 밀크');expect(html).toContain('요리 시작');expect(html).not.toContain('루나에게 대접하기')});
 it('describes the recipe ingredients with their required counts',()=>{const recipe=recipeById('promise_cake')!;const html=renderToStaticMarkup(<CookingGame recipe={recipe} onComplete={vi.fn()} onCancel={vi.fn()}/>);expect(html).toContain('숲열매');expect(html).toContain('×2')});
});
