import{describe,expect,it}from'vitest';import{initialWorldState,worldReducer}from'./world-state';import{GENETIC_TRAITS,traitForEnding}from'./genetics';
const finishRun=(state=initialWorldState)=>{let s=state;for(let m=0;m<12;m++)s=worldReducer({...s,screen:'result'},{type:'NEXT_MONTH'});return s};
describe('genetic trait legacy',()=>{
 it('awards a legacy trait matching the resolved ending once the run completes',()=>{const finished=finishRun();expect(finished.resolvedEnding).toBeDefined();expect(finished.legacyTrait).toBe(traitForEnding(finished.resolvedEnding!));expect(finished.traitCollection).toContain(finished.legacyTrait)});
 it('does not award a trait mid-run',()=>{let s=worldReducer({...initialWorldState,screen:'result'},{type:'NEXT_MONTH'});expect(s.legacyTrait).toBeUndefined()});
 it('carries the earned trait into the next generation as the active trait and applies its stat bonus',()=>{const finished=finishRun();const trait=GENETIC_TRAITS[finished.legacyTrait!];const started=worldReducer(finished,{type:'NEW_RUN'});expect(started.activeTrait).toBe(finished.legacyTrait);expect(started.legacyTrait).toBeUndefined();(Object.keys(trait.statBonus)as(keyof typeof trait.statBonus)[]).forEach(key=>{expect(started.stats[key]).toBe(Math.max(0,Math.min(100,initialWorldState.stats[key]+(trait.statBonus[key]??0))))})});
 it('keeps the trait collection across a new run instead of resetting it',()=>{const finished=finishRun();const started=worldReducer(finished,{type:'NEW_RUN'});expect(started.traitCollection).toEqual(finished.traitCollection)});
 it('starts a fresh save with no active trait and an empty collection',()=>{expect(initialWorldState.activeTrait).toBeUndefined();expect(initialWorldState.traitCollection).toEqual([])});
});
