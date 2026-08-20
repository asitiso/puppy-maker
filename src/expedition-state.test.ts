import { describe, expect, it } from 'vitest';
import { hydrateExpeditionPersistentState } from './expedition-state';

describe('expedition persistent state repair', () => {
  it('restores guardian thread ownership when its crafting milestone exists', () => {
    const state = hydrateExpeditionPersistentState({
      craftingMilestones:['crafted_guardian_thread'],
      ownedExpeditionRelics:[],
    });
    expect(state.craftingMilestones).toContain('crafted_guardian_thread');
    expect(state.ownedExpeditionRelics).toContain('guardian_thread');
  });

  it('keeps only owned relics equipped after hydration', () => {
    const state = hydrateExpeditionPersistentState({
      ownedExpeditionRelics:['moonfang_charm'],
      equippedExpeditionRelics:['moonfang_charm','mana_prism'],
    });
    expect(state.equippedExpeditionRelics).toEqual(['moonfang_charm']);
  });
});
