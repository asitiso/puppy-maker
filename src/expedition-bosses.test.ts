import { describe, expect, it } from 'vitest';
import { bossReward, isBossStage } from './expedition-bosses';

describe('expedition boss trials', () => {
  it('identifies the three regional bosses', () => {
    expect(isBossStage('forest_guardian')).toBe(true);
    expect(isBossStage('city_core')).toBe(true);
    expect(isBossStage('lake_tempest')).toBe(true);
    expect(isBossStage('forest_path')).toBe(false);
  });

  it('uses the approved one-time first-clear rewards', () => {
    expect(bossReward('forest_guardian')).toEqual({ gold: 500, gems: 2 });
    expect(bossReward('city_core')).toEqual({ gold: 700, gems: 3 });
    expect(bossReward('lake_tempest')).toEqual({ gold: 1000, gems: 5 });
    expect(bossReward('forest_path')).toEqual({ gold: 0, gems: 0 });
  });
});
