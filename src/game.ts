export type Screen = 'hub' | 'schedule' | 'training' | 'dialogue' | 'result';
export type ActivityId = 'hunt' | 'magic' | 'rest' | 'herb';

export interface Stats {
  strength: number;
  intelligence: number;
  magic: number;
  morality: number;
  affection: number;
  stress: number;
  fatigue: number;
}

export interface GameState {
  screen: Screen;
  year: number;
  month: number;
  week: number;
  gold: number;
  gems: number;
  schedule: ActivityId[];
  stats: Stats;
  combo: number;
  trainingScore: number;
  lastChoice?: string;
}

export const activities: Record<ActivityId, { name: string; icon: string; effect: Partial<Stats> }> = {
  hunt: { name: '사냥 훈련', icon: 'sword', effect: { strength: 6, fatigue: 9, stress: 4 } },
  magic: { name: '마법 수업', icon: 'spark', effect: { magic: 7, intelligence: 3, fatigue: 7 } },
  rest: { name: '포근한 휴식', icon: 'moon', effect: { stress: -16, fatigue: -20, affection: 2 } },
  herb: { name: '약초 채집', icon: 'leaf', effect: { intelligence: 2, fatigue: 5 } }
};

export const initialState: GameState = {
  screen: 'hub', year: 1, month: 4, week: 2, gold: 5000, gems: 220,
  schedule: ['hunt', 'magic', 'rest', 'herb'], combo: 0, trainingScore: 0,
  stats: { strength: 28, intelligence: 34, magic: 42, morality: 61, affection: 72, stress: 24, fatigue: 18 }
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function applyActivity(stats: Stats, id: ActivityId): Stats {
  const next = { ...stats };
  for (const [key, value] of Object.entries(activities[id].effect)) {
    const statKey = key as keyof Stats;
    next[statKey] = clamp(next[statKey] + (value ?? 0));
  }
  return next;
}

export function trainingGrade(score: number): 'S' | 'A' | 'B' | 'C' {
  if (score >= 900) return 'S';
  if (score >= 650) return 'A';
  if (score >= 400) return 'B';
  return 'C';
}

export function applyDialogueChoice(state: GameState, choice: 'hug' | 'scold' | 'snack'): GameState {
  const stats = { ...state.stats };
  if (choice === 'hug') { stats.stress = clamp(stats.stress - 20); stats.affection = clamp(stats.affection + 10); stats.morality = clamp(stats.morality + 2); }
  if (choice === 'scold') { stats.morality = clamp(stats.morality + 5); stats.stress = clamp(stats.stress + 15); }
  if (choice === 'snack') { stats.stress = clamp(stats.stress - 30); stats.affection = clamp(stats.affection + 4); }
  return { ...state, stats, gold: choice === 'snack' ? Math.max(0, state.gold - 100) : state.gold, lastChoice: choice, screen: 'result' };
}

export type Action =
  | { type: 'GO'; screen: Screen }
  | { type: 'SET_SCHEDULE'; index: number; activity: ActivityId }
  | { type: 'AUTO_SCHEDULE' }
  | { type: 'TRAIN'; kind: 'attack' | 'dodge' | 'charge'; accuracy: number }
  | { type: 'FINISH_TRAINING' }
  | { type: 'CHOOSE'; choice: 'hug' | 'scold' | 'snack' }
  | { type: 'NEXT_MONTH' }
  | { type: 'RESET' };

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'GO': return { ...state, screen: action.screen };
    case 'SET_SCHEDULE': {
      const schedule = [...state.schedule]; schedule[action.index] = action.activity; return { ...state, schedule };
    }
    case 'AUTO_SCHEDULE': return { ...state, schedule: ['hunt', 'magic', 'rest', 'herb'] };
    case 'TRAIN': {
      const gain = Math.round(action.accuracy * (action.kind === 'attack' ? 140 : action.kind === 'dodge' ? 110 : 80));
      return { ...state, combo: action.accuracy > .55 ? state.combo + 1 : 0, trainingScore: state.trainingScore + gain };
    }
    case 'FINISH_TRAINING': {
      let stats = { ...state.stats };
      state.schedule.forEach(id => { stats = applyActivity(stats, id); });
      const bonus = trainingGrade(state.trainingScore) === 'S' ? 8 : trainingGrade(state.trainingScore) === 'A' ? 5 : 2;
      stats.strength = clamp(stats.strength + bonus);
      return { ...state, stats, screen: 'dialogue' };
    }
    case 'CHOOSE': return applyDialogueChoice(state, action.choice);
    case 'NEXT_MONTH': {
      const month = state.month === 12 ? 1 : state.month + 1;
      const year = state.month === 12 ? state.year + 1 : state.year;
      return { ...state, month, year, week: 1, screen: 'hub', combo: 0, trainingScore: 0, gold: state.gold + 350 };
    }
    case 'RESET': return initialState;
    default: return state;
  }
}