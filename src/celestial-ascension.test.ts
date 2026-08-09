import { describe, expect, it } from 'vitest';
import { celestialAscensionProgress, celestialAscensionRank, newlyEarnedAscensionRewards } from './celestial-ascension';

describe('celestial ascension', () => {
  it('combines astral clears, S variety, blessings, constellations and sanctuary progress', () => {
    expect(celestialAscensionProgress({
      trialRecords:[
        { key:'1-1:scholar_trial', grade:'S', power:110 },
        { key:'1-2:wayfarer_trial', grade:'A', power:90 },
        { key:'1-3:guardian_trial', grade:'S', power:108 },
      ],
      blessingCount:2,
      constellationCount:4,
      sanctuaryGrandProgress:42,
    })).toBe(40);
  });

  it('clamps noisy inputs and caps repeat-clear contribution', () => {
    const records = Array.from({ length:30 },(_,index) => ({
      key:`${index + 1}-1:scholar_trial`,
      grade:'B' as const,
      power:80,
    }));
    expect(celestialAscensionProgress({ trialRecords:records, blessingCount:99, constellationCount:99, sanctuaryGrandProgress:999 })).toBe(67);
  });

  it('promotes through five ascension ranks', () => {
    expect(celestialAscensionRank(0).id).toBe('earthbound');
    expect(celestialAscensionRank(12).id).toBe('awakened');
    expect(celestialAscensionRank(28).id).toBe('stellar');
    expect(celestialAscensionRank(48).id).toBe('empyrean');
    expect(celestialAscensionRank(72).id).toBe('transcendent');
  });

  it('returns every newly crossed reward while excluding claimed ranks', () => {
    expect(newlyEarnedAscensionRewards(80,['awakened']).map(item => item.rank)).toEqual([
      'stellar','empyrean','transcendent',
    ]);
  });
});
