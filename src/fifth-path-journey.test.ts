import { describe, expect, it } from 'vitest';
import {
  fifthPathJourneyReducer,
  initialFifthPathJourneyState,
  isFifthPathJourneyStateConsistent,
  parseFifthPathJourney,
  resolveFifthPathJourneyChoice,
  serializeFifthPathJourney,
} from './fifth-path-journey';

describe('fifth path journey', () => {
  it('runs the complete canonical journey in order', () => {
    let state = fifthPathJourneyReducer(initialFifthPathJourneyState, { type: 'UNLOCK' });
    state = fifthPathJourneyReducer(state, { type: 'CHOOSE', choice: 'true_path' });
    expect(state.stage).toBe('summer');
    expect(state.selected).toBe(true);

    state = fifthPathJourneyReducer(state, { type: 'CHOOSE', choice: 'follow_the_signal' });
    expect(state.stage).toBe('autumn');
    state = fifthPathJourneyReducer(state, { type: 'CHOOSE', choice: 'rewrite_the_pattern' });
    expect(state.stage).toBe('winter');
    state = fifthPathJourneyReducer(state, { type: 'CHOOSE', choice: 'face_the_long_night', outcome: 'costly_victory' });
    expect(state.stage).toBe('true_ending');
    expect(state.winterOutcome).toBe('costly_victory');
    state = fifthPathJourneyReducer(state, { type: 'CHOOSE', choice: 'carry_the_memory' });
    expect(state.completed).toBe(true);
    expect(state.choices).toHaveLength(5);
    expect(isFifthPathJourneyStateConsistent(state)).toBe(true);
  });

  it('rejects skipping, duplicate choices and winter without an outcome', () => {
    const unlocked = fifthPathJourneyReducer(initialFifthPathJourneyState, { type: 'UNLOCK' });
    expect(fifthPathJourneyReducer(unlocked, { type: 'CHOOSE', choice: 'rewrite_the_pattern' })).toBe(unlocked);
    const summer = fifthPathJourneyReducer(unlocked, { type: 'CHOOSE', choice: 'true_path' });
    expect(fifthPathJourneyReducer(summer, { type: 'CHOOSE', choice: 'true_path' })).toBe(summer);
    const autumn = fifthPathJourneyReducer(summer, { type: 'CHOOSE', choice: 'follow_the_signal' });
    const winter = fifthPathJourneyReducer(autumn, { type: 'CHOOSE', choice: 'rewrite_the_pattern' });
    expect(fifthPathJourneyReducer(winter, { type: 'CHOOSE', choice: 'face_the_long_night' })).toBe(winter);
  });

  it('round trips persisted progress and safely rejects corrupt saves', () => {
    const spring = fifthPathJourneyReducer(initialFifthPathJourneyState, { type: 'UNLOCK' });
    const summer = fifthPathJourneyReducer(spring, { type: 'CHOOSE', choice: 'true_path' });
    expect(parseFifthPathJourney(serializeFifthPathJourney(summer))).toEqual(summer);
    expect(parseFifthPathJourney('{broken')).toEqual(initialFifthPathJourneyState);
    expect(parseFifthPathJourney(JSON.stringify({ version: 99, stage: 'summer', choices: [] }))).toEqual(initialFifthPathJourneyState);
  });

  it('rejects syntactically valid saves whose stage and history disagree', () => {
    const impossible = {
      version: 1,
      stage: 'autumn',
      selected: true,
      choices: ['true_path'],
      winterOutcome: null,
      completed: false,
    };
    expect(parseFifthPathJourney(JSON.stringify(impossible))).toEqual(initialFifthPathJourneyState);
  });

  it('rejects reordered, duplicated and fabricated choice histories', () => {
    const base = {
      version: 1,
      stage: 'autumn',
      selected: true,
      winterOutcome: null,
      completed: false,
    };
    expect(parseFifthPathJourney(JSON.stringify({ ...base, choices: ['follow_the_signal', 'true_path'] }))).toEqual(initialFifthPathJourneyState);
    expect(parseFifthPathJourney(JSON.stringify({ ...base, choices: ['true_path', 'true_path'] }))).toEqual(initialFifthPathJourneyState);
    expect(parseFifthPathJourney(JSON.stringify({ ...base, choices: ['true_path', 'made_up'] }))).toEqual(initialFifthPathJourneyState);
  });

  it('rejects saves that claim selection, winter or completion before earning them', () => {
    const spring = { version: 1, stage: 'spring', selected: true, choices: [], winterOutcome: null, completed: false };
    const summerWithOutcome = { version: 1, stage: 'summer', selected: true, choices: ['true_path'], winterOutcome: 'victory', completed: false };
    const summerCompleted = { version: 1, stage: 'summer', selected: true, choices: ['true_path'], winterOutcome: null, completed: true };
    expect(parseFifthPathJourney(JSON.stringify(spring))).toEqual(initialFifthPathJourneyState);
    expect(parseFifthPathJourney(JSON.stringify(summerWithOutcome))).toEqual(initialFifthPathJourneyState);
    expect(parseFifthPathJourney(JSON.stringify(summerCompleted))).toEqual(initialFifthPathJourneyState);
  });

  it('accepts every reducer-produced checkpoint as a valid persisted state', () => {
    let state = fifthPathJourneyReducer(initialFifthPathJourneyState, { type: 'UNLOCK' });
    const actions = [
      { type: 'CHOOSE' as const, choice: 'true_path' as const },
      { type: 'CHOOSE' as const, choice: 'follow_the_signal' as const },
      { type: 'CHOOSE' as const, choice: 'rewrite_the_pattern' as const },
      { type: 'CHOOSE' as const, choice: 'face_the_long_night' as const, outcome: 'victory' as const },
      { type: 'CHOOSE' as const, choice: 'carry_the_memory' as const },
    ];
    expect(isFifthPathJourneyStateConsistent(state)).toBe(true);
    for (const action of actions) {
      state = fifthPathJourneyReducer(state, action);
      expect(isFifthPathJourneyStateConsistent(state)).toBe(true);
      expect(parseFifthPathJourney(serializeFifthPathJourney(state))).toEqual(state);
    }
  });

  it('maps VN labels to canonical actions', () => {
    expect(resolveFifthPathJourneyChoice('  이 가능성을 선택한다 ')).toBe('true_path');
    expect(resolveFifthPathJourneyChoice('정답을 반복하지 않고 새로운 합의를 만든다')).toBe('rewrite_the_pattern');
    expect(resolveFifthPathJourneyChoice('알 수 없는 선택')).toBeNull();
  });
});
