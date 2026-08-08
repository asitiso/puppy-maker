import { describe, expect, it } from 'vitest';
import {
  emptyRegionalRenown,
  regionalRenownLevel,
  regionalRenownReward,
  renownGainForExpedition,
} from './regional-renown';

describe('regional renown', () => {
  it('starts every expedition region at zero', () => {
    expect(emptyRegionalRenown()).toEqual({
      starlight_forest:0,
      ancient_city:0,
      wind_lakes:0,
    });
  });

  it('grants renown from successful grades and first boss clears', () => {
    expect(renownGainForExpedition('B', false)).toBe(1);
    expect(renownGainForExpedition('A', false)).toBe(2);
    expect(renownGainForExpedition('S', false)).toBe(3);
    expect(renownGainForExpedition('S', true)).toBe(5);
    expect(renownGainForExpedition('C', true)).toBe(0);
  });

  it('maps persistent renown to five reputation levels', () => {
    expect(regionalRenownLevel(0)).toBe(1);
    expect(regionalRenownLevel(4)).toBe(1);
    expect(regionalRenownLevel(5)).toBe(2);
    expect(regionalRenownLevel(12)).toBe(3);
    expect(regionalRenownLevel(22)).toBe(4);
    expect(regionalRenownLevel(35)).toBe(5);
    expect(regionalRenownLevel(999)).toBe(5);
  });

  it('defines one-time rewards for levels two through five', () => {
    expect(regionalRenownReward(1)).toEqual({ gold:0, gems:0 });
    expect(regionalRenownReward(2)).toEqual({ gold:100, gems:0 });
    expect(regionalRenownReward(3)).toEqual({ gold:0, gems:1 });
    expect(regionalRenownReward(4)).toEqual({ gold:150, gems:0 });
    expect(regionalRenownReward(5)).toEqual({ gold:0, gems:2 });
  });
});
