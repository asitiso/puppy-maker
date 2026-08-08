import { describe, expect, it } from 'vitest';
import { smartSchedule } from './smart-schedule';

describe('smart seasonal schedule', () => {
  it('keeps a balanced plan for a normal spring month while leading with the seasonal activity', () => {
    expect(smartSchedule({ month:4, condition:'normal' })).toEqual(['herb','hunt','magic','rest']);
  });

  it('prioritizes recovery when Runa is tired', () => {
    expect(smartSchedule({ month:7, condition:'tired' })).toEqual(['rest','herb','rest','hunt']);
  });

  it('builds a focused seasonal specialization when concentration is high', () => {
    expect(smartSchedule({ month:10, condition:'focused' })).toEqual(['magic','magic','rest','herb']);
  });

  it('leans into the seasonal physical activity when energetic', () => {
    expect(smartSchedule({ month:7, condition:'energetic' })).toEqual(['hunt','hunt','rest','herb']);
  });
});
