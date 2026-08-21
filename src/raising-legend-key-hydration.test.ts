import { describe, expect, it } from 'vitest';
import { hydrateRaisingDepthState } from './raising-depth-state';

describe('Raising legend reward key hydration', () => {
  it('keeps only canonical monthly legend reward claims', () => {
    const hydrated = hydrateRaisingDepthState({
      legendRewardKeys:[
        '1-4:vanguard_legend',
        '2-12:arcanist_legend',
        '3-7:pathfinder_legend',
        '0-4:vanguard_legend',
        '1-13:vanguard_legend',
        '1-4:unknown_effect',
        '1-4:vanguard_legend',
      ],
    });
    expect(hydrated.legendRewardKeys).toEqual([
      '1-4:vanguard_legend',
      '2-12:arcanist_legend',
      '3-7:pathfinder_legend',
    ]);
  });

  it('canonicalizes zero-padded dates before deduping claims', () => {
    const hydrated = hydrateRaisingDepthState({
      legendRewardKeys:[
        '2-06:vanguard_legend',
        '2-6:vanguard_legend',
        '0002-006:vanguard_legend',
      ],
    });
    expect(hydrated.legendRewardKeys).toEqual(['2-6:vanguard_legend']);
  });
});
