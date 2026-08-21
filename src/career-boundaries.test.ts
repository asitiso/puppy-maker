import { describe, expect, it } from 'vitest';
import { careerTitles, recordCareerAction } from './career-records';

describe('career record boundaries', () => {
  it('does not unlock titles from malformed record or story counts', () => {
    expect(careerTitles({
      records:{ trainings:Number.POSITIVE_INFINITY, bestScore:Number.NaN, sGrades:0, outings:Number.POSITIVE_INFINITY, gifts:Number.POSITIVE_INFINITY, monthsCompleted:0 },
      guardianRank:'trainee',
      openedStories:Number.POSITIVE_INFINITY,
      openedRaisingStories:Number.NaN,
    })).toEqual([]);
  });

  it('keeps title thresholds exact after normalizing fractional counts', () => {
    expect(careerTitles({
      records:{ trainings:9.9, bestScore:899.9, sGrades:0, outings:9.9, gifts:4.9, monthsCompleted:0 },
      guardianRank:'guardian',
      openedStories:99,
      openedRaisingStories:3.9,
    })).toEqual([]);
    expect(careerTitles({
      records:{ trainings:10, bestScore:900, sGrades:0, outings:10, gifts:5, monthsCompleted:0 },
      guardianRank:'veteran',
      openedStories:99,
      openedRaisingStories:4,
    })).toEqual(['steady_trainer','perfect_chaser','seasoned_explorer','warm_giver','story_witness','veteran_guardian']);
  });

  it('repairs malformed counters when recording the next career action', () => {
    const malformed = {
      trainings:Number.NaN,
      bestScore:Number.POSITIVE_INFINITY,
      sGrades:Number.NaN,
      outings:Number.POSITIVE_INFINITY,
      gifts:-4,
      monthsCompleted:2.9,
    };
    expect(recordCareerAction(malformed, { type:'training', score:650, grade:'S' })).toEqual({
      trainings:1,
      bestScore:650,
      sGrades:1,
      outings:0,
      gifts:0,
      monthsCompleted:2,
    });
  });
});
