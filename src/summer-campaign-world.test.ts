import { describe, expect, it } from 'vitest';
import { campaignWorldObjectives } from './campaign-world';
import {
  getSummerGuardianFestivalWorldRoute,
  summerGuardianFestivalWorldRoutes,
} from './summer-campaign-world';

describe('Summer Guardian Festival world routes', () => {
  it('defines four distinct campaign identities on existing World objectives', () => {
    expect(summerGuardianFestivalWorldRoutes).toHaveLength(4);
    expect(summerGuardianFestivalWorldRoutes.map(route => route.campaign)).toEqual([
      'caretaker',
      'pathfinder',
      'vanguard',
      'arcanist',
    ]);
    expect(new Set(summerGuardianFestivalWorldRoutes.map(route => route.identity)).size).toBe(4);

    for (const route of summerGuardianFestivalWorldRoutes) {
      const objective = campaignWorldObjectives.find(candidate => candidate.id === route.objectiveId);
      expect(objective).toBeDefined();
      expect(objective?.season).toBe('summer');
      expect(objective?.campaign).toBe(route.campaign);
      expect(objective?.regionId).toBe(route.regionId);
      expect(objective?.stageIds).toContain(route.stageId);
      expect(route.failForward).toBe(true);
    }
  });

  it('keeps the four World gameplay identities intentionally different', () => {
    expect(getSummerGuardianFestivalWorldRoute('caretaker')).toMatchObject({
      identity: 'rescue_protection',
      objectiveId: 'summer_caretaker_festival_rescue',
      stageId: 'forest_guardian',
      pressure: 'civilian_survival',
    });
    expect(getSummerGuardianFestivalWorldRoute('pathfinder')).toMatchObject({
      identity: 'hidden_route_escape',
      objectiveId: 'summer_pathfinder_festival_routes',
      stageId: 'city_gallery',
      pressure: 'escape_traversal',
    });
    expect(getSummerGuardianFestivalWorldRoute('vanguard')).toMatchObject({
      identity: 'grand_tournament',
      objectiveId: 'summer_vanguard_festival_threat',
      stageId: 'city_core',
      pressure: 'elite_chain',
    });
    expect(getSummerGuardianFestivalWorldRoute('arcanist')).toMatchObject({
      identity: 'relic_resonance',
      objectiveId: 'summer_arcanist_festival_relic',
      stageId: 'lake_tempest',
      pressure: 'rule_shift',
    });
  });

  it('returns null for malformed campaign input instead of inventing a route', () => {
    expect(getSummerGuardianFestivalWorldRoute('unknown')).toBeNull();
    expect(getSummerGuardianFestivalWorldRoute(null)).toBeNull();
  });
});
