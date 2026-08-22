import { describe, expect, it } from 'vitest';
import {
  autumnGreatExpeditionWorldRoutes,
  getAutumnGreatExpeditionWorldRoute,
} from './autumn-campaign-world';
import { worldFactIds } from './world-history';

const campaigns = ['caretaker', 'pathfinder', 'vanguard', 'arcanist'] as const;

describe('V3 Autumn Great Expedition World routes', () => {
  it('defines one existing-stage Great Expedition route for each main campaign', () => {
    expect(autumnGreatExpeditionWorldRoutes).toHaveLength(4);
    expect(autumnGreatExpeditionWorldRoutes.map(route => route.campaign)).toEqual(campaigns);
    for (const route of autumnGreatExpeditionWorldRoutes) {
      expect(route.eventId).toBe('great_expedition');
      expect(route.failForward).toBe(true);
      expect(route.stageId.length).toBeGreaterThan(0);
    }
  });

  it('requires a resolved Guardian Festival prerequisite before a route is ready', () => {
    expect(getAutumnGreatExpeditionWorldRoute('caretaker', {
      activeCampaign: 'caretaker',
      worldHistory: { currentFacts: ['festival_saved'], inheritedFacts: [] },
      majorOutcomes: { guardian_festival: 'victory' },
      failForwardOutcomes: [],
    })?.campaign).toBe('caretaker');

    expect(getAutumnGreatExpeditionWorldRoute('caretaker', {
      activeCampaign: 'caretaker',
      worldHistory: { currentFacts: [], inheritedFacts: [] },
      majorOutcomes: {},
      failForwardOutcomes: [],
    })).toBeNull();

    expect(getAutumnGreatExpeditionWorldRoute('not-a-campaign', null)).toBeNull();
  });

  it('registers only the missing stable Autumn consequence facts in the central registry', () => {
    expect(worldFactIds).toEqual(expect.arrayContaining([
      'caretaker_critical_person_saved',
      'caretaker_risk_shared',
      'caretaker_team_solution',
      'coalition_command',
      'forbidden_relic_controlled',
    ]));
  });
});
