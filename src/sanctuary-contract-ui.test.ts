import { describe, expect, it } from 'vitest';
import { initialState } from './game';
import { sanctuaryContractUiSummary } from './sanctuary-contract-ui';
import { sanctuaryContractSet } from './sanctuary-contracts';

describe('sanctuary contract ui summary', () => {
  it('summarizes current prestige rank and weekly contract progress', () => {
    const key = `${initialState.year}-${initialState.month}-${initialState.week}`;
    const contracts = sanctuaryContractSet(initialState.year,initialState.month,initialState.week,initialState.sanctuaryLevels);
    const first = contracts[0];
    const summary = sanctuaryContractUiSummary({
      ...initialState,
      sanctuaryContractWeekKey:key,
      sanctuaryContractProgress:{ [first.id]:1 },
      sanctuaryPrestige:24,
      claimedSanctuaryPrestigeRanks:['haven'],
    });
    expect(summary.prestige).toEqual(expect.objectContaining({ id:'haven', prestige:24, nextThreshold:50 }));
    expect(summary.contracts).toHaveLength(3);
    expect(summary.contracts[0]).toEqual(expect.objectContaining({ id:first.id, current:1, target:first.target }));
    expect(summary.claimedRanks).toEqual(['haven']);
  });

  it('treats stale weekly progress as zero', () => {
    const summary = sanctuaryContractUiSummary({
      ...initialState,
      sanctuaryContractWeekKey:'1-3-4',
      sanctuaryContractProgress:{ training_focus:99, field_patrol:99, warm_bond:99, guardian_sortie:99 },
    });
    expect(summary.contracts.every(item => item.current === 0)).toBe(true);
  });
});
