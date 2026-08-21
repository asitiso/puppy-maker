import { describe, expect, it } from 'vitest';
import {
  isExpeditionStageCleared,
  isExpeditionStageUnlocked,
  nextExpeditionStage,
} from './expedition-regions';

describe('partial expedition record safety', () => {
  it('treats a missing stage record as uncleared instead of throwing', () => {
    expect(isExpeditionStageCleared(undefined as any)).toBe(false);
  });

  it('keeps progression queries safe when the record map is partially missing after re-entry', () => {
    const records = {} as any;

    expect(isExpeditionStageUnlocked('forest_glade', records)).toBe(false);
    expect(nextExpeditionStage(records)).toBe('forest_path');
  });
});
