import { describe, expect, it } from 'vitest';
import { seasonLifetimeAward, seasonLifetimeBonuses, seasonLifetimeMilestone, seasonLifetimeSummary } from './season-lifetime-legacy';

describe('season lifetime legacy', () => {
  it('awards bounded lifetime points from season completion quality', () => {
    expect(seasonLifetimeAward({ tiersCompleted:10, score:1300, tokensEarned:120, keepsake:true })).toBe(5);
    expect(seasonLifetimeAward({ tiersCompleted:7, score:625, tokensEarned:90, keepsake:false })).toBe(2);
    expect(seasonLifetimeAward({ tiersCompleted:2, score:80, tokensEarned:10, keepsake:false })).toBe(0);
  });

  it('derives bounded passive bonuses instead of unbounded power growth', () => {
    expect(seasonLifetimeBonuses(0)).toEqual({ trainingPercent:0, masteryXp:0, rewardPercent:0, startingCondition:0 });
    expect(seasonLifetimeBonuses(25)).toEqual({ trainingPercent:4, masteryXp:1, rewardPercent:5, startingCondition:2 });
    expect(seasonLifetimeBonuses(999)).toEqual({ trainingPercent:6, masteryXp:2, rewardPercent:8, startingCondition:3 });
  });

  it('reports stable lifetime milestones', () => {
    expect(seasonLifetimeMilestone(0)).toEqual(expect.objectContaining({ id:'seed', nextThreshold:5 }));
    expect(seasonLifetimeMilestone(12)).toEqual(expect.objectContaining({ id:'keeper', nextThreshold:25 }));
    expect(seasonLifetimeMilestone(50)).toEqual(expect.objectContaining({ id:'eternal', nextThreshold:null }));
  });

  it('derives lifetime progress from archived seasons and keepsake purchases without another ledger', () => {
    const summary = seasonLifetimeSummary([
      { key:'1-spring', score:1300, tiersCompleted:10, tokensEarned:120 },
      { key:'1-summer', score:625, tiersCompleted:7, tokensEarned:90 },
    ],['1-spring:seasonal_keepsake:1']);
    expect(summary).toEqual(expect.objectContaining({ points:7, completedSeasons:1 }));
    expect(summary.milestone).toEqual(expect.objectContaining({ id:'traveler', nextThreshold:12 }));
    expect(summary.bonuses).toEqual({ trainingPercent:2, masteryXp:0, rewardPercent:2, startingCondition:1 });
  });
});
