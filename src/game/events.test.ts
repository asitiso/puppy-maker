import { describe, expect, it } from 'vitest';
import { initialState } from '../game';
import { applyEventChoice, eligibleEvents, selectMonthlyEvent } from './events';

describe('story events', () => {
  it('selects a deterministic eligible event for the same state', () => {
    const first=selectMonthlyEvent(initialState);
    const second=selectMonthlyEvent(initialState);
    expect(first?.id).toBe(second?.id);
    expect(eligibleEvents(initialState).length).toBeGreaterThan(0);
  });

  it('applies bounded event effects and records the event memory once', () => {
    const event=selectMonthlyEvent(initialState)!;
    const once=applyEventChoice(initialState,event.id,event.choices[0].id);
    const twice=applyEventChoice(once,event.id,event.choices[0].id);
    expect(Object.values(once.stats).every(value=>value>=0&&value<=100)).toBe(true);
    expect(Object.values(once.personality).every(value=>value>=0&&value<=100)).toBe(true);
    expect(once.eventHistory.filter(id=>id===event.id)).toHaveLength(1);
    expect(twice.eventHistory.filter(id=>id===event.id)).toHaveLength(1);
  });
});
