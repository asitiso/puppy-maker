import { describe, expect, it } from 'vitest';
import { emptyExpeditionRecords, updateExpeditionRecord } from './expedition-regions';

describe('expedition record state sanitation', () => {
  it('repairs a malformed current record before applying a valid successful result', () => {
    const records = emptyExpeditionRecords();
    records.forest_path = {
      bestScore: Number.NaN,
      bestGrade: 'Z' as any,
      cleared: false,
    };

    const next = updateExpeditionRecord(records, 'forest_path', 700, 700);

    expect(next.forest_path).toEqual({
      bestScore: 700,
      bestGrade: 'A',
      cleared: true,
    });
  });

  it('does not let a malformed positive-infinity best score survive a worse valid replay', () => {
    const records = emptyExpeditionRecords();
    records.forest_path = {
      bestScore: Number.POSITIVE_INFINITY,
      bestGrade: 'B',
      cleared: true,
    };

    const next = updateExpeditionRecord(records, 'forest_path', 600, 700);

    expect(next.forest_path.bestScore).toBe(600);
    expect(Number.isFinite(next.forest_path.bestScore)).toBe(true);
    expect(next.forest_path.bestGrade).toBe('B');
    expect(next.forest_path.cleared).toBe(true);
  });
});
