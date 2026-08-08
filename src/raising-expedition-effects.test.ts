import { describe, expect, it } from 'vitest';
import { expeditionIdentityModifiers, pathfinderSupplyBonus } from './raising-expedition-effects';

describe('raising depth expedition effects', () => {
  it('maps active tier-three Calling traits to five-percent combat modifiers', () => {
    expect(expeditionIdentityModifiers('vanguard', ['vanguard_power','vanguard_focus','vanguard_assault'])).toEqual({ attack:0.05, charge:0, dodge:0 });
    expect(expeditionIdentityModifiers('arcanist', ['arcanist_mana','arcanist_insight','arcanist_channel'])).toEqual({ attack:0, charge:0.05, dodge:0 });
    expect(expeditionIdentityModifiers('caretaker', ['caretaker_rest','caretaker_bond','caretaker_guard'])).toEqual({ attack:0, charge:0, dodge:0.05 });
  });

  it('ignores purchased combat traits from an inactive Calling', () => {
    expect(expeditionIdentityModifiers('arcanist', ['vanguard_assault'])).toEqual({ attack:0, charge:0, dodge:0 });
    expect(expeditionIdentityModifiers(null, ['vanguard_assault','arcanist_channel','caretaker_guard'])).toEqual({ attack:0, charge:0, dodge:0 });
  });

  it('grants one extra regional material on S clear for active Pathfinder supply trait', () => {
    expect(pathfinderSupplyBonus('pathfinder', ['pathfinder_herb','pathfinder_eye','pathfinder_supply'], 'forest_guardian', 'S')).toBe('star_bark');
    expect(pathfinderSupplyBonus('pathfinder', ['pathfinder_supply'], 'city_core', 'A')).toBeNull();
    expect(pathfinderSupplyBonus('vanguard', ['pathfinder_supply'], 'lake_tempest', 'S')).toBeNull();
  });
});
