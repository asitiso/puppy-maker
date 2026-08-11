import { describe, expect, it } from 'vitest';
import {
  gradeTacticalBattle,
  tacticalEncounterDefinitions,
  tacticalEncounterReward,
  updateTacticalRecord,
} from './tactical-encounters';

describe('tactical encounters', () => {
  it('defines deterministic three-enemy encounters with escalating recommended power', () => {
    expect(tacticalEncounterDefinitions.length).toBeGreaterThanOrEqual(3);
    expect(tacticalEncounterDefinitions.every(item => item.enemies.length === 3)).toBe(true);
    expect(tacticalEncounterDefinitions.map(item => item.recommendedPower)).toEqual([...tacticalEncounterDefinitions.map(item => item.recommendedPower)].sort((a,b) => a-b));
  });

  it('grades clean fast wins above slower or failed battles', () => {
    expect(gradeTacticalBattle({ result:'victory', rounds:3, survivingAllies:3, damageTaken:60 })).toBe('S');
    expect(gradeTacticalBattle({ result:'victory', rounds:5, survivingAllies:2, damageTaken:120 })).toBe('A');
    expect(gradeTacticalBattle({ result:'victory', rounds:8, survivingAllies:1, damageTaken:220 })).toBe('B');
    expect(gradeTacticalBattle({ result:'defeat', rounds:4, survivingAllies:0, damageTaken:300 })).toBe('C');
  });

  it('pays a larger first-clear reward than replay reward', () => {
    const first = tacticalEncounterReward('training_ground','A',true);
    const replay = tacticalEncounterReward('training_ground','A',false);
    expect(first.gold).toBeGreaterThan(replay.gold);
    expect(first.gems).toBeGreaterThanOrEqual(replay.gems);
  });

  it('keeps the best grade, fastest round count and clear count', () => {
    const first = updateTacticalRecord(undefined,{ grade:'B', rounds:7 });
    const second = updateTacticalRecord(first,{ grade:'S', rounds:4 });
    const third = updateTacticalRecord(second,{ grade:'A', rounds:5 });
    expect(third).toEqual({ grade:'S', bestRounds:4, clearCount:3 });
  });
});
