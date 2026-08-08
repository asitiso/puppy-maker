import { describe, expect, it } from 'vitest';
import { seasonMasteryRank, seasonMasteryScore } from './season-mastery-rank';

describe('season mastery rank', () => {
  it('combines completed seasons, keepsakes and honors into one meta score', () => {
    expect(seasonMasteryScore({ completedSeasons:2, keepsakes:3, honors:1 })).toBe(13);
  });

  it('maps score into durable account ranks', () => {
    expect(seasonMasteryRank(0)).toEqual(expect.objectContaining({ id:'sprout', threshold:0, nextThreshold:5 }));
    expect(seasonMasteryRank(5)).toEqual(expect.objectContaining({ id:'traveler', threshold:5, nextThreshold:12 }));
    expect(seasonMasteryRank(12)).toEqual(expect.objectContaining({ id:'chronicler', threshold:12, nextThreshold:24 }));
    expect(seasonMasteryRank(24)).toEqual(expect.objectContaining({ id:'guardian', threshold:24, nextThreshold:40 }));
    expect(seasonMasteryRank(40)).toEqual(expect.objectContaining({ id:'eternal', threshold:40, nextThreshold:null }));
  });

  it('clamps negative or malformed score to the starting rank', () => {
    expect(seasonMasteryRank(-100).id).toBe('sprout');
    expect(seasonMasteryRank(Number.NaN).score).toBe(0);
  });
});
