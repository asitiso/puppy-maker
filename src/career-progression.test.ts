import { describe, expect, it } from 'vitest';
import { currentCareerTitles, hydrateGameState, initialState, reducer } from './game';

describe('career record progression', () => {
  it('hydrates legacy saves with zero lifetime records', () => {
    const state = hydrateGameState({ screen:'hub', year:1, month:4, week:2, gold:5000, gems:220, schedule:['hunt','magic','rest','herb'], stats:{...initialState.stats}, combo:0, trainingScore:0 });
    expect(state.careerRecords).toEqual({ trainings:0, bestScore:0, sGrades:0, outings:0, gifts:0, monthsCompleted:0 });
  });

  it('sanitizes malformed lifetime records', () => {
    const state = hydrateGameState({ ...initialState, careerRecords:{trainings:-3,bestScore:902.9,sGrades:'bad',outings:4.8,gifts:2,monthsCompleted:-1} });
    expect(state.careerRecords).toEqual({ trainings:0, bestScore:902, sGrades:0, outings:4, gifts:2, monthsCompleted:0 });
  });

  it('records successful gameplay actions and best training score', () => {
    const scored = { ...initialState, trainingScore:920 };
    const trained = reducer(scored, { type:'FINISH_TRAINING', eventRoll:0.999 });
    expect(trained.careerRecords.trainings).toBe(1);
    expect(trained.careerRecords.bestScore).toBe(920);
    expect(trained.careerRecords.sGrades).toBe(1);

    const outing = reducer(trained, { type:'GO_OUTING', location:'forest', eventRoll:0.999 });
    expect(outing.careerRecords.outings).toBe(1);

    const gifted = reducer(outing, { type:'GIVE_GIFT', item:'star_cookie' });
    expect(gifted.careerRecords.gifts).toBe(1);

    const next = reducer({ ...gifted, screen:'result' }, { type:'NEXT_MONTH' });
    expect(next.careerRecords.monthsCompleted).toBe(1);
  });

  it('does not count a failed gift action', () => {
    const empty = { ...initialState, inventory:{...initialState.inventory, herb_tea:0} };
    const next = reducer(empty, { type:'GIVE_GIFT', item:'herb_tea' });
    expect(next).toBe(empty);
    expect(next.careerRecords.gifts).toBe(0);
  });

  it('derives titles from lifetime records plus guardian and story progress', () => {
    const state = {
      ...initialState,
      careerRecords:{trainings:10,bestScore:910,sGrades:1,outings:10,gifts:5,monthsCompleted:6},
      memories: Array(13).fill('first_training') as typeof initialState.memories,
      discoveries:['moon_feather','star_mushroom','tiny_bell','old_spellbook'] as typeof initialState.discoveries,
      mastery:{hunt:{xp:18},magic:{xp:18},rest:{xp:18},herb:{xp:18}},
      visitedOutings:['forest','village','lakeside'] as typeof initialState.visitedOutings,
      rewardedStoryChapters:['first_step','wide_world','trusted_bond','guardian_oath'] as typeof initialState.rewardedStoryChapters,
    };
    expect(currentCareerTitles(state)).toEqual([
      'steady_trainer','perfect_chaser','seasoned_explorer','warm_giver','story_witness','veteran_guardian',
    ]);
  });
});
