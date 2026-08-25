import {describe,expect,it} from 'vitest';
import {hydrateGameState,initialState,reducer,type GameState} from './game';
import {hydrateSave,serializeGameState} from './game/save';
import {emptyLineageState} from './lineage';

describe('V5 lineage persistence',()=>{
  it('gives old saves without lineage a safe first-generation default',()=>{
    const legacySave={...initialState} as Record<string,unknown>;
    delete legacySave.lineage;
    const hydrated=hydrateGameState(legacySave);
    expect(hydrated.lineage).toEqual(emptyLineageState());
  });

  it('persists a valid lineage through the real save envelope and reload path',()=>{
    const state={
      ...initialState,
      lineage:{
        generation:4,
        heritageTraits:['warm_heart','true_echo'],
        ancestors:[{
          generation:3,
          yearsLived:5,
          route:'true_path',
          ending:'true_rewoven',
          guardianRank:'starlight',
          personalityKey:'kindness',
          majorWorldFacts:['festival_saved','regional_alliance'],
          heritageTraits:['warm_heart','true_echo'],
        }],
      },
    } as unknown as GameState;
    const hydrated=hydrateSave(serializeGameState(state));
    expect(hydrated.lineage).toEqual(state.lineage);
  });

  it('sanitizes malformed lineage data rather than rejecting the save',()=>{
    const hydrated=hydrateGameState({
      ...initialState,
      lineage:{
        generation:Number.POSITIVE_INFINITY,
        heritageTraits:['bad','hollow_echo','hollow_echo','warm_heart','world_witness'],
        ancestors:[
          {generation:2,yearsLived:Number.NaN,route:'hack',ending:'',guardianRank:'hack',personalityKey:'hack',majorWorldFacts:['bad','festival_saved'],heritageTraits:['bad','world_witness']},
          {generation:'bad'},
        ],
      },
    });
    expect(hydrated.lineage).toEqual({
      generation:1,
      heritageTraits:['warm_heart','hollow_echo'],
      ancestors:[{
        generation:2,
        yearsLived:1,
        route:null,
        ending:null,
        guardianRank:'trainee',
        personalityKey:'kindness',
        majorWorldFacts:['festival_saved'],
        heritageTraits:['world_witness'],
      }],
    });
  });

  it('does not disturb a valid current V4 weekly selection while hydrating lineage',()=>{
    const selected=reducer(initialState,{type:'SELECT_WEEKLY_FOCUS',focus:'bond'});
    const hydrated=hydrateGameState({
      ...selected,
      lineage:{generation:2,heritageTraits:['trail_memory'],ancestors:[]},
    });
    expect(hydrated.weeklyLife).toEqual(selected.weeklyLife);
    expect(hydrated.lineage).toEqual({generation:2,heritageTraits:['trail_memory'],ancestors:[]});
  });
});
