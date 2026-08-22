import { describe, expect, it } from 'vitest';
import { majorOutcomeResults } from './campaign-model';
import { resolveGuardianFestivalWorldOutcome } from './campaign-world';

describe('V3 Guardian Festival world outcome', () => {
  it('accepts only the canonical V3 outcome results and maps them to current-run world facts', () => {
    const expectedFacts = {
      exceptional_victory: 'festival_saved',
      victory: 'festival_saved',
      costly_victory: 'festival_heavy_losses',
      defeat: 'festival_heavy_losses',
    } as const;

    for (const outcome of majorOutcomeResults) {
      const result = resolveGuardianFestivalWorldOutcome({
        outcome,
        worldHistory: { currentFacts: [], inheritedFacts: ['ancient_route_opened'] },
        majorOutcomes: {},
        failForwardOutcomes: [],
      });
      expect(result.applied).toBe(true);
      expect(result.eventId).toBe('guardian_festival');
      expect(result.outcome).toBe(outcome);
      expect(result.fact).toBe(expectedFacts[outcome]);
      expect(result.worldHistory.currentFacts).toEqual([expectedFacts[outcome]]);
      expect(result.worldHistory.inheritedFacts).toEqual(['ancient_route_opened']);
      expect(result.majorOutcomes).toEqual({ guardian_festival: outcome });
    }
  });

  it('marks costly victory and defeat as fail-forward without blocking canonical resolution', () => {
    for (const outcome of ['costly_victory', 'defeat'] as const) {
      const result = resolveGuardianFestivalWorldOutcome({
        outcome,
        worldHistory: { currentFacts: [], inheritedFacts: [] },
        majorOutcomes: {},
        failForwardOutcomes: [],
      });
      expect(result.applied).toBe(true);
      expect(result.failForwardOutcomes).toEqual(['guardian_festival']);
    }

    for (const outcome of ['exceptional_victory', 'victory'] as const) {
      const result = resolveGuardianFestivalWorldOutcome({
        outcome,
        worldHistory: { currentFacts: [], inheritedFacts: [] },
        majorOutcomes: {},
        failForwardOutcomes: [],
      });
      expect(result.failForwardOutcomes).toEqual([]);
    }
  });

  it('is once-only and never overwrites the first canonical Guardian Festival result', () => {
    const first = resolveGuardianFestivalWorldOutcome({
      outcome: 'defeat',
      worldHistory: { currentFacts: [], inheritedFacts: ['festival_saved'] },
      majorOutcomes: {},
      failForwardOutcomes: [],
    });
    const replay = resolveGuardianFestivalWorldOutcome({
      outcome: 'exceptional_victory',
      worldHistory: first.worldHistory,
      majorOutcomes: first.majorOutcomes,
      failForwardOutcomes: first.failForwardOutcomes,
    });

    expect(replay.applied).toBe(false);
    expect(replay.outcome).toBe('defeat');
    expect(replay.fact).toBe('festival_heavy_losses');
    expect(replay.majorOutcomes).toEqual({ guardian_festival: 'defeat' });
    expect(replay.worldHistory.currentFacts).toEqual(['festival_heavy_losses']);
    expect(replay.worldHistory.inheritedFacts).toEqual(['festival_saved']);
    expect(replay.failForwardOutcomes).toEqual(['guardian_festival']);
  });

  it('sanitizes malformed state and fails closed for unknown outcomes', () => {
    const result = resolveGuardianFestivalWorldOutcome({
      outcome: 'unknown_result',
      worldHistory: {
        currentFacts: ['festival_saved', 'festival_saved', 'stale'],
        inheritedFacts: ['ancient_route_opened', 'unknown'],
      },
      majorOutcomes: { guardian_festival: 'broken', unknown_event: 'victory' },
      failForwardOutcomes: ['guardian_festival', 'guardian_festival', 'unknown_event'],
    } as any);

    expect(result.applied).toBe(false);
    expect(result.outcome).toBeNull();
    expect(result.fact).toBeNull();
    expect(result.worldHistory).toEqual({
      currentFacts: ['festival_saved'],
      inheritedFacts: ['ancient_route_opened'],
    });
    expect(result.majorOutcomes).toEqual({});
    expect(result.failForwardOutcomes).toEqual(['guardian_festival']);
  });
});
