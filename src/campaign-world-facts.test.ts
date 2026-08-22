import { describe, expect, it } from 'vitest';
import { worldFactIds } from './world-history';
import {
  sanitizeCampaignWorldFacts,
  sanitizeWorldFactIds,
} from './campaign-world';

describe('V3 campaign world facts', () => {
  it('reuses the authoritative V3 WorldFact registry including the Spring contract ids', () => {
    expect(worldFactIds).toContain('festival_saved');
    expect(worldFactIds).toContain('festival_heavy_losses');
    expect(worldFactIds).toContain('ancient_route_opened');
    expect(worldFactIds).toContain('ancient_route_sealed');
    expect(worldFactIds).toContain('regional_alliance');
    expect(worldFactIds).toContain('rift_unstable');
    expect(new Set(worldFactIds).size).toBe(worldFactIds.length);
  });

  it('drops stale, malformed and duplicate fact ids using canonical registry order', () => {
    expect(sanitizeWorldFactIds([
      'festival_saved',
      'festival_saved',
      'unknown_fact',
      null,
      42,
      'ancient_route_opened',
      'festival_saved',
    ])).toEqual(['festival_saved', 'ancient_route_opened']);
  });

  it('keeps current-run facts and inherited echoes strictly separated', () => {
    expect(sanitizeCampaignWorldFacts({
      currentFacts: ['festival_saved', 'festival_saved', 'stale'],
      inheritedFacts: ['ancient_route_opened', 'festival_saved', 'unknown'],
    })).toEqual({
      currentFacts: ['festival_saved'],
      inheritedFacts: ['festival_saved', 'ancient_route_opened'],
    });
  });

  it('fails malformed containers to empty collections instead of mixing history into the run', () => {
    for (const raw of [null, undefined, 42, 'bad', []]) {
      expect(sanitizeCampaignWorldFacts(raw)).toEqual({
        currentFacts: [],
        inheritedFacts: [],
      });
    }
  });
});
