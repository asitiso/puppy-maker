import { describe, expect, it } from 'vitest';
import { smartSchedule } from './smart-schedule';

describe('smart seasonal schedule', () => {
  it('keeps a balanced plan for a normal spring month while leading with the seasonal activity', () => {
    expect(smartSchedule({ month:4, condition:'normal', focus:'balanced' })).toEqual(['herb','hunt','magic','rest']);
  });

  it('prioritizes recovery when Runa is tired even with an aggressive focus', () => {
    expect(smartSchedule({ month:7, condition:'tired', focus:'hunt' })).toEqual(['rest','herb','rest','hunt']);
  });

  it('builds a focused seasonal specialization when concentration is high', () => {
    expect(smartSchedule({ month:10, condition:'focused', focus:'balanced' })).toEqual(['magic','magic','rest','herb']);
  });

  it('leans into the seasonal physical activity when energetic', () => {
    expect(smartSchedule({ month:7, condition:'energetic', focus:'balanced' })).toEqual(['hunt','hunt','rest','herb']);
  });

  it('leans the normal plan toward the selected hunt focus', () => {
    expect(smartSchedule({ month:4, condition:'normal', focus:'hunt' })).toEqual(['hunt','hunt','herb','rest']);
  });

  it('guarantees two recovery weeks for recovery focus', () => {
    expect(smartSchedule({ month:10, condition:'normal', focus:'recovery' }).filter(id => id === 'rest')).toHaveLength(2);
  });
});
