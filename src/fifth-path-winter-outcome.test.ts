import { describe, expect, it } from 'vitest';
import { deriveFifthPathWinterOutcome } from './fifth-path-winter-outcome';

describe('deriveFifthPathWinterOutcome', () => {
  it('preserves tactical defeat regardless of survivor metadata', () => {
    expect(deriveFifthPathWinterOutcome({ result: 'defeat', survivingAllies: 3, damageTaken: 0 })).toBe('defeat');
  });

  it('returns a clean victory when the party survives below the damage budget', () => {
    expect(deriveFifthPathWinterOutcome({ result: 'victory', survivingAllies: 2, damageTaken: 99 })).toBe('victory');
  });

  it('marks a victory costly when only one ally survives', () => {
    expect(deriveFifthPathWinterOutcome({ result: 'victory', survivingAllies: 1, damageTaken: 10 })).toBe('costly_victory');
  });

  it('marks a victory costly at the damage threshold', () => {
    expect(deriveFifthPathWinterOutcome({ result: 'victory', survivingAllies: 3, damageTaken: 100 })).toBe('costly_victory');
  });

  it('supports encounter-specific damage budgets', () => {
    expect(deriveFifthPathWinterOutcome({ result: 'victory', survivingAllies: 3, damageTaken: 40 }, 40)).toBe('costly_victory');
    expect(deriveFifthPathWinterOutcome({ result: 'victory', survivingAllies: 3, damageTaken: 39 }, 40)).toBe('victory');
  });

  it('fails conservatively for invalid battle telemetry', () => {
    expect(deriveFifthPathWinterOutcome({ result: 'victory', survivingAllies: Number.NaN, damageTaken: 0 })).toBe('costly_victory');
    expect(deriveFifthPathWinterOutcome({ result: 'victory', survivingAllies: 3, damageTaken: Number.NaN })).toBe('costly_victory');
  });
});
