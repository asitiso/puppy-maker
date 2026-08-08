import { describe, expect, it } from 'vitest';
import {
  explorationLevel,
  pickExplorationOutcome,
  type DiscoveryId,
} from './adventure';

describe('exploration progression rules', () => {
  it('maps exploration xp to stable level thresholds', () => {
    expect(explorationLevel(0)).toBe(1);
    expect(explorationLevel(2)).toBe(1);
    expect(explorationLevel(3)).toBe(2);
    expect(explorationLevel(6)).toBe(2);
    expect(explorationLevel(7)).toBe(3);
    expect(explorationLevel(11)).toBe(3);
    expect(explorationLevel(12)).toBe(4);
    expect(explorationLevel(17)).toBe(4);
    expect(explorationLevel(18)).toBe(5);
    expect(explorationLevel(999)).toBe(5);
  });

  it('selects each location common event at level one and can return no event', () => {
    expect(pickExplorationOutcome('forest', 0, [], 0)).toEqual({ event: 'glowing_tracks', discovery: null });
    expect(pickExplorationOutcome('village', 0, [], 0)).toEqual({ event: 'street_performance', discovery: null });
    expect(pickExplorationOutcome('lakeside', 0, [], 0)).toEqual({ event: 'silver_fish', discovery: null });
    expect(pickExplorationOutcome('forest', 0, [], 0.999)).toEqual({ event: null, discovery: null });
  });

  it('unlocks the advanced location event from level three', () => {
    expect(pickExplorationOutcome('forest', 7, [], 0.35)).toEqual({ event: 'ancient_tree', discovery: null });
    expect(pickExplorationOutcome('village', 7, [], 0.35)).toEqual({ event: 'wand_repair', discovery: null });
    expect(pickExplorationOutcome('lakeside', 7, [], 0.35)).toEqual({ event: 'quiet_breeze', discovery: null });
  });

  it('allows the first hidden discovery from level two', () => {
    expect(pickExplorationOutcome('forest', 3, [], 0.5)).toEqual({ event: null, discovery: 'moon_feather' });
    expect(pickExplorationOutcome('village', 3, [], 0.5)).toEqual({ event: null, discovery: 'tiny_bell' });
    expect(pickExplorationOutcome('lakeside', 3, [], 0.5)).toEqual({ event: null, discovery: 'glass_shell' });
  });

  it('allows the second hidden discovery from level four', () => {
    const alreadyFound: DiscoveryId[] = ['moon_feather'];
    expect(pickExplorationOutcome('forest', 12, alreadyFound, 0.5)).toEqual({ event: null, discovery: 'star_mushroom' });
  });

  it('never returns an already collected discovery', () => {
    const collected: DiscoveryId[] = ['moon_feather', 'star_mushroom'];
    const outcomes = [0.45, 0.5, 0.55, 0.6].map(roll => pickExplorationOutcome('forest', 18, collected, roll));
    expect(outcomes.every(outcome => outcome.discovery === null)).toBe(true);
  });
});
