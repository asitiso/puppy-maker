import type { FifthPathWinterOutcome } from './fifth-path-experience';

export type FifthPathJourneyStage = 'locked' | 'spring' | 'summer' | 'autumn' | 'winter' | 'true_ending';
export type FifthPathJourneyChoice = 'true_path' | 'follow_the_signal' | 'rewrite_the_pattern' | 'face_the_long_night' | 'carry_the_memory';

export type FifthPathJourneyState = {
  version: 1;
  stage: FifthPathJourneyStage;
  selected: boolean;
  choices: readonly FifthPathJourneyChoice[];
  winterOutcome: FifthPathWinterOutcome | null;
  completed: boolean;
};

export type FifthPathJourneyAction =
  | { type: 'UNLOCK' }
  | { type: 'CHOOSE'; choice: FifthPathJourneyChoice; outcome?: FifthPathWinterOutcome }
  | { type: 'RESET' };

export const initialFifthPathJourneyState: FifthPathJourneyState = {
  version: 1,
  stage: 'locked',
  selected: false,
  choices: [],
  winterOutcome: null,
  completed: false,
};

const journeyOrder: readonly FifthPathJourneyChoice[] = [
  'true_path',
  'follow_the_signal',
  'rewrite_the_pattern',
  'face_the_long_night',
  'carry_the_memory',
];

const expectedChoice: Partial<Record<FifthPathJourneyStage, FifthPathJourneyChoice>> = {
  spring: 'true_path',
  summer: 'follow_the_signal',
  autumn: 'rewrite_the_pattern',
  winter: 'face_the_long_night',
  true_ending: 'carry_the_memory',
};

const nextStage: Partial<Record<FifthPathJourneyStage, FifthPathJourneyStage>> = {
  spring: 'summer', summer: 'autumn', autumn: 'winter', winter: 'true_ending',
};

const expectedStageByChoiceCount: readonly FifthPathJourneyStage[] = [
  'spring',
  'summer',
  'autumn',
  'winter',
  'true_ending',
  'true_ending',
];

export function fifthPathJourneyReducer(state: FifthPathJourneyState, action: FifthPathJourneyAction): FifthPathJourneyState {
  if (action.type === 'RESET') return initialFifthPathJourneyState;
  if (action.type === 'UNLOCK') return state.stage === 'locked' ? { ...state, stage: 'spring' } : state;
  if (state.completed || expectedChoice[state.stage] !== action.choice || state.choices.includes(action.choice)) return state;

  if (state.stage === 'winter' && !action.outcome) return state;
  const choices = [...state.choices, action.choice];
  if (state.stage === 'true_ending') return { ...state, choices, completed: true };

  return {
    ...state,
    selected: state.selected || action.choice === 'true_path',
    stage: nextStage[state.stage] ?? state.stage,
    choices,
    winterOutcome: state.stage === 'winter' ? action.outcome ?? null : state.winterOutcome,
  };
}

const choiceAliases: Readonly<Record<string, FifthPathJourneyChoice>> = {
  '이 가능성을 선택한다': 'true_path',
  '신호를 따라간다': 'follow_the_signal',
  '정답을 반복하지 않고 새로운 합의를 만든다': 'rewrite_the_pattern',
  '긴 밤과 마주한다': 'face_the_long_night',
  '기억을 다음 봄으로 가져간다': 'carry_the_memory',
};

export function resolveFifthPathJourneyChoice(label: string): FifthPathJourneyChoice | null {
  return choiceAliases[label.trim()] ?? null;
}

export function fifthPathChoiceForStage(stage: FifthPathJourneyStage): FifthPathJourneyChoice | null {
  return expectedChoice[stage] ?? null;
}

export function serializeFifthPathJourney(state: FifthPathJourneyState): string {
  return JSON.stringify(state);
}

function hasCanonicalChoicePrefix(choices: readonly FifthPathJourneyChoice[]): boolean {
  return choices.every((choice, index) => journeyOrder[index] === choice);
}

export function isFifthPathJourneyStateConsistent(state: FifthPathJourneyState): boolean {
  if (!hasCanonicalChoicePrefix(state.choices)) return false;
  if (state.stage === 'locked') {
    return state.choices.length === 0 && !state.selected && state.winterOutcome === null && !state.completed;
  }

  if (state.stage !== expectedStageByChoiceCount[state.choices.length]) return false;
  if (state.selected !== state.choices.includes('true_path')) return false;

  const facedWinter = state.choices.includes('face_the_long_night');
  if (facedWinter !== (state.winterOutcome !== null)) return false;
  if (state.completed !== state.choices.includes('carry_the_memory')) return false;
  return true;
}

export function parseFifthPathJourney(raw: string | null | undefined): FifthPathJourneyState {
  if (!raw) return initialFifthPathJourneyState;
  try {
    const value = JSON.parse(raw) as Partial<FifthPathJourneyState>;
    const stages: readonly FifthPathJourneyStage[] = ['locked','spring','summer','autumn','winter','true_ending'];
    if (value.version !== 1 || !stages.includes(value.stage as FifthPathJourneyStage) || !Array.isArray(value.choices) || value.choices.some(choice => !journeyOrder.includes(choice))) return initialFifthPathJourneyState;
    const outcome = value.winterOutcome;
    if (outcome !== null && outcome !== 'victory' && outcome !== 'costly_victory' && outcome !== 'defeat') return initialFifthPathJourneyState;
    const parsed: FifthPathJourneyState = {
      version: 1,
      stage: value.stage as FifthPathJourneyStage,
      selected: Boolean(value.selected),
      choices: value.choices as FifthPathJourneyChoice[],
      winterOutcome: outcome ?? null,
      completed: Boolean(value.completed),
    };
    return isFifthPathJourneyStateConsistent(parsed) ? parsed : initialFifthPathJourneyState;
  } catch {
    return initialFifthPathJourneyState;
  }
}
