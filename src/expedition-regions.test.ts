import { describe, expect, it } from 'vitest';
import {
  emptyExpeditionRecords,
  expeditionGrade,
  expeditionRegionDefinitions,
  expeditionStageDefinitions,
  isExpeditionStageCleared,
  isExpeditionStageUnlocked,
  nextExpeditionStage,
  updateExpeditionRecord,
} from './expedition-regions';

describe('guardian expedition world progression', () => {
  it('defines exactly three regions and nine sequential stages', () => {
    expect(expeditionRegionDefinitions).toHaveLength(3);
    expect(expeditionStageDefinitions).toHaveLength(9);
    expect(expeditionRegionDefinitions.map(region => region.stages.length)).toEqual([3, 3, 3]);
  });

  it('grades against the stage target thresholds', () => {
    expect(expeditionGrade(1200, 1000)).toBe('S');
    expect(expeditionGrade(1199, 1000)).toBe('A');
    expect(expeditionGrade(1000, 1000)).toBe('A');
    expect(expeditionGrade(800, 1000)).toBe('B');
    expect(expeditionGrade(799, 1000)).toBe('C');
  });

  it('rejects non-finite scores instead of letting them grant or corrupt progression', () => {
    expect(expeditionGrade(Number.POSITIVE_INFINITY, 1000)).toBe('C');
    expect(expeditionGrade(Number.NaN, 1000)).toBe('C');

    const records = updateExpeditionRecord(emptyExpeditionRecords(), 'forest_path', Number.NaN, 1000);
    expect(records.forest_path).toEqual({ bestScore: 0, bestGrade: 'C', cleared: false });
  });

  it('counts only B or better as a clear', () => {
    expect(isExpeditionStageCleared({ bestScore: 799, bestGrade: 'C', cleared: false })).toBe(false);
    expect(isExpeditionStageCleared({ bestScore: 800, bestGrade: 'B', cleared: true })).toBe(true);
  });

  it('unlocks stages and regions in strict order', () => {
    let records = emptyExpeditionRecords();
    expect(isExpeditionStageUnlocked('forest_path', records)).toBe(true);
    expect(isExpeditionStageUnlocked('forest_glade', records)).toBe(false);
    expect(isExpeditionStageUnlocked('city_square', records)).toBe(false);

    records = updateExpeditionRecord(records, 'forest_path', 900, 800);
    expect(isExpeditionStageUnlocked('forest_glade', records)).toBe(true);
    expect(isExpeditionStageUnlocked('forest_guardian', records)).toBe(false);

    records = updateExpeditionRecord(records, 'forest_glade', 1000, 900);
    expect(isExpeditionStageUnlocked('forest_guardian', records)).toBe(true);
    expect(isExpeditionStageUnlocked('city_square', records)).toBe(false);

    records = updateExpeditionRecord(records, 'forest_guardian', 1500, 1200);
    expect(isExpeditionStageUnlocked('city_square', records)).toBe(true);
  });

  it('preserves the best score and best grade on worse replays', () => {
    let records = emptyExpeditionRecords();
    records = updateExpeditionRecord(records, 'forest_path', 1200, 1000);
    records = updateExpeditionRecord(records, 'forest_path', 850, 1000);
    expect(records.forest_path.bestScore).toBe(1200);
    expect(records.forest_path.bestGrade).toBe('S');
    expect(records.forest_path.cleared).toBe(true);
  });

  it('returns the first currently unlocked uncleared stage as the recommendation', () => {
    let records = emptyExpeditionRecords();
    expect(nextExpeditionStage(records)).toBe('forest_path');
    records = updateExpeditionRecord(records, 'forest_path', 900, 800);
    expect(nextExpeditionStage(records)).toBe('forest_glade');
  });
});
