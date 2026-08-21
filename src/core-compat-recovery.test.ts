import { describe, expect, it } from 'vitest';
import * as Core from './game-core';
import { initialState, reducer, type GameState } from './game';
import type { GameState as BaseGameState } from './game-base';
import { parseSavedGame, serializeSavedGame } from './save-schema';

const acceptsBaseState = (state: BaseGameState) => state;

describe('core public API compatibility recovery', () => {
  it('keeps the core engine public contract available', () => {
    expect(typeof Core.applyDialogueChoice).toBe('function');
    expect(typeof Core.deriveCondition).toBe('function');
    expect(typeof Core.pickRandomEvent).toBe('function');
    expect(typeof Core.resultQuality).toBe('function');
    expect(typeof Core.unlockedSkills).toBe('function');
    expect(typeof Core.hydrateGameState).toBe('function');
    expect(typeof Core.reducer).toBe('function');
  });

  it('preserves event and ending screens through core hydration', () => {
    expect(Core.hydrateGameState({ ...Core.initialState, screen: 'event' }).screen).toBe('event');
    expect(Core.hydrateGameState({ ...Core.initialState, screen: 'ending' }).screen).toBe('ending');
  });

  it('keeps the public game state assignable to the base game contract', () => {
    const state: GameState = initialState;
    expect(acceptsBaseState(state).screen).toBe('hub');
  });

  it('round-trips extended screens through current and legacy save hydration', () => {
    const eventState: GameState = { ...initialState, screen: 'event' };
    expect(parseSavedGame(serializeSavedGame(eventState)).screen).toBe('event');

    const legacyEnding = JSON.stringify({ ...initialState, screen: 'ending' });
    expect(parseSavedGame(legacyEnding).screen).toBe('ending');
  });

  it('survives the basic monthly loop, reload, and hub re-entry', () => {
    let state: GameState = reducer(initialState, { type: 'GO', screen: 'schedule' });
    state = reducer(state, { type: 'GO', screen: 'training' });
    state = reducer(state, { type: 'FINISH_TRAINING', eventRoll: 0.999999 });
    state = reducer(state, { type: 'CHOOSE', choice: 'hug' });
    state = reducer(state, { type: 'NEXT_MONTH' });

    expect(state.screen).toBe('hub');
    const reloaded = parseSavedGame(serializeSavedGame(state));
    expect(reloaded.screen).toBe('hub');
    expect(reloaded.month).toBe(state.month);
    expect(reloaded.memories).toEqual(state.memories);
  });
});
