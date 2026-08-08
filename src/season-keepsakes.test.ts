import { describe, expect, it } from 'vitest';
import {
  newlyEarnedKeepsakeMilestones,
  seasonKeepsakeCollection,
  seasonKeepsakeMilestones,
} from './season-keepsakes';

describe('season keepsake collection', () => {
  const purchases = [
    '1-spring:seasonal_keepsake:1',
    '1-spring:gold_pouch:1',
    '1-summer:seasonal_keepsake:1',
    '1-autumn:seasonal_keepsake:1',
    '1-winter:seasonal_keepsake:1',
    '2-spring:seasonal_keepsake:1',
  ];

  it('derives unique keepsakes from the season shop ledger', () => {
    expect(seasonKeepsakeCollection(purchases)).toEqual({
      total:5,
      keys:['1-spring','1-summer','1-autumn','1-winter','2-spring'],
      seasons:{ spring:2, summer:1, autumn:1, winter:1 },
    });
  });

  it('defines long-term collection milestones', () => {
    expect(seasonKeepsakeMilestones.map(item => [item.id,item.threshold])).toEqual([
      ['first_keepsake',1],
      ['four_seasons',4],
      ['eight_seasons',8],
    ]);
  });

  it('returns only newly crossed milestone rewards', () => {
    expect(newlyEarnedKeepsakeMilestones(purchases,[]).map(item => item.id)).toEqual(['first_keepsake','four_seasons']);
    expect(newlyEarnedKeepsakeMilestones(purchases,['first_keepsake','four_seasons'])).toEqual([]);
  });
});
