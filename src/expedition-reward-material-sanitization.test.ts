import { describe, expect, it } from 'vitest';
import { resolveExpeditionFinish } from './expedition-rewards';
import { emptyExpeditionPersistentState } from './expedition-state';

function base() {
  return {
    ...emptyExpeditionPersistentState(),
    gold: 0,
    gems: 0,
    affection: 0,
    inventory: { star_cookie: 0, herb_tea: 0, fox_charm: 0 },
  };
}

describe('expedition reward material sanitation', () => {
  it.each([
    Number.NaN,
    Number.POSITIVE_INFINITY,
    -100,
  ])('repairs malformed material balance %s before adding a clear reward', malformed => {
    const state = base();
    state.expeditionMaterials.star_bark = malformed;

    const result = resolveExpeditionFinish(state, 'forest_path', 700);

    expect(result.summary.cleared).toBe(true);
    expect(result.summary.materialReward).toBe(1);
    expect(result.state.expeditionMaterials.star_bark).toBe(1);
    expect(Number.isFinite(result.state.expeditionMaterials.star_bark)).toBe(true);
  });
});
