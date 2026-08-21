import { describe, expect, it } from 'vitest';
import { careerTitles, recordCareerAction } from './career-records';

describe('career record corruption boundaries', () => {
  it('repairs malformed lifetime counters before recording an action', () => {
    const next = recordCareerAction({
      trainings:Number.NaN,
      bestScore:Number.POSITIVE_INFINITY,
      sGrades:-5,
      outings:Number.NaN,
      gifts:-2,
      monthsCompleted:Number.POSITIVE_INFINITY,
    }, { type:'training', score:920, grade:'S' });

    expect(next).toEqual({
      trainings:1,
      bestScore:920,
      sGrades:1,
      outings:0,
      gifts:0,
      monthsCompleted:0,
    });
  });

  it('does not unlock career titles from non-finite story or record progress', () => {
    const titles = careerTitles({
      records:{
        trainings:Number.POSITIVE_INFINITY,
        bestScore:Number.NaN,
        sGrades:0,
        outings:Number.POSITIVE_INFINITY,
        gifts:Number.POSITIVE_INFINITY,
        monthsCompleted:0,
      },
      guardianRank:'trainee',
      openedStories:Number.POSITIVE_INFINITY,
      openedRaisingStories:Number.NaN,
    });
    expect(titles).toEqual([]);
  });
});
