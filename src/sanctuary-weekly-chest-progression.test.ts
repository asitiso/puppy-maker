import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game';
import { sanctuaryContractSet } from './sanctuary-contracts';

const levels = { ...initialState.sanctuaryLevels, training_hall:1 as const };
const key = `${initialState.year}-${initialState.month}-${initialState.week}`;

describe('sanctuary weekly chest progression', () => {
  it('hydrates only valid unique claimed weekly chest keys', () => {
    const hydrated = hydrateGameState({
      ...initialState,
      claimedSanctuaryWeeklyChests:['1-4-2','bad','1-4-2','2-12-4'],
    });
    expect(hydrated.claimedSanctuaryWeeklyChests).toEqual(['1-4-2','2-12-4']);
  });

  it('auto-claims the weekly chest when the final active contract completes', () => {
    const contracts = sanctuaryContractSet(initialState.year,initialState.month,initialState.week,levels);
    const target = contracts[0];
    const rewarded = contracts.slice(1).map(item => `${key}:${item.id}`);
    const ready = {
      ...initialState,
      sanctuaryLevels:levels,
      sanctuaryContractWeekKey:key,
      sanctuaryContractProgress:{ [target.id]:target.target - 1 },
      rewardedSanctuaryContracts:rewarded,
      sanctuaryPrestige:0,
      claimedSanctuaryWeeklyChests:[] as string[],
    };
    const action = target.kind === 'training'
      ? ({ type:'FINISH_TRAINING' } as const)
      : target.kind === 'outing'
        ? ({ type:'GO_OUTING', location:'forest' } as const)
        : target.kind === 'gift'
          ? ({ type:'GIVE_GIFT', item:'herb_tea' } as const)
          : ({ type:'FINISH_EXPEDITION_STAGE', stageId:'forest_path', score:700 } as const);
    const withInventory = target.kind === 'gift'
      ? { ...ready, inventory:{ ...ready.inventory, herb_tea:1 } }
      : ready;
    const next = reducer(withInventory,action);
    expect(next.claimedSanctuaryWeeklyChests).toContain(key);
    expect(next.gold).toBeGreaterThanOrEqual(withInventory.gold + 150);
    const claimedCount = next.claimedSanctuaryWeeklyChests.length;
    const repeat = reducer(next,action);
    expect(repeat.claimedSanctuaryWeeklyChests).toHaveLength(claimedCount);
  });
});
