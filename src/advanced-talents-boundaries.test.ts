import { describe, expect, it } from 'vitest';
import { advancedTalents } from './advanced-talents';

describe('advanced talent boundaries', () => {
  it('keeps level three and five thresholds exact after normalizing levels', () => {
    expect(advancedTalents({ hunt:2.9, magic:4.9, rest:2, herb:2 })).toEqual(['arcane_rhythm']);
    expect(advancedTalents({ hunt:3, magic:5, rest:2, herb:2 })).toEqual(['hunter_instinct','arcane_rhythm','star_channel']);
  });

  it('treats malformed mastery levels as locked instead of maxed', () => {
    expect(advancedTalents({ hunt:Number.NaN, magic:Number.POSITIVE_INFINITY, rest:Number.NEGATIVE_INFINITY, herb:-3 })).toEqual([]);
  });
});
