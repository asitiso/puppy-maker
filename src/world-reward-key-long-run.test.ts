import { describe, expect, it } from 'vitest';
import { applyExpeditionCallingRewards } from './calling-depth-effects';
import { advanceWorldContracts, emptyWorldContractProgress } from './world-contracts';
import { worldEvent } from './world-event';

describe('World reward key long-run stability', () => {
  it('keeps monthly World Contract reward markers bounded across repeated runs', () => {
    const event = worldEvent(2026, 8);
    let progress = emptyWorldContractProgress();
    let rewardedKeys: any[] = ['2026-8:expedition_clear', '2026-8:expedition_clear', null, 42, ''];

    for (let i = 0; i < 500; i += 1) {
      const result = advanceWorldContracts({
        year:2026,
        month:8,
        event,
        progress,
        rewardedKeys,
        region:event.region,
        grade:'S',
      });
      progress = result.progress;
      rewardedKeys = result.rewardedKeys;
    }

    expect(rewardedKeys).toEqual([
      '2026-8:expedition_clear',
      '2026-8:high_grade',
      '2026-8:featured_region',
    ]);
  });

  it('keeps Calling monthly legend markers canonical and bounded across repeated rewards', () => {
    let legendRewardKeys: any[] = [
      '2026-8:vanguard_legend',
      '2026-8:vanguard_legend',
      '2026-8:unknown_legend',
      null,
      42,
      '',
    ];

    for (let i = 0; i < 500; i += 1) {
      const result = applyExpeditionCallingRewards({
        year:2026,
        month:8,
        calling:'vanguard',
        traits:['vanguard_legend'],
        signatures:[],
        legendRewardKeys,
        stageId:'forest_path',
        grade:'A',
        firstClear:true,
        discovery:null,
        regionCompleted:null,
        materialReward:1,
        fatigueDelta:8,
        stressDelta:0,
      });
      legendRewardKeys = result.legendRewardKeys;
    }

    expect(legendRewardKeys).toEqual(['2026-8:vanguard_legend']);
  });
});