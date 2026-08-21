import { describe, expect, it } from 'vitest';
import { currentAvailableMail, hydrateGameState, initialState, reducer } from './game';

describe('milestone mail progression', () => {
  it('hydrates legacy saves with no claimed mail rewards', () => {
    const state = hydrateGameState({ screen:'hub', year:1, month:4, week:2, gold:5000, gems:220, schedule:['hunt','magic','rest','herb'], stats:{...initialState.stats}, combo:0, trainingScore:0 });
    expect(state.claimedMailRewards).toEqual([]);
    expect(currentAvailableMail(state)).toEqual(['welcome']);
  });

  it('claims an available letter exactly once', () => {
    const ready = reducer(initialState, { type:'GO', screen:'hub' });
    const claimed = reducer(ready, { type:'CLAIM_MAIL', mail:'welcome' });
    expect(claimed.gold).toBe(ready.gold + 300);
    expect(claimed.claimedMailRewards).toEqual(['welcome']);
    expect(reducer(claimed, { type:'CLAIM_MAIL', mail:'welcome' })).toBe(claimed);
  });

  it('rejects locked mail and unlocks milestone mail from progress', () => {
    expect(reducer(initialState, { type:'CLAIM_MAIL', mail:'guardian_appointment' })).toBe(initialState);
    const trained = reducer(initialState, { type:'FINISH_TRAINING', eventRoll:0.999 });
    expect(currentAvailableMail(trained)).toContain('first_training');
    const claimed = reducer(trained, { type:'CLAIM_MAIL', mail:'first_training' });
    expect(claimed.gold).toBe(trained.gold + 200);
  });

  it('preserves claimed mail across month advancement', () => {
    const state = { ...initialState, claimedMailRewards:['welcome'] as typeof initialState.claimedMailRewards };
    const next = reducer({ ...state, screen:'result' }, { type:'NEXT_MONTH' });
    expect(next.claimedMailRewards).toEqual(['welcome']);
  });
});
