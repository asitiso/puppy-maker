import { describe, expect, it } from 'vitest';
import { advanceWorldContracts, emptyWorldContractProgress } from './world-contracts';
import { worldEvent } from './world-event';

describe('World Contract grade sanitation', () => {
  it('does not advance any contract for malformed grades', () => {
    const event = worldEvent(2026, 8);
    for (const grade of ['Z', '', null, undefined, 42, {}, []] as any[]) {
      const result = advanceWorldContracts({
        year:2026,
        month:8,
        event,
        progress:emptyWorldContractProgress(),
        rewardedKeys:[],
        region:event.region,
        grade,
      } as any);

      expect(result.progress).toEqual(emptyWorldContractProgress());
      expect(result.reward).toEqual({ gold:0, gems:0 });
      expect(result.newlyCompleted).toEqual([]);
    }
  });
});