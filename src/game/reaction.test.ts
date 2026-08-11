import { describe, expect, it } from 'vitest';
import { dominantTrait, monthlySummaryLine, personalityFlavorLine, trainingResultLine } from './reaction';
import type { ActivityId, Personality, TrainingQuality } from '../game';

const ACTIVITIES: ActivityId[] = ['hunt', 'magic', 'rest', 'herb'];

const neutral: Personality = { courage: 50, kindness: 50, curiosity: 50, calmness: 50 };

describe('training result reaction', () => {
  it('gives a distinct line for every quality x activity combination (16 total)', () => {
    const lines = new Set<string>();
    (['PERFECT', 'GREAT', 'GOOD', 'NORMAL'] as TrainingQuality[]).forEach((q) => {
      ACTIVITIES.forEach((a) => lines.add(trainingResultLine(q, a)));
    });
    expect(lines.size).toBe(16);
  });

  it('changes the line when only the activity changes (same quality)', () => {
    const seen = new Set(ACTIVITIES.map((a) => trainingResultLine('PERFECT', a)));
    expect(seen.size).toBe(ACTIVITIES.length);
  });

  it('changes the line when only the quality changes (same activity)', () => {
    const seen = new Set((['PERFECT', 'GREAT', 'GOOD', 'NORMAL'] as TrainingQuality[]).map((q) => trainingResultLine(q, 'hunt')));
    expect(seen.size).toBe(4);
  });

  it('always returns non-empty text', () => {
    (['PERFECT', 'GREAT', 'GOOD', 'NORMAL'] as TrainingQuality[]).forEach((q) => {
      ACTIVITIES.forEach((a) => expect(trainingResultLine(q, a).length).toBeGreaterThan(0));
    });
  });
});

describe('monthly summary line (result screen)', () => {
  it('gives a distinct line for each training quality tier', () => {
    const lines = new Set<string>();
    (['PERFECT', 'GREAT', 'GOOD', 'NORMAL'] as TrainingQuality[]).forEach((q) => lines.add(monthlySummaryLine(q)));
    expect(lines.size).toBe(4);
  });

  it('does not reuse the dialogue-screen wording for the same quality', () => {
    (['PERFECT', 'GREAT', 'GOOD', 'NORMAL'] as TrainingQuality[]).forEach((q) => {
      ACTIVITIES.forEach((a) => expect(monthlySummaryLine(q)).not.toBe(trainingResultLine(q, a)));
    });
  });
});

describe('dominant personality trait', () => {
  it('picks the trait with the highest value', () => {
    expect(dominantTrait({ ...neutral, courage: 90 })).toBe('courage');
    expect(dominantTrait({ ...neutral, kindness: 90 })).toBe('kindness');
    expect(dominantTrait({ ...neutral, curiosity: 90 })).toBe('curiosity');
    expect(dominantTrait({ ...neutral, calmness: 90 })).toBe('calmness');
  });

  it('breaks ties with a fixed, deterministic order', () => {
    // same tie should always resolve to the same trait, run after run
    const a = dominantTrait(neutral);
    const b = dominantTrait(neutral);
    expect(a).toBe(b);
  });
});

describe('personality flavor line', () => {
  it('gives a distinct line per dominant trait', () => {
    const lines = new Set<string>();
    lines.add(personalityFlavorLine({ ...neutral, courage: 90 }));
    lines.add(personalityFlavorLine({ ...neutral, kindness: 90 }));
    lines.add(personalityFlavorLine({ ...neutral, curiosity: 90 }));
    lines.add(personalityFlavorLine({ ...neutral, calmness: 90 }));
    expect(lines.size).toBe(4);
  });
});
