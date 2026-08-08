import { describe, expect, it } from 'vitest';
import { sanctuaryWeeklyChestReward, sanctuaryWeeklyChestReady } from './sanctuary-weekly-chest';

describe('sanctuary weekly completion chest', () => {
  it('requires all three current weekly contracts and no prior claim', () => {
    const contractIds = ['training_focus','field_patrol','warm_bond'];
    expect(sanctuaryWeeklyChestReady('1-4-2',contractIds,[
      '1-4-2:training_focus','1-4-2:field_patrol','1-4-2:warm_bond',
    ],[])).toBe(true);
    expect(sanctuaryWeeklyChestReady('1-4-2',contractIds,[
      '1-4-2:training_focus','1-4-2:field_patrol',
    ],[])).toBe(false);
    expect(sanctuaryWeeklyChestReady('1-4-2',contractIds,[
      '1-4-2:training_focus','1-4-2:field_patrol','1-4-2:warm_bond',
    ],['1-4-2'])).toBe(false);
  });

  it('scales the weekly chest with sanctuary prestige rank', () => {
    expect(sanctuaryWeeklyChestReward('outpost')).toEqual({ gold:150, gems:0 });
    expect(sanctuaryWeeklyChestReward('haven')).toEqual({ gold:220, gems:0 });
    expect(sanctuaryWeeklyChestReward('sanctum')).toEqual({ gold:300, gems:1 });
    expect(sanctuaryWeeklyChestReward('citadel')).toEqual({ gold:450, gems:1 });
    expect(sanctuaryWeeklyChestReward('celestial')).toEqual({ gold:650, gems:2 });
  });
});
