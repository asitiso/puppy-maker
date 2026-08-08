import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game';

describe('sanctuary specialization progression', () => {
  it('hydrates legacy and malformed specialization state safely', () => {
    const legacy = hydrateGameState({ ...initialState, sanctuarySpecializations:undefined });
    expect(legacy.sanctuarySpecializations).toEqual({});

    const malformed = hydrateGameState({
      ...initialState,
      sanctuarySpecializations:{
        training_hall:'warrior_doctrine',
        archive_library:'bad',
        herb_garden:'moonwell_garden',
        bad_facility:'season_lens',
      },
    });
    expect(malformed.sanctuarySpecializations).toEqual({
      training_hall:'warrior_doctrine',
      herb_garden:'moonwell_garden',
    });
  });

  it('permanently selects one specialization for a level-3 facility', () => {
    const ready = {
      ...initialState,
      sanctuaryLevels:{ ...initialState.sanctuaryLevels, training_hall:3 as const },
    };
    const chosen = reducer(ready,{ type:'SET_SANCTUARY_SPECIALIZATION', specialization:'warrior_doctrine' });
    expect(chosen.sanctuarySpecializations).toEqual({ training_hall:'warrior_doctrine' });

    const conflict = reducer(chosen,{ type:'SET_SANCTUARY_SPECIALIZATION', specialization:'adaptive_drills' });
    expect(conflict).toBe(chosen);
    const duplicate = reducer(chosen,{ type:'SET_SANCTUARY_SPECIALIZATION', specialization:'warrior_doctrine' });
    expect(duplicate).toBe(chosen);
  });

  it('rejects specialization before facility level 3 and preserves choices across unrelated actions', () => {
    const locked = reducer(initialState,{ type:'SET_SANCTUARY_SPECIALIZATION', specialization:'warrior_doctrine' });
    expect(locked).toBe(initialState);

    const chosen = {
      ...initialState,
      sanctuarySpecializations:{ training_hall:'warrior_doctrine' as const },
    };
    const next = reducer(chosen,{ type:'CLAIM_ATTENDANCE' });
    expect(next.sanctuarySpecializations).toEqual(chosen.sanctuarySpecializations);
  });
});
