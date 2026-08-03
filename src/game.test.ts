import { describe, expect, it } from 'vitest';
import { applyActivity, applyDialogueChoice, initialState, reducer, trainingGrade } from './game';

describe('game engine', () => {
  it('applies activity effects without exceeding stat bounds', () => {
    const next = applyActivity({ ...initialState.stats, stress: 5, fatigue: 4 }, 'rest');
    expect(next.stress).toBe(0);
    expect(next.fatigue).toBe(0);
    expect(next.affection).toBe(74);
  });

  it('calculates training grades', () => {
    expect(trainingGrade(920)).toBe('S');
    expect(trainingGrade(700)).toBe('A');
    expect(trainingGrade(450)).toBe('B');
    expect(trainingGrade(100)).toBe('C');
  });

  it('applies dialogue choice and advances to result', () => {
    const next = applyDialogueChoice(initialState, 'hug');
    expect(next.stats.affection).toBe(82);
    expect(next.screen).toBe('result');
  });

  it('advances month and returns to hub', () => {
    const next = reducer({ ...initialState, screen: 'result' }, { type: 'NEXT_MONTH' });
    expect(next.month).toBe(5);
    expect(next.screen).toBe('hub');
    expect(next.gold).toBe(5350);
  });
});