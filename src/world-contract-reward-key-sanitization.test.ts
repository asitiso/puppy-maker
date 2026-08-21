import { describe, expect, it } from 'vitest';
import { advanceWorldContracts, emptyWorldContractProgress } from './world-contracts';
import { worldEvent } from './world-event';

describe('world contract rewarded key sanitation', () => {
  it('deduplicates valid reward keys and drops malformed entries even on a failed expedition', () => {
    const event = worldEvent(2026, 8);
    const result = advanceWorldContracts({
      year: 2026,
      month: 8,
      event,
      progress: emptyWorldContractProgress(),
      rewardedKeys: [
        '2026-8:expedition_clear',
        '2026-8:expedition_clear',
        null,
        42,
        '',
      ] as any,
      region: event.region,
      grade: 'C',
    });

    expect(result.rewardedKeys).toEqual(['2026-8:expedition_clear']);
    expect(result.reward).toEqual({ gold: 0, gems: 0 });
  });

  it('does not append a duplicate completion key when malformed duplicates already exist', () => {
    const event = worldEvent(2026, 8);
    const result = advanceWorldContracts({
      year: 2026,
      month: 8,
      event,
      progress: { expedition_clear: 2, high_grade: 0, featured_region: 0 },
      rewardedKeys: ['2026-8:expedition_clear', '2026-8:expedition_clear'] as any,
      region: event.region,
      grade: 'B',
    });

    expect(result.rewardedKeys.filter(key => key === '2026-8:expedition_clear')).toHaveLength(1);
    expect(result.reward.gold).toBe(0);
    expect(result.newlyCompleted).not.toContain('expedition_clear');
  });
});
