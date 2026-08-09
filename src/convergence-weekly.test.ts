import { describe, expect, it } from 'vitest';
import {
  advanceConvergenceWeekly,
  convergenceWeeklyDirectives,
  convergenceWeeklyKey,
} from './convergence-weekly';

describe('convergence weekly directives', () => {
  it('creates a deterministic key and three directives', () => {
    expect(convergenceWeeklyKey(2,5,3)).toBe('2-5-3');
    const first = convergenceWeeklyDirectives(2,5,3);
    const again = convergenceWeeklyDirectives(2,5,3);
    expect(first).toEqual(again);
    expect(first).toHaveLength(3);
    expect(first.map(item => item.id)).toEqual(['convergence_clear','high_grade','featured_guardian']);
  });

  it('advances and caps progress from successful clears', () => {
    const directives = convergenceWeeklyDirectives(1,4,1);
    const key = convergenceWeeklyKey(1,4,1);
    const first = advanceConvergenceWeekly({
      directives,
      progress:{},
      rewardedKeys:[],
      weekKey:key,
      event:{ guardianId:directives[2].featuredGuardian!, grade:'A', success:true },
    });
    expect(first.progress).toEqual({ convergence_clear:1, high_grade:1, featured_guardian:1 });
    expect(first.sigils).toBe(4);
    expect(first.rewardedKeys).toEqual(expect.arrayContaining([`${key}:high_grade`,`${key}:featured_guardian`]));

    const second = advanceConvergenceWeekly({
      directives,
      progress:first.progress,
      rewardedKeys:first.rewardedKeys,
      weekKey:key,
      event:{ guardianId:directives[2].featuredGuardian!, grade:'S', success:true },
    });
    expect(second.progress).toEqual({ convergence_clear:2, high_grade:1, featured_guardian:1 });
    expect(second.sigils).toBe(2);
    expect(second.rewardedKeys.filter(item => item === `${key}:high_grade`)).toHaveLength(1);
  });

  it('does not progress failed attempts or unrelated featured guardian', () => {
    const directives = convergenceWeeklyDirectives(1,4,2);
    const key = convergenceWeeklyKey(1,4,2);
    const failed = advanceConvergenceWeekly({
      directives, progress:{}, rewardedKeys:[], weekKey:key,
      event:{ guardianId:'dawn_stag', grade:'C', success:false },
    });
    expect(failed.progress).toEqual({ convergence_clear:0, high_grade:0, featured_guardian:0 });
    expect(failed.sigils).toBe(0);
  });
});
