import{describe,expect,it}from'vitest';import{initialWorldState,worldReducer,type WorldState}from'./world-state';describe('world reward nonnegative invariants',()=>{it('never makes gold negative through world message and month actions',()=>{
// Explicit :WorldState annotation — without it TS infers this literal's
// own narrow type (lastWorldMessage: string, screen: 'result') instead
// of the real WorldState shape, so reassigning `state` to whatever
// worldReducer actually returns (lastWorldMessage: string|undefined,
// screen: Screen) fails to type-check even though it's correct at
// runtime.
let state:WorldState={...initialWorldState,gold:0,lastWorldMessage:'x',screen:'result'};state=worldReducer(state,{type:'CLEAR_WORLD_MESSAGE'});state=worldReducer(state,{type:'NEXT_MONTH'});expect(state.gold).toBeGreaterThanOrEqual(0)})});
