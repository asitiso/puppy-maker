import { describe, expect, it } from 'vitest';
import { initialWorldState, worldReducer } from './world-state';
import { STORY_EVENTS } from './events';

// Section 36 of the design doc: HOME → SCHEDULE → TRAINING → DIALOGUE →
// RESULT → NEXT MONTH → HOME is the spine of the whole game and must
// never break, and world actions (explore/bond) need to keep working
// interleaved with it. Existing coverage only drove worldReducer
// directly with EXPLORE/BOND/NEXT_MONTH — this walks the actual screen
// state machine a real play session goes through, for all 12 months.
describe('full 12-month campaign loop regression', () => {
  it('completes hub→schedule→training→dialogue→(event)→result→next month, 12 times, with world actions interleaved, without crashing or producing invalid state', () => {
    let state = worldReducer(initialWorldState, { type: 'AUTO_SCHEDULE' });
    let guard = 0;
    while (state.screen !== 'ending') {
      guard++;
      if (guard > 500) throw new Error('loop did not reach the ending screen — likely stuck in a screen transition');
      switch (state.screen) {
        case 'hub':
          state = worldReducer(state, { type: 'EXPLORE', destinationId: 'forest_path', score: 700 });
          state = worldReducer(state, { type: 'BOND' });
          state = worldReducer(state, { type: 'GO', screen: 'schedule' });
          break;
        case 'schedule':
          state = worldReducer(state, { type: 'AUTO_SCHEDULE' });
          state = worldReducer(state, { type: 'GO', screen: 'training' });
          break;
        case 'training':
          state = worldReducer(state, { type: 'TRAIN', kind: 'attack', accuracy: 0.8 });
          state = worldReducer(state, { type: 'TRAIN', kind: 'dodge', accuracy: 0.6 });
          state = worldReducer(state, { type: 'FINISH_TRAINING' });
          break;
        case 'dialogue':
          state = worldReducer(state, { type: 'CHOOSE', choice: 'hug' });
          break;
        case 'event': {
          const event = STORY_EVENTS.find((e) => e.id === state.activeEventId);
          if (!event) throw new Error(`activeEventId ${state.activeEventId} did not resolve to a real STORY_EVENTS entry`);
          state = worldReducer(state, { type: 'EVENT_CHOICE', eventId: event.id, choiceId: event.choices[0].id });
          break;
        }
        case 'result':
          state = worldReducer(state, { type: 'NEXT_MONTH' });
          break;
        default:
          throw new Error(`unexpected screen reached: ${state.screen}`);
      }
      // Invariants that must hold after every single transition, not
      // just at month boundaries — a save is only as safe as its
      // weakest intermediate state.
      expect(state.gold).toBeGreaterThanOrEqual(0);
      expect(state.gems).toBeGreaterThanOrEqual(0);
      expect(state.stats.fatigue).toBeGreaterThanOrEqual(0);
      expect(state.stats.fatigue).toBeLessThanOrEqual(100);
      expect(state.stats.stress).toBeGreaterThanOrEqual(0);
      expect(state.stats.stress).toBeLessThanOrEqual(100);
      expect(state.monthlyExplorations).toBeGreaterThanOrEqual(0);
      expect(state.monthlyExplorations).toBeLessThanOrEqual(2);
    }
    expect(state.monthsCompleted).toBe(12);
    expect(state.resolvedEnding).toBeTruthy();
    expect(new Set(state.discoveredDestinations).size).toBe(state.discoveredDestinations.length);
  });
});
