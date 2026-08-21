import { describe, expect, it } from 'vitest';
import { applyPathfinderOutingLegend } from './calling-depth-effects';

describe('Pathfinder outing legend sanitation', () => {
  it('requires an exact true discovery flag before awarding legend gold', () => {
    for (const discovered of ['false', 1, {}, []] as any[]) {
      const result = applyPathfinderOutingLegend(
        2026,
        8,
        'pathfinder',
        ['pathfinder_legend'],
        discovered,
        [],
      );
      expect(result.goldBonus).toBe(0);
      expect(result.applied).toBe(false);
      expect(result.legendRewardKeys).not.toContain('2026-8:pathfinder_legend');
    }

    const valid = applyPathfinderOutingLegend(
      2026,
      8,
      'pathfinder',
      ['pathfinder_legend'],
      true,
      [],
    );
    expect(valid.goldBonus).toBe(100);
    expect(valid.applied).toBe(true);
  });
});