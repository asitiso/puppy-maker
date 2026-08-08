import { describe, expect, it } from 'vitest';
import { personalityArchetype, runaPreferences } from './runa-personality';

describe('Runa personality identity', () => {
  it('requires a five-point lead over the second tendency', () => {
    expect(personalityArchetype({ courage: 70, kindness: 64, curiosity: 30, calmness: 20 })).toBe('brave');
    expect(personalityArchetype({ courage: 70, kindness: 66, curiosity: 30, calmness: 20 })).toBe('balanced');
  });

  it('maps each dominant tendency to its archetype and ties to balanced', () => {
    expect(personalityArchetype({ courage: 20, kindness: 60, curiosity: 20, calmness: 20 })).toBe('gentle');
    expect(personalityArchetype({ courage: 20, kindness: 20, curiosity: 60, calmness: 20 })).toBe('curious');
    expect(personalityArchetype({ courage: 20, kindness: 20, curiosity: 20, calmness: 60 })).toBe('serene');
    expect(personalityArchetype({ courage: 50, kindness: 50, curiosity: 20, calmness: 10 })).toBe('balanced');
  });

  it('derives favorite activity and gift from personality and calling', () => {
    expect(runaPreferences('brave', 'vanguard')).toEqual({ favoriteActivity:'hunt', favoriteGift:'fox_charm' });
    expect(runaPreferences('serene', 'caretaker')).toEqual({ favoriteActivity:'rest', favoriteGift:'herb_tea' });
    expect(runaPreferences('curious', 'arcanist')).toEqual({ favoriteActivity:'magic', favoriteGift:'star_cookie' });
    expect(runaPreferences('curious', 'pathfinder')).toEqual({ favoriteActivity:'herb', favoriteGift:'star_cookie' });
    expect(runaPreferences('balanced', 'vanguard')).toEqual({ favoriteActivity:'hunt', favoriteGift:'fox_charm' });
    expect(runaPreferences('balanced', null)).toEqual({ favoriteActivity:'rest', favoriteGift:'herb_tea' });
  });
});
