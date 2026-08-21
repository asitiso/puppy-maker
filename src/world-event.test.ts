import { describe, expect, it } from 'vitest';
import { monthlyWorldContracts } from './world-contracts';
import { worldEvent, worldEventExpeditionBonus } from './world-event';

describe('monthly world events', () => {
  it('rotates deterministically across six world events', () => {
    expect(worldEvent(1, 1).id).toBe('forest_bloom');
    expect(worldEvent(1, 2).id).toBe('arcane_market');
    expect(worldEvent(1, 3).id).toBe('moon_tide');
    expect(worldEvent(1, 7).id).toBe('forest_bloom');
    expect(worldEvent(2, 1).id).toBe('forest_bloom');
  });

  it('cycles featured regions in a balanced order', () => {
    expect(worldEvent(1, 1).region).toBe('starlight_forest');
    expect(worldEvent(1, 2).region).toBe('ancient_city');
    expect(worldEvent(1, 3).region).toBe('wind_lakes');
  });

  it('keeps the monthly contract recommended region aligned with the world event', () => {
    for (let month = 1; month <= 12; month += 1) {
      const event = worldEvent(1, month);
      const featuredContract = monthlyWorldContracts(1, month, event).find(contract => contract.id === 'featured_region');
      expect(featuredContract?.region).toBe(event.region);
    }
  });

  it('adds event points for B-or-better in the featured region and material only for S', () => {
    const event = worldEvent(1, 1);
    expect(worldEventExpeditionBonus(event, 'starlight_forest', 'B')).toEqual({ seasonPoints:5, materialBonus:0 });
    expect(worldEventExpeditionBonus(event, 'starlight_forest', 'A')).toEqual({ seasonPoints:5, materialBonus:0 });
    expect(worldEventExpeditionBonus(event, 'starlight_forest', 'S')).toEqual({ seasonPoints:5, materialBonus:1 });
    expect(worldEventExpeditionBonus(event, 'ancient_city', 'S')).toEqual({ seasonPoints:0, materialBonus:0 });
    expect(worldEventExpeditionBonus(event, 'starlight_forest', 'C')).toEqual({ seasonPoints:0, materialBonus:0 });
  });

  it('sanitizes invalid calendar inputs to a deterministic event', () => {
    expect(worldEvent(0, 0)).toEqual(worldEvent(1, 1));
    expect(worldEvent(Number.NaN, Number.NaN)).toEqual(worldEvent(1, 1));
    expect(worldEvent(1, 99)).toEqual(worldEvent(1, 12));
  });
});
