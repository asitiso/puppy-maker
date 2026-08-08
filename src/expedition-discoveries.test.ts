import { describe, expect, it } from 'vitest';
import { discoveryForStage, eligibleExpeditionDiscovery, expeditionDiscoveryDefinitions } from './expedition-discoveries';

describe('expedition discoveries', () => {
  it('defines one permanent discovery per stage', () => {
    expect(expeditionDiscoveryDefinitions).toHaveLength(9);
    expect(new Set(expeditionDiscoveryDefinitions.map(item => item.stageId)).size).toBe(9);
  });

  it('does not award a discovery on B clear but does on A or S', () => {
    expect(eligibleExpeditionDiscovery('forest_path', 'B', [])).toBe(null);
    expect(eligibleExpeditionDiscovery('forest_path', 'A', [])).toBe(discoveryForStage('forest_path').id);
    expect(eligibleExpeditionDiscovery('forest_path', 'S', [])).toBe(discoveryForStage('forest_path').id);
  });

  it('never returns an already owned discovery', () => {
    const id = discoveryForStage('forest_path').id;
    expect(eligibleExpeditionDiscovery('forest_path', 'A', [id])).toBe(null);
  });
});
