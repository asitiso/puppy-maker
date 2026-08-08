import { describe, expect, it } from 'vitest';
import { attendanceKey, attendanceReward } from './attendance';

describe('monthly attendance rewards', () => {
  it('uses a stable year-month claim key', () => {
    expect(attendanceKey(1, 4)).toBe('1-4');
    expect(attendanceKey(2, 12)).toBe('2-12');
  });

  it('grants a simple monthly gold reward with a quarterly gem bonus', () => {
    expect(attendanceReward(1, 4)).toEqual({ gold: 150, gems: 0 });
    expect(attendanceReward(1, 6)).toEqual({ gold: 150, gems: 1 });
    expect(attendanceReward(2, 12)).toEqual({ gold: 150, gems: 1 });
  });
});
