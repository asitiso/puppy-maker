import {describe,expect,it} from 'vitest';
import {hydrateGameState,initialState,reducer,type GameState} from './game';
import {hydrateSave,serializeGameState} from './game/save';
import {weekKey} from './weekly-calendar';
import type {WeeklyFocusId} from './weekly-life';

const focuses:WeeklyFocusId[]=['world','bond','training','rest','outing','tactical','season'];

function expectFiniteTree(value:unknown,path='state'){
  if(typeof value==='number'){
    expect(Number.isFinite(value),`${path} must stay finite`).toBe(true);
    return;
  }
  if(Array.isArray(value)){
    value.forEach((item,index)=>expectFiniteTree(item,`${path}[${index}]`));
    return;
  }
  if(value&&typeof value==='object'){
    for(const [key,item] of Object.entries(value)) expectFiniteTree(item,`${path}.${key}`);
  }
}

function weeksUntilYearThree(state:GameState){
  const elapsed=(state.year-1)*48+(state.month-1)*4+(state.week-1);
  return 96-elapsed;
}

function playToMatureLife(input:GameState,generation:number){
  let state=input;
  let weeks=0;
  const expectedWeeks=weeksUntilYearThree(input);
  const startingResolved=state.weeklyLife.resolvedEventKeys.length;
  while(state.year<3){
    const focus=focuses[(weeks+generation)%focuses.length];
    const before=state;
    state=reducer(state,{type:'SELECT_WEEKLY_FOCUS',focus});
    expect(state.weeklyLife.focusKey).toBe(weekKey(before.year,before.month,before.week));
    const completed=reducer(state,{type:'COMPLETE_WEEKLY_FOCUS'});
    expect(reducer(completed,{type:'COMPLETE_WEEKLY_FOCUS'})).toBe(completed);
    state=completed;

    if(weeks===0&&before.year===1&&focus==='bond'){
      expect(state.weeklyLife.lastEvent).not.toBe('ancestral_story');
    }
    if(weeks%24===23){
      const reloaded=hydrateSave(serializeGameState(state));
      expect(reloaded.weeklyLife).toEqual(state.weeklyLife);
      expect(reloaded.lineage).toEqual(state.lineage);
      state=reloaded;
    }

    state=reducer(state,{type:'ADVANCE_WEEK'});
    expect(new Set(state.weeklyLife.resolvedEventKeys).size).toBe(state.weeklyLife.resolvedEventKeys.length);
    expect(state.weeklyLife.resolvedEventKeys.length).toBeLessThanOrEqual(96);
    if(weeks%16===15)expectFiniteTree(state);
    weeks+=1;
    expect(weeks).toBeLessThanOrEqual(expectedWeeks);
  }
  expect(weeks).toBe(expectedWeeks);
  expect(state).toMatchObject({year:3,month:1,week:1});
  expect(state.weeklyLife.resolvedEventKeys).toHaveLength(Math.min(96,startingResolved+expectedWeeks));
  return state;
}

function matureForTransition(state:GameState,generation:number):GameState{
  const hollow=generation===2;
  return {
    ...state,
    resolvedEnding:hollow?'v3:hollow:bond:world:career':'v3:caretaker:bond:world:career',
    gold:90000+generation,
    gems:900+generation,
    stats:{...state.stats,strength:90+generation,magic:80+generation,stress:70,fatigue:60},
    personality:{courage:20,kindness:hollow?30:90,curiosity:40,calmness:hollow?95:30},
    worldHistory:{...state.worldHistory,currentFacts:['festival_saved','regional_alliance']},
    campaignRun:{
      ...state.campaignRun,
      activeCampaign:hollow?'arcanist':'caretaker',
      activeRoute:hollow?'hollow':state.campaignRun.activeRoute,
    },
  } as GameState;
}

describe('V5 generations long-run soak',()=>{
  it('runs three mature lives through real weekly settlement, reload and bounded lineage transitions',()=>{
    let state:GameState=initialState;
    const canonicalMatureWeeks=weeksUntilYearThree(initialState);
    expect(canonicalMatureWeeks).toBe(83);

    for(let generation=1;generation<=3;generation+=1){
      expect(state.lineage.generation).toBe(generation);
      expect(state.campaignRun.runNumber).toBe(initialState.campaignRun.runNumber);
      expect(state.gold).toBe(initialState.gold);
      expect(state.stats).toEqual(initialState.stats);

      state=playToMatureLife(state,generation);
      expectFiniteTree(state);

      if(generation===3)break;

      const mature=matureForTransition(state,generation);
      const next=reducer(mature,{type:'START_NEXT_GENERATION'});
      expect(next).not.toBe(mature);
      expect(next.lineage.generation).toBe(generation+1);
      expect(next.lineage.ancestors.map(item=>item.generation)).toEqual(Array.from({length:generation},(_,index)=>index+1));
      expect(new Set(next.lineage.ancestors.map(item=>item.generation)).size).toBe(next.lineage.ancestors.length);
      expect(next.lineage.ancestors).toHaveLength(generation);
      expect(next.lineage.ancestors.length).toBeLessThanOrEqual(8);
      expect(next.lineage.heritageTraits.length).toBeLessThanOrEqual(2);
      expect(next.lineage.ancestors.at(-1)?.yearsLived).toBe(3);
      if(generation===2)expect(next.lineage.ancestors.at(-1)?.route).toBe('hollow');

      expect(next.year).toBe(initialState.year);
      expect(next.month).toBe(initialState.month);
      expect(next.week).toBe(initialState.week);
      expect(next.gold).toBe(initialState.gold);
      expect(next.gems).toBe(initialState.gems);
      expect(next.stats).toEqual(initialState.stats);
      expect(next.mastery).toEqual(initialState.mastery);
      expect(next.inventory).toEqual(initialState.inventory);
      expect(next.weeklyLife).toEqual(initialState.weeklyLife);
      expect(next.campaignRun.runNumber).toBe(initialState.campaignRun.runNumber);
      expect(next.resolvedEnding).toBeUndefined();

      const reloaded=hydrateSave(serializeGameState(next));
      expect(reloaded.lineage).toEqual(next.lineage);
      state=reloaded;

      if(generation===1){
        state=hydrateGameState({
          ...state,
          lineage:{
            ...state.lineage,
            heritageTraits:['bad',...state.lineage.heritageTraits,...state.lineage.heritageTraits],
          },
        });
        expect(state.lineage.generation).toBe(2);
        expect(state.lineage.heritageTraits).toEqual(next.lineage.heritageTraits);
        expect(state.lineage.heritageTraits.length).toBeLessThanOrEqual(2);
      }
    }

    expect(state.lineage.generation).toBe(3);
    expect(state.lineage.ancestors).toHaveLength(2);
    expect(state.lineage.ancestors[0].generation).toBe(1);
    expect(state.lineage.ancestors[1].generation).toBe(2);
    expect(state.lineage.ancestors[1].route).toBe('hollow');
    expect(state.lineage.heritageTraits.length).toBeLessThanOrEqual(2);
    expect(state.year).toBe(3);
    expect(state.weeklyLife.resolvedEventKeys).toHaveLength(canonicalMatureWeeks);
    expectFiniteTree(state);
  });
});
