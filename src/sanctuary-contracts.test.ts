import { describe, expect, it } from 'vitest';
import {
  advanceSanctuaryContracts,
  sanctuaryContractSet,
  sanctuaryPrestigeRank,
  sanctuaryPrestigeReward,
} from './sanctuary-contracts';
import { emptySanctuaryLevels } from './starlight-sanctuary';

describe('sanctuary contracts', () => {
  it('generates three deterministic weekly contracts from sanctuary levels', () => {
    const levels = { ...emptySanctuaryLevels(), training_hall:2 as const, observatory:1 as const };
    const first = sanctuaryContractSet(2,5,3,levels);
    const repeat = sanctuaryContractSet(2,5,3,levels);
    expect(first).toEqual(repeat);
    expect(first).toHaveLength(3);
    expect(new Set(first.map(item => item.id)).size).toBe(3);
    expect(first.every(item => item.target >= 1 && item.prestige > 0)).toBe(true);
  });

  it('advances only matching actions, caps progress and reports newly completed contracts', () => {
    const levels = emptySanctuaryLevels();
    const contracts = sanctuaryContractSet(1,4,1,levels);
    const target = contracts[0];
    let progress:Record<string,number> = {};
    let completed:string[] = [];
    for (let index=0; index<target.target + 2; index += 1) {
      const next = advanceSanctuaryContracts(contracts,progress,{ kind:target.kind },completed);
      progress = next.progress;
      completed = [...completed,...next.completed.map(item => item.id)];
    }
    expect(progress[target.id]).toBe(target.target);
    expect(completed.filter(id => id === target.id)).toHaveLength(1);
  });

  it('maps accumulated prestige to five sanctuary ranks', () => {
    expect(sanctuaryPrestigeRank(0).id).toBe('outpost');
    expect(sanctuaryPrestigeRank(20).id).toBe('haven');
    expect(sanctuaryPrestigeRank(50).id).toBe('sanctum');
    expect(sanctuaryPrestigeRank(100).id).toBe('citadel');
    expect(sanctuaryPrestigeRank(180).id).toBe('celestial');
  });

  it('provides one-time rewards for prestige rank milestones', () => {
    expect(sanctuaryPrestigeReward('haven')).toEqual({ gold:300, gems:0 });
    expect(sanctuaryPrestigeReward('sanctum')).toEqual({ gold:0, gems:2 });
    expect(sanctuaryPrestigeReward('citadel')).toEqual({ gold:700, gems:2 });
    expect(sanctuaryPrestigeReward('celestial')).toEqual({ gold:1200, gems:5 });
  });
});
