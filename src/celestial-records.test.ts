import { describe, expect, it } from 'vitest';
import { celestialRecordProgress, celestialHonors, newlyEarnedCelestialHonors } from './celestial-records';

const record = (key:string, grade:'B'|'A'|'S'='A', power=90) => ({ key, grade, power });

describe('celestial records', () => {
  it('summarizes unique trials, S clears and lifetime clears', () => {
    const progress = celestialRecordProgress([
      record('1-1:scholar_trial','S'),
      record('1-2:wayfarer_trial','A'),
      record('1-3:guardian_trial','S'),
      record('1-4:crown_trial','B'),
      record('2-1:scholar_trial','S'),
    ]);
    expect(progress).toEqual({ totalClears:5, uniqueTrials:4, uniqueSClears:2 });
  });

  it('defines long-term astral honor milestones', () => {
    expect(celestialHonors.map(item => item.id)).toEqual(['first_light','full_cycle','perfect_cycle','twelve_trials']);
  });

  it('returns only newly earned honors', () => {
    const records = [
      record('1-1:scholar_trial','S'), record('1-2:wayfarer_trial','S'),
      record('1-3:guardian_trial','S'), record('1-4:crown_trial','S'),
    ];
    expect(newlyEarnedCelestialHonors(records,['first_light']).map(item => item.id)).toEqual(['full_cycle','perfect_cycle']);
  });
});
