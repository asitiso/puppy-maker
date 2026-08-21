import {describe,expect,it} from 'vitest';
import {emptyCharacterBondsState,hydrateCharacterBondsState} from './character-bonds';

describe('V3 character bond hydration',()=>{
  it('starts with all eight characters and empty relationship state',()=>{
    const state=emptyCharacterBondsState();
    expect(Object.keys(state)).toEqual(['mira','kael','rex','selene','noa','eiden','lyra','veyr']);
    expect(state.mira).toEqual({trust:0,conflicts:[],promises:[],memories:[]});
    expect(state.veyr).toEqual({trust:0,conflicts:[],promises:[],memories:[]});
  });

  it('sanitizes character-specific bond records',()=>{
    const state=hydrateCharacterBondsState({
      mira:{trust:42.9,conflicts:['mira_self_sacrifice','mira_self_sacrifice','rex_obsession_with_victory'],promises:['mira_share_the_burden'],memories:['mira_festival_rescue','stale','first_trust']},
      rex:{trust:Infinity,conflicts:['rex_obsession_with_victory'],promises:['rex_fair_rivalry'],memories:['rex_first_defeat','first_trust']},
      stale_character:{trust:99},
    });
    expect(Object.keys(state)).toEqual(['mira','kael','rex','selene','noa','eiden','lyra','veyr']);
    expect(state.mira).toEqual({trust:42,conflicts:['mira_self_sacrifice'],promises:['mira_share_the_burden'],memories:['mira_festival_rescue']});
    expect(state.rex.trust).toBe(0);
    expect(state.rex.memories).toEqual(['rex_first_defeat']);
    expect(state.kael).toEqual({trust:0,conflicts:[],promises:[],memories:[]});
  });
});
