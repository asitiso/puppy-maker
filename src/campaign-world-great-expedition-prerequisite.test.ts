import { describe, expect, it } from 'vitest';
import { buildGreatExpeditionWorldPrerequisite } from './campaign-world';

describe('V3 Great Expedition world prerequisite', () => {
  it('prepares only sanitized Spring/Summer evidence for a main campaign', () => {
    const result = buildGreatExpeditionWorldPrerequisite({
      activeCampaign: 'pathfinder',
      worldHistory: {
        currentFacts: ['festival_saved', 'ancient_route_opened', 'festival_saved', 'stale'],
        inheritedFacts: ['rift_unstable', 'festival_heavy_losses', 'unknown'],
      },
      majorOutcomes: { guardian_festival: 'victory' },
      failForwardOutcomes: [],
    });

    expect(result).toEqual({
      campaign: 'pathfinder',
      ready: true,
      guardianFestivalOutcome: 'victory',
      festivalFailForward: false,
      currentFacts: ['festival_saved', 'ancient_route_opened'],
      inheritedFacts: ['festival_heavy_losses', 'rift_unstable'],
    });
  });

  it('preserves a costly or defeated Summer result as fail-forward prerequisite evidence', () => {
    const result = buildGreatExpeditionWorldPrerequisite({
      activeCampaign: 'caretaker',
      worldHistory: { currentFacts: ['festival_heavy_losses'], inheritedFacts: [] },
      majorOutcomes: { guardian_festival: 'defeat' },
      failForwardOutcomes: ['guardian_festival', 'guardian_festival'],
    });

    expect(result.ready).toBe(true);
    expect(result.guardianFestivalOutcome).toBe('defeat');
    expect(result.festivalFailForward).toBe(true);
  });

  it('is not ready until both a valid main campaign and Guardian Festival result exist', () => {
    for (const input of [
      { activeCampaign: 'pathfinder', majorOutcomes: {} },
      { activeCampaign: 'true_path', majorOutcomes: { guardian_festival: 'victory' } },
      { activeCampaign: 'unknown', majorOutcomes: { guardian_festival: 'victory' } },
      { activeCampaign: null, majorOutcomes: { guardian_festival: 'victory' } },
    ] as any[]) {
      const result = buildGreatExpeditionWorldPrerequisite({
        ...input,
        worldHistory: null,
        failForwardOutcomes: null,
      });
      expect(result.ready).toBe(false);
    }
  });

  it('does not implement Great Expedition gameplay or resolve its outcome', () => {
    const result = buildGreatExpeditionWorldPrerequisite({
      activeCampaign: 'arcanist',
      worldHistory: { currentFacts: ['rift_unstable'], inheritedFacts: [] },
      majorOutcomes: {
        guardian_festival: 'costly_victory',
        great_expedition: 'exceptional_victory',
      },
      failForwardOutcomes: ['guardian_festival'],
    });

    expect(Object.keys(result).sort()).toEqual([
      'campaign',
      'currentFacts',
      'festivalFailForward',
      'guardianFestivalOutcome',
      'inheritedFacts',
      'ready',
    ]);
    expect(JSON.stringify(result)).not.toContain('great_expedition');
    expect(JSON.stringify(result)).not.toContain('stageId');
    expect(JSON.stringify(result)).not.toContain('reward');
  });
});
