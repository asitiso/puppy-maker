import { describe, expect, it } from 'vitest';
import {
  advanceWorldContracts,
  emptyWorldContractProgress,
  monthlyWorldContracts,
  worldContractRewardKey,
} from './world-contracts';
import { worldEvent } from './world-event';

describe('world contracts', () => {
  it('creates three monthly contracts tied to the current featured region', () => {
    const contracts = monthlyWorldContracts(1, 1);
    expect(contracts.map(item => item.id)).toEqual(['expedition_clear','high_grade','featured_region']);
    expect(contracts[0].target).toBe(3);
    expect(contracts[1].target).toBe(2);
    expect(contracts[2].target).toBe(2);
    expect(contracts[2].region).toBe('starlight_forest');
  });

  it('starts monthly contract progress at zero', () => {
    expect(emptyWorldContractProgress()).toEqual({ expedition_clear:0, high_grade:0, featured_region:0 });
  });

  it('advances all matching contract counters from one successful clear', () => {
    const result = advanceWorldContracts({
      year:1,
      month:1,
      event:worldEvent(1, 1),
      progress:emptyWorldContractProgress(),
      rewardedKeys:[],
      region:'starlight_forest',
      grade:'S',
    });
    expect(result.progress).toEqual({ expedition_clear:1, high_grade:1, featured_region:1 });
    expect(result.reward).toEqual({ gold:0, gems:0 });
  });

  it('does not count B as high grade and does not count a non-featured region', () => {
    const event = worldEvent(1, 1);
    const result = advanceWorldContracts({
      year:1,
      month:1,
      event,
      progress:emptyWorldContractProgress(),
      rewardedKeys:[],
      region:'ancient_city',
      grade:'B',
    });

    expect(event.region).toBe('starlight_forest');
    expect(result.progress).toEqual({ expedition_clear:1, high_grade:0, featured_region:0 });
    expect(result.reward).toEqual({ gold:0, gems:0 });
    expect(result.newlyCompleted).toEqual([]);
  });

  it('does not advance failed C-grade attempts', () => {
    const result = advanceWorldContracts({
      year:1,
      month:1,
      event:worldEvent(1, 1),
      progress:{ expedition_clear:1, high_grade:1, featured_region:1 },
      rewardedKeys:[],
      region:'starlight_forest',
      grade:'C',
    });
    expect(result.progress).toEqual({ expedition_clear:1, high_grade:1, featured_region:1 });
    expect(result.reward).toEqual({ gold:0, gems:0 });
  });

  it('repairs malformed stored counters before advancing a successful clear', () => {
    const result = advanceWorldContracts({
      year:1,
      month:1,
      event:worldEvent(1, 1),
      progress:{ expedition_clear:Number.NaN, high_grade:-5, featured_region:Number.POSITIVE_INFINITY },
      rewardedKeys:[],
      region:'starlight_forest',
      grade:'A',
    });

    expect(result.progress).toEqual({ expedition_clear:1, high_grade:1, featured_region:1 });
    expect(result.reward).toEqual({ gold:0, gems:0 });
    expect(result.newlyCompleted).toEqual([]);
  });

  it('treats missing or malformed progress objects as empty progress instead of crashing', () => {
    for (const progress of [null, undefined, 42, 'bad', []] as any[]) {
      expect(() => advanceWorldContracts({
        year:1,
        month:1,
        event:worldEvent(1, 1),
        progress,
        rewardedKeys:[],
        region:'starlight_forest',
        grade:'A',
      } as any)).not.toThrow();

      const result = advanceWorldContracts({
        year:1,
        month:1,
        event:worldEvent(1, 1),
        progress,
        rewardedKeys:[],
        region:'starlight_forest',
        grade:'A',
      } as any);
      expect(result.progress).toEqual({ expedition_clear:1, high_grade:1, featured_region:1 });
    }
  });

  it('auto-pays newly completed contracts once and caps completed counters', () => {
    const result = advanceWorldContracts({
      year:1,
      month:1,
      event:worldEvent(1, 1),
      progress:{ expedition_clear:2, high_grade:1, featured_region:1 },
      rewardedKeys:[],
      region:'starlight_forest',
      grade:'A',
    });
    expect(result.reward).toEqual({ gold:250, gems:1 });
    expect(result.rewardedKeys).toEqual([
      '1-1:expedition_clear',
      '1-1:high_grade',
      '1-1:featured_region',
    ]);

    const repeat = advanceWorldContracts({
      year:1,
      month:1,
      event:worldEvent(1, 1),
      progress:result.progress,
      rewardedKeys:result.rewardedKeys,
      region:'starlight_forest',
      grade:'S',
    });
    expect(repeat.reward).toEqual({ gold:0, gems:0 });
    expect(repeat.progress).toEqual({ expedition_clear:3, high_grade:2, featured_region:2 });
  });

  it('keeps completed counters capped and rewards fixed through long successful replay', () => {
    const event = worldEvent(1, 1);
    let progress = emptyWorldContractProgress();
    let rewardedKeys:string[] = [];
    let totalGold = 0;
    let totalGems = 0;

    for (let index = 0; index < 500; index += 1) {
      const result = advanceWorldContracts({
        year:1,
        month:1,
        event,
        progress,
        rewardedKeys,
        region:'starlight_forest',
        grade:'S',
      });
      progress = result.progress;
      rewardedKeys = result.rewardedKeys;
      totalGold += result.reward.gold;
      totalGems += result.reward.gems;
    }

    expect(progress).toEqual({ expedition_clear:3, high_grade:2, featured_region:2 });
    expect(rewardedKeys).toEqual([
      '1-1:high_grade',
      '1-1:featured_region',
      '1-1:expedition_clear',
    ]);
    expect(totalGold).toBe(250);
    expect(totalGems).toBe(1);
  });

  it('creates stable monthly reward keys', () => {
    expect(worldContractRewardKey(2, 8, 'high_grade')).toBe('2-8:high_grade');
    expect(worldContractRewardKey(0, 99, 'high_grade')).toBe('1-12:high_grade');
    expect(worldContractRewardKey(Number.NaN, Number.NaN, 'high_grade')).toBe('1-1:high_grade');
  });
});