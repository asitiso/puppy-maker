import { describe, expect, it } from 'vitest';
import { careerTitleDefinitions, careerTitles, emptyCareerRecords, recordCareerAction, type CareerAction } from './career-records';

describe('career records and titles', () => {
  it('starts with zero lifetime records', () => {
    expect(emptyCareerRecords()).toEqual({ trainings: 0, bestScore: 0, sGrades: 0, outings: 0, gifts: 0, monthsCompleted: 0 });
  });

  it('tracks best score and lifetime action totals deterministically', () => {
    let records = emptyCareerRecords();
    records = recordCareerAction(records, { type: 'training', score: 720, grade: 'A' });
    records = recordCareerAction(records, { type: 'training', score: 930, grade: 'S' });
    records = recordCareerAction(records, { type: 'training', score: 850, grade: 'A' });
    records = recordCareerAction(records, { type: 'outing' });
    records = recordCareerAction(records, { type: 'gift' });
    records = recordCareerAction(records, { type: 'month' });
    expect(records).toEqual({ trainings: 3, bestScore: 930, sGrades: 1, outings: 1, gifts: 1, monthsCompleted: 1 });
  });

  it('produces the same career record for the same actions regardless of action order', () => {
    const actions: CareerAction[] = [
      { type:'training', score:720, grade:'A' },
      { type:'training', score:930, grade:'S' },
      { type:'outing' },
      { type:'gift' },
      { type:'month' },
    ];
    const forward = actions.reduce(recordCareerAction, emptyCareerRecords());
    const reverse = [...actions].reverse().reduce(recordCareerAction, emptyCareerRecords());
    expect(reverse).toEqual(forward);
  });

  it('ignores non-finite training scores instead of poisoning lifetime best score', () => {
    const base = recordCareerAction(emptyCareerRecords(), { type:'training', score:850, grade:'A' });
    const nan = recordCareerAction(base, { type:'training', score:Number.NaN, grade:'C' });
    const infinite = recordCareerAction(nan, { type:'training', score:Number.POSITIVE_INFINITY, grade:'C' });
    expect(nan.bestScore).toBe(850);
    expect(infinite.bestScore).toBe(850);
  });

  it('derives long-term titles from records and existing growth progress', () => {
    const records = { trainings: 12, bestScore: 930, sGrades: 3, outings: 10, gifts: 5, monthsCompleted: 6 };
    expect(careerTitles({ records, guardianRank: 'veteran', openedStories: 4 })).toEqual([
      'steady_trainer', 'perfect_chaser', 'seasoned_explorer', 'warm_giver', 'story_witness', 'veteran_guardian',
    ]);
  });

  it('keeps career title thresholds exact at their boundaries', () => {
    const base = emptyCareerRecords();
    expect(careerTitles({ records:{ ...base, trainings:9, bestScore:899, outings:9, gifts:4 }, guardianRank:'junior', openedStories:3, openedRaisingStories:3 })).toEqual([]);
    expect(careerTitles({ records:{ ...base, trainings:10, bestScore:900, outings:10, gifts:5 }, guardianRank:'veteran', openedStories:4, openedRaisingStories:4 })).toEqual([
      'steady_trainer', 'perfect_chaser', 'seasoned_explorer', 'warm_giver', 'story_witness', 'veteran_guardian',
    ]);
  });

  it('uses raising-story progress for story witness when supplied instead of expedition-heavy total story count', () => {
    const records = emptyCareerRecords();
    expect(careerTitles({
      records,
      guardianRank: 'trainee',
      openedStories: 9,
      openedRaisingStories: 3,
    })).not.toContain('story_witness');

    expect(careerTitles({
      records,
      guardianRank: 'trainee',
      openedStories: 9,
      openedRaisingStories: 4,
    })).toContain('story_witness');
  });

  it('keeps different raising records meaningfully distinct in career results', () => {
    const base = emptyCareerRecords();
    expect(careerTitles({ records:{ ...base, trainings:10 }, guardianRank:'trainee', openedStories:0, openedRaisingStories:0 })).toEqual(['steady_trainer']);
    expect(careerTitles({ records:{ ...base, outings:10 }, guardianRank:'trainee', openedStories:0, openedRaisingStories:0 })).toEqual(['seasoned_explorer']);
    expect(careerTitles({ records:{ ...base, gifts:5 }, guardianRank:'trainee', openedStories:0, openedRaisingStories:0 })).toEqual(['warm_giver']);
  });

  it('labels story witness as a raising-story achievement', () => {
    expect(careerTitleDefinitions.find(title => title.id === 'story_witness')?.description).toContain('육성 스토리');
  });
});
