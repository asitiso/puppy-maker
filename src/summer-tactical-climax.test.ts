import { describe, expect, it } from 'vitest';
import {
  getSummerGuardianFestivalTacticalClimax,
  summerGuardianFestivalTacticalClimaxes,
} from './summer-tactical-climax';

describe('V3 Summer Guardian Festival Tactical climaxes', () => {
  it('defines four distinct campaign climax scenarios on existing Tactical contracts', () => {
    expect(summerGuardianFestivalTacticalClimaxes).toHaveLength(4);
    expect(summerGuardianFestivalTacticalClimaxes.map(entry => entry.campaign)).toEqual([
      'caretaker',
      'pathfinder',
      'vanguard',
      'arcanist',
    ]);

    const caretaker = getSummerGuardianFestivalTacticalClimax('caretaker');
    expect(caretaker).toMatchObject({
      campaign: 'caretaker',
      stageId: 'forest_guardian',
      objective: { type: 'survive', rounds: 3 },
      failForward: true,
    });
    expect(caretaker?.modifiers).toEqual([
      { campaign: 'caretaker', kind: 'rescue', unitId: 'festival-civilian' },
      { campaign: 'caretaker', kind: 'survive', rounds: 3 },
    ]);

    const pathfinder = getSummerGuardianFestivalTacticalClimax('pathfinder');
    expect(pathfinder).toMatchObject({
      campaign: 'pathfinder',
      stageId: 'city_gallery',
      objective: { type: 'escape', afterRounds: 2 },
      failForward: true,
    });
    expect(pathfinder?.modifiers).toEqual([
      { campaign: 'pathfinder', kind: 'scout', revealCount: 2 },
      { campaign: 'pathfinder', kind: 'turn-limit', maxRounds: 5 },
      { campaign: 'pathfinder', kind: 'escape', afterRounds: 2 },
    ]);

    const vanguard = getSummerGuardianFestivalTacticalClimax('vanguard');
    expect(vanguard).toMatchObject({
      campaign: 'vanguard',
      stageId: 'city_core',
      objective: { type: 'target-elimination', targetId: 'city_core-enemy-1' },
      failForward: true,
    });
    expect(vanguard?.modifiers).toEqual([
      { campaign: 'vanguard', kind: 'elite', levelBonus: 2 },
      { campaign: 'vanguard', kind: 'chained-battle', chainId: 'guardian-grand-tournament', index: 3, total: 3 },
    ]);

    const arcanist = getSummerGuardianFestivalTacticalClimax('arcanist');
    expect(arcanist).toMatchObject({
      campaign: 'arcanist',
      stageId: 'lake_tempest',
      objective: { type: 'standard' },
      failForward: true,
    });
    expect(arcanist?.modifiers).toEqual([
      { campaign: 'arcanist', kind: 'relic-resonance', relicId: 'guardian-festival-relic' },
      { campaign: 'arcanist', kind: 'status-amplify', statusId: 'break', multiplier: 1.5 },
      { campaign: 'arcanist', kind: 'rule-shift', ruleId: 'festival-resonance' },
    ]);
  });

  it('compiles every climax through the existing Tactical scenario adapter', () => {
    for (const climax of summerGuardianFestivalTacticalClimaxes) {
      expect(climax.id).toBe(`summer-guardian-festival:${climax.campaign}`);
      expect(climax.battleNode.stageId).toBe(climax.stageId);
      expect(climax.battleNode.enemyArchetypes).toHaveLength(3);
      expect(climax.modifiers.every(modifier => modifier.campaign === climax.campaign)).toBe(true);
    }
  });

  it('rejects malformed or unknown campaign lookup without inventing a fallback', () => {
    expect(getSummerGuardianFestivalTacticalClimax(null)).toBeNull();
    expect(getSummerGuardianFestivalTacticalClimax('unknown')).toBeNull();
    expect(getSummerGuardianFestivalTacticalClimax(' caretaker ')).toBeNull();
  });
});
