import { describe, expect, it } from 'vitest';
import { canonicalCoreStoryClaims } from './story-chapters';

describe('core story claim order integrity', () => {
  it('drops later chapter claims when an earlier prerequisite chapter is missing', () => {
    expect(canonicalCoreStoryClaims(['wide_world','guardian_oath'])).toEqual([]);
    expect(canonicalCoreStoryClaims(['first_step','wide_world','guardian_oath'])).toEqual(['first_step','wide_world']);
  });

  it('deduplicates and returns only the contiguous narrative prefix', () => {
    expect(canonicalCoreStoryClaims(['trusted_bond','first_step','wide_world','first_step','guardian_oath'])).toEqual([
      'first_step','wide_world','trusted_bond','guardian_oath',
    ]);
  });
});
