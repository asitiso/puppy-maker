import { describe, expect, it } from 'vitest';
import {
  newlyEarnedSeasonHonors,
  seasonCompletionHonors,
  seasonHonorProgress,
} from './season-completion-honors';
import type { SeasonJourneyHistoryEntry } from './live-ops-state';

const entry = (key:SeasonJourneyHistoryEntry['key'], tiersCompleted:number):SeasonJourneyHistoryEntry => ({
  key,
  score:tiersCompleted >= 10 ? 1300 : tiersCompleted * 100,
  tiersCompleted,
  tokensEarned:tiersCompleted * 10,
});

describe('season completion honors', () => {
  it('tracks complete archived seasons and all four season types', () => {
    const history = [
      entry('1-spring',10),
      entry('1-summer',10),
      entry('1-autumn',9),
      entry('2-winter',10),
    ];
    expect(seasonHonorProgress(history)).toEqual({
      completedSeasons:3,
      completedSeasonTypes:3,
      perfectYears:0,
    });
  });

  it('recognizes a perfect four-season year', () => {
    const history = [
      entry('2-spring',10), entry('2-summer',10), entry('2-autumn',10), entry('2-winter',10),
    ];
    expect(seasonHonorProgress(history).perfectYears).toBe(1);
  });

  it('defines durable long-term honor thresholds and rewards', () => {
    expect(seasonCompletionHonors.map(item => [item.id,item.threshold,item.reward])).toEqual([
      ['first_complete',1,{ gold:300, gems:0 }],
      ['four_seasons',4,{ gold:0, gems:2 }],
      ['perfect_year',1,{ gold:600, gems:2 }],
      ['eight_complete',8,{ gold:1000, gems:4 }],
    ]);
  });

  it('returns only newly earned honors', () => {
    const history = [
      entry('1-spring',10), entry('1-summer',10), entry('1-autumn',10), entry('1-winter',10),
      entry('2-spring',10), entry('2-summer',10), entry('2-autumn',10), entry('2-winter',10),
    ];
    expect(newlyEarnedSeasonHonors(history,['first_complete']).map(item => item.id)).toEqual([
      'four_seasons','perfect_year','eight_complete',
    ]);
  });
});
