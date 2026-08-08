import { describe, expect, it } from 'vitest';
import { ambitionStreak, ambitionStreakHonor } from './yearly-ambition-streak';
import type { AnnualRecord } from './annual-records';

function record(year: number, trainings: number): AnnualRecord {
  return {
    id:`year-${year}`,
    year,
    trainings,
    outings:0,
    gifts:0,
    sGrades:0,
    bestScore:700,
    memories:0,
    skills:0,
    discoveries:0,
    seasonStamps:0,
    guardianRank:'junior',
  };
}

describe('yearly ambition streak', () => {
  it('counts consecutive completed ambitions ending at the latest recorded year', () => {
    const records = [record(1,30), record(2,60), record(3,90)];
    expect(ambitionStreak(records, { 1:'training', 2:'training', 3:'training' })).toBe(3);
  });

  it('resets when the latest year ambition is incomplete', () => {
    const records = [record(1,30), record(2,60), record(3,100)];
    expect(ambitionStreak(records, { 1:'training', 2:'training', 3:'training' })).toBe(0);
  });

  it('maps streak milestones to long-term honor tiers', () => {
    expect(ambitionStreakHonor(1)).toBeNull();
    expect(ambitionStreakHonor(2)?.id).toBe('promise_keeper');
    expect(ambitionStreakHonor(3)?.id).toBe('star_path');
    expect(ambitionStreakHonor(5)?.id).toBe('eternal_vow');
  });
});
