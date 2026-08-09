import { describe, expect, it } from 'vitest';
import {
  astralRiftWeeklyKey,
  astralRiftWeeklyDirectives,
  advanceAstralRiftWeekly,
} from './astral-rift-weekly';

describe('Astral Rift weekly directives', () => {
  it('creates a deterministic weekly key and exactly three directives', () => {
    expect(astralRiftWeeklyKey(2,5,3)).toBe('2-5-3');
    const first = astralRiftWeeklyDirectives(2,5,3);
    const again = astralRiftWeeklyDirectives(2,5,3);
    expect(first).toEqual(again);
    expect(first).toHaveLength(3);
    expect(first.map(item => item.id)).toEqual(['rift_clear','high_grade','featured_rift']);
  });

  it('rotates the featured rift deterministically across weeks', () => {
    const a = astralRiftWeeklyDirectives(1,1,1).find(item => item.id === 'featured_rift')!;
    const b = astralRiftWeeklyDirectives(1,1,2).find(item => item.id === 'featured_rift')!;
    expect(a.featuredRift).not.toBe(b.featuredRift);
  });

  it('caps progress and pays newly completed directives once', () => {
    const weekKey = astralRiftWeeklyKey(1,1,1);
    const directives = astralRiftWeeklyDirectives(1,1,1);
    const featured = directives.find(item => item.id === 'featured_rift')!.featuredRift!;
    let progress = {};
    let rewarded:string[] = [];

    const first = advanceAstralRiftWeekly({ directives, progress, rewardedKeys:rewarded, weekKey, event:{ riftId:featured, grade:'A', success:true } });
    progress = first.progress;
    rewarded = first.rewardedKeys;
    expect(first.completed.map(item => item.id).sort()).toEqual(['featured_rift','high_grade']);
    expect(first.echoes).toBe(8);

    const second = advanceAstralRiftWeekly({ directives, progress, rewardedKeys:rewarded, weekKey, event:{ riftId:featured, grade:'S', success:true } });
    expect(second.completed.map(item => item.id)).toEqual(['rift_clear']);
    expect(second.echoes).toBe(4);
    expect(second.progress.rift_clear).toBe(2);

    const third = advanceAstralRiftWeekly({ directives, progress:second.progress, rewardedKeys:second.rewardedKeys, weekKey, event:{ riftId:featured, grade:'S', success:true } });
    expect(third.completed).toEqual([]);
    expect(third.echoes).toBe(0);
    expect(third.progress.rift_clear).toBe(2);
  });
});
