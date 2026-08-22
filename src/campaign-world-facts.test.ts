import { describe, expect, it } from 'vitest';
import {
  sanitizeCampaignWorldFacts,
  sanitizeWorldFactIds,
  worldFactDefinitions,
} from './campaign-world';

describe('V3 campaign world facts', () => {
  it('exposes only the canonical Spring WorldFact registry', () => {
    expect(worldFactDefinitions.map(item => item.id)).toEqual([
      'festival_saved',
      'festival_heavy_losses',
      'ancient_route_opened',
      'ancient_route_sealed',
      'regional_alliance',
      'rift_unstable',
    ]);
  });

  it('drops stale, malformed and duplicate fact ids while preserving first canonical order', () => {
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
      currentRunFacts: ['festival_saved', 'festival_saved', 'stale'],
      inheritedEchoFacts: ['ancient_route_opened', 'festival_saved', 'unknown'],
    })).toEqual({
      currentRunFacts: ['festival_saved'],
      inheritedEchoFacts: ['ancient_route_opened', 'festival_saved'],
    });
  });

  it('fails malformed containers to empty collections instead of mixing history into the run', () => {
    for (const raw of [null, undefined, 42, 'bad', []]) {
      expect(sanitizeCampaignWorldFacts(raw)).toEqual({
        currentRunFacts: [],
        inheritedEchoFacts: [],
      });
    }
  });
});
