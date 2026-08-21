import {describe,expect,it} from 'vitest';
import {emptyWorldHistoryState,hydrateWorldHistoryState} from './world-history';

describe('V3 world history hydration',()=>{
  it('starts empty',()=>{
    expect(emptyWorldHistoryState()).toEqual({currentFacts:[],inheritedFacts:[]});
  });

  it('keeps current and inherited facts canonical and separate',()=>{
    expect(hydrateWorldHistoryState({
      currentFacts:['rift_unstable','rift_unstable','stale'],
      inheritedFacts:['regional_alliance','festival_saved','stale'],
    })).toEqual({
      currentFacts:['rift_unstable'],
      inheritedFacts:['festival_saved','regional_alliance'],
    });
  });

  it('is idempotent',()=>{
    const once=hydrateWorldHistoryState({currentFacts:['festival_saved'],inheritedFacts:['regional_alliance']});
    expect(hydrateWorldHistoryState(once)).toEqual(once);
  });
});
