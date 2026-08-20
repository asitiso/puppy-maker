import { describe, expect, it } from 'vitest';
import { careerTitles, emptyCareerRecords, recordCareerAction } from './career-records';

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

  it('derives long-term titles from records and existing growth progress', () => {
    const records = { trainings: 12, bestScore: 930, sGrades: 3, outings: 10, gifts: 5, monthsCompleted: 6 };
    expect(careerTitles({ records, guardianRank: 'veteran', openedStories: 4 })).toEqual([
      'steady_trainer', 'perfect_chaser', 'seasoned_explorer', 'warm_giver', 'story_witness', 'veteran_guardian',
    ]);
  });

  it('uses raising-story progress for story witness when supplied instead of expedition-heavy total story count', () => {
    const records = emptyCareerRecords();
    expect(careerTitles({
      records,
      guardianRank: 'trainee',
      openedStories: 9,
      openedRaisingStories: 2,
    })).not.toContain('story_witness');

    expect(careerTitles({
      records,
      guardianRank: 'trainee',
      openedStories: 9,
      openedRaisingStories: 4,
    })).toContain('story_witness');
  });
});
