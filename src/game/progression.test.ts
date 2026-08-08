import { describe, expect, it } from 'vitest';
import { advanceCalendar, seasonForMonth, milestoneForMonth } from './progression';

describe('long-run progression', () => {
  it('rolls December into the next year', () => expect(advanceCalendar(1,12)).toEqual({year:2,month:1}));
  it('maps months to four seasons', () => { expect(seasonForMonth(3)).toBe('spring'); expect(seasonForMonth(7)).toBe('summer'); expect(seasonForMonth(10)).toBe('autumn'); expect(seasonForMonth(1)).toBe('winter'); });
  it('only marks meaningful quarter milestones', () => { expect(milestoneForMonth(3)).toBe('first-quarter'); expect(milestoneForMonth(6)).toBe('half-year'); expect(milestoneForMonth(9)).toBe('final-quarter'); expect(milestoneForMonth(12)).toBe('final-month'); expect(milestoneForMonth(5)).toBeNull(); });
});