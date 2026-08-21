import { describe, expect, it } from 'vitest';
import { monthlyWorldContracts, worldContractRewardKey } from './world-contracts';

describe('world contract calendar sanitation', () => {
  it.each([
    [Number.NaN, Number.NaN],
    [0, 0],
    [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
  ])('uses the same canonical month for contract conditions and reward keys: %s/%s', (year, month) => {
    const contracts = monthlyWorldContracts(year, month);
    const featured = contracts.find(contract => contract.id === 'featured_region');

    expect(worldContractRewardKey(year, month, 'featured_region')).toBe('1-1:featured_region');
    expect(featured?.region).toBe('starlight_forest');
  });
});
