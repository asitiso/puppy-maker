import { describe, expect, it } from 'vitest';
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

  it('adds event season points only in the featured region', () => {
    const event = worldEvent(1, 1);
    expect(worldEventExpeditionBonus(event, 'starlight_forest', 'A')).toEqual({ seasonPoints:5, materialBonus:0 });
    expect(worldEventExpeditionBonus(event, 'starlight_forest', 'S')).toEqual({ seasonPoints:5, materialBonus:1 });
    expect(worldEventExpeditionBonus(event, 'ancient_city', 'S')).toEqual({ seasonPoints:0, materialBonus:0 });
    expect(worldEventExpeditionBonus(event, 'starlight_forest', 'C')).toEqual({ seasonPoints:0, materialBonus:0 });
  });
});
