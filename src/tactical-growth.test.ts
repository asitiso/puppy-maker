import { describe, expect, it } from 'vitest';
import { initialState } from './game';
import { buildDefaultTacticalAllies, buildRunaTacticalUnit } from './tactical-growth';

describe('tactical growth adapter', () => {
  it('turns strength, magic/intelligence and affection into bounded combat powers', () => {
    const low = buildRunaTacticalUnit({
      ...initialState,
      stats:{ ...initialState.stats, strength:10, intelligence:10, magic:10, affection:20 },
    });
    const high = buildRunaTacticalUnit({
      ...initialState,
      stats:{ ...initialState.stats, strength:90, intelligence:80, magic:95, affection:95 },
    });
    expect(high.attackPower).toBeGreaterThan(low.attackPower);
    expect(high.skillPower).toBeGreaterThan(low.skillPower);
    expect(high.supportPower).toBeGreaterThan(low.supportPower);
    expect(high.attackPower).toBeLessThanOrEqual(80);
    expect(high.skillPower).toBeLessThanOrEqual(90);
    expect(high.supportPower).toBeLessThanOrEqual(70);
  });

  it('maps the current Guardian Calling to a tactical role and special', () => {
    expect(buildRunaTacticalUnit({ ...initialState, activeCalling:'vanguard' }).specialId).toBe('vanguard_breaker');
    expect(buildRunaTacticalUnit({ ...initialState, activeCalling:'arcanist' }).specialId).toBe('astral_burst');
    expect(buildRunaTacticalUnit({ ...initialState, activeCalling:'caretaker' }).specialId).toBe('heart_sanctuary');
    expect(buildRunaTacticalUnit({ ...initialState, activeCalling:'pathfinder' }).specialId).toBe('starfall_mark');
  });

  it('builds a deterministic three-member ally formation without new collection state', () => {
    const first = buildDefaultTacticalAllies(initialState);
    const second = buildDefaultTacticalAllies(initialState);
    expect(first.map(unit => unit.id)).toEqual(['runa','guardian_bear','guardian_owl']);
    expect(first).toEqual(second);
    expect(first).toHaveLength(3);
  });
});
