import { describe, expect, it } from 'vitest';
import { readAmbitionSelections, selectionForYear, setAmbitionForYear } from './yearly-ambition-selection';

describe('yearly ambition selection persistence', () => {
  it('drops malformed years and unknown ambition ids', () => {
    expect(readAmbitionSelections({ '1':'training', '2':'oops', '-1':'bond', 'x':'season', '3':'exploration' })).toEqual({ 1:'training', 3:'exploration' });
  });

  it('returns no selection until the player chooses for that year', () => {
    expect(selectionForYear({}, 2)).toBeNull();
    expect(selectionForYear({ 2:'bond' }, 2)).toBe('bond');
  });

  it('writes one year without changing prior year choices', () => {
    expect(setAmbitionForYear({ 1:'training' }, 2, 'season')).toEqual({ 1:'training', 2:'season' });
  });
});
