import { describe, expect, it } from 'vitest';
import { activeCallingTraits } from './growth-traits';
import { hydrateRaisingDepthState } from './raising-depth-state';

describe('growth trait prerequisite integrity', () => {
  it('does not activate an orphan trait when its prerequisite chain is missing', () => {
    expect(activeCallingTraits('vanguard', ['vanguard_focus'])).toEqual([]);
    expect(activeCallingTraits('vanguard', ['vanguard_power','vanguard_assault'])).toEqual(['vanguard_power']);
  });

  it('drops orphan traits while hydrating damaged Raising state', () => {
    const hydrated = hydrateRaisingDepthState({
      activeCalling: 'vanguard',
      purchasedTraits: ['vanguard_focus','vanguard_legend','arcanist_mana','arcanist_insight'],
    });

    expect(hydrated.purchasedTraits).toEqual(['arcanist_mana','arcanist_insight']);
  });
});
