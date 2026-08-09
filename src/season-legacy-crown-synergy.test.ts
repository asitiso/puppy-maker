import { describe, expect, it } from 'vitest';
import { seasonLegacyEffects } from './season-legacy-effects';

describe('season legacy crown synergy', () => {
  it('adds a cross-branch bonus after two legacy crowns are unlocked', () => {
    expect(seasonLegacyEffects(['chronicle_crown','bond_crown'])).toEqual({
      monthlyJourneyBonus:10,
      weeklyTokenBonus:2,
      expeditionJourneyBonus:2,
    });
  });

  it('upgrades to the full tri-crown bonus when all three crowns are unlocked', () => {
    expect(seasonLegacyEffects(['chronicle_crown','bond_crown','expedition_crown'])).toEqual({
      monthlyJourneyBonus:15,
      weeklyTokenBonus:3,
      expeditionJourneyBonus:8,
    });
  });

  it('does not add synergy for only one crown', () => {
    expect(seasonLegacyEffects(['expedition_crown'])).toEqual({
      monthlyJourneyBonus:0,
      weeklyTokenBonus:0,
      expeditionJourneyBonus:4,
    });
  });
});
