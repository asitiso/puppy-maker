import { describe, expect, it } from 'vitest';
import { personalityOutcome } from './runa-personality';

describe('personality outcome differentiation', () => {
  it('gives each dominant personality a distinct dialogue, event, reward, and career direction', () => {
    const archetypes = ['brave', 'gentle', 'curious', 'serene'] as const;
    const outcomes = archetypes.map(archetype => personalityOutcome(archetype));

    expect(new Set(outcomes.map(item => item.dialogue)).size).toBe(archetypes.length);
    expect(new Set(outcomes.map(item => item.event)).size).toBe(archetypes.length);
    expect(new Set(outcomes.map(item => item.reward)).size).toBe(archetypes.length);
    expect(new Set(outcomes.map(item => item.career)).size).toBe(archetypes.length);
  });

  it('keeps balanced personality neutral instead of silently collapsing to serene', () => {
    expect(personalityOutcome('balanced')).toEqual({
      dialogue: 'adaptive',
      event: 'open_choice',
      reward: 'flexible',
      career: null,
    });
  });
});
