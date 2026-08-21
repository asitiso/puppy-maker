import { describe, expect, it } from 'vitest';
import {
  advanceWeeklyDirectives,
  weeklyDirectiveKey,
  weeklyDirectives,
} from './weekly-directives';

describe('weekly directives', () => {
  it('creates a stable week key and exactly three directives', () => {
    expect(weeklyDirectiveKey(1,4,2)).toBe('1-4-2');
    const first = weeklyDirectives(1,4,2);
    const second = weeklyDirectives(1,4,2);
    expect(first).toHaveLength(3);
    expect(second).toEqual(first);
    expect(new Set(first.map(item => item.id)).size).toBe(3);
  });

  it('rotates directive combinations across weeks', () => {
    expect(weeklyDirectives(1,4,1).map(item => item.id)).not.toEqual(weeklyDirectives(1,4,2).map(item => item.id));
  });

  it('uses the same canonical week for keys and directive selection', () => {
    expect(weeklyDirectiveKey(1,4,5)).toBe(weeklyDirectiveKey(1,4,4));
    expect(weeklyDirectives(1,4,5)).toEqual(weeklyDirectives(1,4,4));
  });

  it('uses the same canonical year and month for keys and directive selection', () => {
    expect(weeklyDirectiveKey(0,13,4)).toBe(weeklyDirectiveKey(1,12,4));
    expect(weeklyDirectives(0,13,4)).toEqual(weeklyDirectives(1,12,4));
  });

  it('never assigns two directives that reward the same action counter in one week', () => {
    for (let year = 1; year <= 3; year += 1) {
      for (let month = 1; month <= 12; month += 1) {
        for (let week = 1; week <= 4; week += 1) {
          const directives = weeklyDirectives(year,month,week);
          expect(new Set(directives.map(item => item.counter)).size).toBe(directives.length);
        }
      }
    }
  });

  it('never lets one player action advance more than one assigned directive', () => {
    const events = [
      { kind:'training' as const, grade:'B' as const },
      { kind:'outing' as const, grade:'B' as const },
      { kind:'gift' as const, grade:'B' as const },
      { kind:'expedition' as const, grade:'S' as const },
    ];
    for (let year = 1; year <= 3; year += 1) {
      for (let month = 1; month <= 12; month += 1) {
        for (let week = 1; week <= 4; week += 1) {
          const directives = weeklyDirectives(year,month,week);
          const progress = Object.fromEntries(directives.map(item => [item.id, 0]));
          for (const event of events) {
            const result = advanceWeeklyDirectives(directives,progress,event);
            const advanced = directives.filter(item => (result.progress[item.id] ?? 0) > 0);
            expect(advanced.length).toBeLessThanOrEqual(1);
          }
        }
      }
    }
  });

  it('advances only matching directives and caps progress at targets', () => {
    const directives = weeklyDirectives(1,4,1);
    const expedition = directives.find(item => item.counter === 'expedition');
    const progress = Object.fromEntries(directives.map(item => [item.id, 0]));
    if (!expedition) return;
    let current = advanceWeeklyDirectives(directives, progress, { kind:'expedition', grade:'S' });
    expect(current.progress[expedition.id]).toBe(1);
    for (let index = 0; index < expedition.target + 3; index += 1) {
      current = advanceWeeklyDirectives(directives, current.progress, { kind:'expedition', grade:'S' });
    }
    expect(current.progress[expedition.id]).toBe(expedition.target);
  });

  it('reports newly completed directives once per weekly reward key', () => {
    const directives = weeklyDirectives(1,4,1);
    const target = directives[0];
    const progress = Object.fromEntries(directives.map(item => [item.id, item.id === target.id ? target.target - 1 : 0]));
    const result = advanceWeeklyDirectives(directives, progress, { kind:target.counter === 'high_grade' ? 'expedition' : target.counter, grade:'S' }, [] , '1-4-1');
    expect(result.completed.map(item => item.id)).toContain(target.id);
    const rewarded = [`1-4-1:${target.id}`];
    const repeat = advanceWeeklyDirectives(directives, progress, { kind:target.counter === 'high_grade' ? 'expedition' : target.counter, grade:'S' }, rewarded, '1-4-1');
    expect(repeat.completed.map(item => item.id)).not.toContain(target.id);
  });

  it('recovers a completed directive when its weekly reward key is missing', () => {
    const directives = weeklyDirectives(1,4,1);
    const target = directives[0];
    const progress = Object.fromEntries(directives.map(item => [item.id, item.id === target.id ? target.target : 0]));
    const result = advanceWeeklyDirectives(
      directives,
      progress,
      { kind:'training', grade:'B' },
      [],
      '1-4-1',
    );

    expect(result.completed.map(item => item.id)).toContain(target.id);
    expect(result.reward).toEqual(target.reward);
  });

  it('does not recover a completed directive after its weekly reward key exists', () => {
    const directives = weeklyDirectives(1,4,1);
    const target = directives[0];
    const progress = Object.fromEntries(directives.map(item => [item.id, item.id === target.id ? target.target : 0]));
    const result = advanceWeeklyDirectives(
      directives,
      progress,
      { kind:'training', grade:'B' },
      [`1-4-1:${target.id}`],
      '1-4-1',
    );

    expect(result.completed.map(item => item.id)).not.toContain(target.id);
    expect(result.reward).toEqual({ journeyPoints:0, tokens:0 });
  });
});
