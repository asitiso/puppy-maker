import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game';
import { sanctuaryContractSet } from './sanctuary-contracts';

const weekKey = `${initialState.year}-${initialState.month}-${initialState.week}`;

describe('sanctuary contract reducer progression', () => {
  it('hydrates valid contract state and sanitizes malformed values', () => {
    const hydrated = hydrateGameState({
      ...initialState,
      sanctuaryContractWeekKey:'1-4-1',
      sanctuaryContractProgress:{ training_focus:2, field_patrol:-3, bad:99 },
      rewardedSanctuaryContracts:['1-4-1:training_focus','bad','1-4-1:training_focus'],
      sanctuaryPrestige:27.9,
      claimedSanctuaryPrestigeRanks:['haven','bad','haven','celestial'],
    });
    expect(hydrated.sanctuaryContractWeekKey).toBe('1-4-1');
    expect(hydrated.sanctuaryContractProgress).toEqual({ training_focus:2, field_patrol:0 });
    expect(hydrated.rewardedSanctuaryContracts).toEqual(['1-4-1:training_focus']);
    expect(hydrated.sanctuaryPrestige).toBe(27);
    expect(hydrated.claimedSanctuaryPrestigeRanks).toEqual(['haven','celestial']);
  });

  it('advances and rewards a matching successful outing contract exactly once', () => {
    const contracts = sanctuaryContractSet(initialState.year,initialState.month,initialState.week,initialState.sanctuaryLevels);
    const outing = contracts.find(item => item.kind === 'outing');
    if (!outing) return;
    const ready = {
      ...initialState,
      sanctuaryContractWeekKey:weekKey,
      sanctuaryContractProgress:{ [outing.id]:outing.target - 1 },
    };
    const next = reducer(ready,{ type:'GO_OUTING', locationId:'forest' });
    expect(next.sanctuaryContractProgress[outing.id]).toBe(outing.target);
    expect(next.rewardedSanctuaryContracts).toContain(`${weekKey}:${outing.id}`);
    expect(next.sanctuaryPrestige).toBe(outing.prestige);
    expect(next.gold).toBeGreaterThanOrEqual(ready.gold + outing.reward.gold);
    const repeat = reducer(next,{ type:'GO_OUTING', locationId:'forest' });
    expect(repeat.sanctuaryPrestige).toBe(next.sanctuaryPrestige);
  });

  it('does not advance gift contracts when the gift action is a no-op', () => {
    const contracts = sanctuaryContractSet(initialState.year,initialState.month,initialState.week,initialState.sanctuaryLevels);
    const gift = contracts.find(item => item.kind === 'gift');
    if (!gift) return;
    const ready = {
      ...initialState,
      inventory:{ herb_tea:0, star_cookie:0, guardian_charm:0 },
      sanctuaryContractWeekKey:weekKey,
      sanctuaryContractProgress:{ [gift.id]:0 },
    };
    const next = reducer(ready,{ type:'GIVE_GIFT', itemId:'herb_tea' });
    expect(next).toBe(ready);
  });

  it('resets weekly progress when the in-game week changes but preserves prestige and rewards', () => {
    const state = {
      ...initialState,
      week:2,
      sanctuaryContractWeekKey:'1-4-1',
      sanctuaryContractProgress:{ training_focus:2 },
      rewardedSanctuaryContracts:['1-4-1:training_focus'],
      sanctuaryPrestige:12,
    };
    const next = reducer(state,{ type:'GO_OUTING', locationId:'forest' });
    expect(next.sanctuaryContractWeekKey).toBe('1-4-2');
    expect(next.rewardedSanctuaryContracts).toEqual(state.rewardedSanctuaryContracts);
    expect(next.sanctuaryPrestige).toBeGreaterThanOrEqual(12);
    expect(next.sanctuaryContractProgress.training_focus ?? 0).toBe(0);
  });

  it('auto-claims sanctuary prestige rank rewards only once', () => {
    const contracts = sanctuaryContractSet(initialState.year,initialState.month,initialState.week,initialState.sanctuaryLevels);
    const target = contracts.find(item => item.prestige >= 5)!;
    const ready = {
      ...initialState,
      sanctuaryContractWeekKey:weekKey,
      sanctuaryContractProgress:{ [target.id]:target.target - 1 },
      sanctuaryPrestige:19,
      claimedSanctuaryPrestigeRanks:[] as string[],
    };
    const action = target.kind === 'training'
      ? ({ type:'FINISH_TRAINING' } as const)
      : target.kind === 'outing'
        ? ({ type:'GO_OUTING', locationId:'forest' } as const)
        : target.kind === 'gift'
          ? ({ type:'GIVE_GIFT', itemId:'herb_tea' } as const)
          : ({ type:'FINISH_EXPEDITION_STAGE', stageId:'forest_path', score:700 } as const);
    const next = reducer(ready as typeof initialState & typeof ready,action);
    expect(next.claimedSanctuaryPrestigeRanks).toContain('haven');
    const firstGold = next.gold;
    const second = reducer(next,action);
    expect(second.claimedSanctuaryPrestigeRanks.filter(id => id === 'haven')).toHaveLength(1);
    expect(second.gold - firstGold).toBeLessThan(300);
  });
});
