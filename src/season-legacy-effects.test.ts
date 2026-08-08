import { describe, expect, it } from 'vitest';
import { seasonLegacyEffects } from './season-legacy-effects';

describe('season legacy passive effects', () => {
  it('returns zero bonuses with no unlocked nodes', () => {
    expect(seasonLegacyEffects([])).toEqual({ monthlyJourneyBonus:0, weeklyTokenBonus:0, expeditionJourneyBonus:0 });
  });

  it('stacks chronicle branch monthly journey bonuses by tier', () => {
    expect(seasonLegacyEffects(['chronicle_seed','chronicle_keeper','chronicle_crown']).monthlyJourneyBonus).toBe(15);
  });

  it('stacks bond branch weekly token bonuses by tier', () => {
    expect(seasonLegacyEffects(['bond_seed','bond_keeper','bond_crown']).weeklyTokenBonus).toBe(3);
  });

  it('stacks expedition branch expedition journey bonuses by tier', () => {
    expect(seasonLegacyEffects(['expedition_seed','expedition_keeper','expedition_crown']).expeditionJourneyBonus).toBe(9);
  });
});
