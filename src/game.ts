export type Screen = 'hub' | 'schedule' | 'training' | 'dialogue' | 'result';
export type ActivityId = 'hunt' | 'magic' | 'rest' | 'herb';
export type Condition = 'energetic' | 'normal' | 'focused' | 'tired';
export type TrainingQuality = 'NORMAL' | 'GOOD' | 'GREAT' | 'PERFECT';
export type PersonalityKey = 'courage' | 'kindness' | 'curiosity' | 'calmness';
export type MemoryId = 'first_training' | 'first_perfect' | 'first_hug' | 'first_snack' | 'first_s_grade' | 'first_month_complete';

export interface Stats {
  strength: number;
  intelligence: number;
  magic: number;
  morality: number;
  affection: number;
  stress: number;
  fatigue: number;
}

export type Personality = Record<PersonalityKey, number>;
export type Mastery = Record<ActivityId, { xp: number }>;
export interface MemoryEntry { id: MemoryId; year: number; month: number }
export interface GrowthReport {
  quality: TrainingQuality;
  grade: 'S' | 'A' | 'B' | 'C';
  mostImprovedStat: keyof Stats;
  masteryGains: Record<ActivityId, number>;
  personalityChanges: Partial<Record<PersonalityKey, number>>;
  newMemory?: MemoryId;
  nextCondition: Condition;
  goldReward: number;
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
  condition: Condition;
  mastery: Mastery;
  personality: Personality;
  memories: MemoryEntry[];
  lastGrowthReport: GrowthReport | null;
  pendingGrowth?: {
    quality: TrainingQuality;
    grade: 'S' | 'A' | 'B' | 'C';
    statsBefore: Stats;
    masteryGains: Record<ActivityId, number>;
    personalityBefore: Personality;
    memoryCountBefore: number;
  };
}

export const activities: Record<ActivityId, { name: string; icon: string; effect: Partial<Stats> }> = {
  hunt: { name: '사냥 훈련', icon: 'sword', effect: { strength: 6, fatigue: 9, stress: 4 } },
  magic: { name: '마법 수업', icon: 'spark', effect: { magic: 7, intelligence: 3, fatigue: 7 } },
  rest: { name: '포근한 휴식', icon: 'moon', effect: { stress: -16, fatigue: -20, affection: 2 } },
  herb: { name: '약초 채집', icon: 'leaf', effect: { intelligence: 2, fatigue: 5 } }
};

const emptyMastery = (): Mastery => ({ hunt: { xp: 0 }, magic: { xp: 0 }, rest: { xp: 0 }, herb: { xp: 0 } });
const defaultPersonality = (): Personality => ({ courage: 50, kindness: 50, curiosity: 50, calmness: 50 });

export const initialState: GameState = {
  screen: 'hub', year: 1, month: 4, week: 2, gold: 5000, gems: 220,
  schedule: ['hunt', 'magic', 'rest', 'herb'], combo: 0, trainingScore: 0,
  stats: { strength: 28, intelligence: 34, magic: 42, morality: 61, affection: 72, stress: 24, fatigue: 18 },
  condition: 'normal', mastery: emptyMastery(), personality: defaultPersonality(), memories: [], lastGrowthReport: null,
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));
const validActivities: ActivityId[] = ['hunt', 'magic', 'rest', 'herb'];
const validConditions: Condition[] = ['energetic', 'normal', 'focused', 'tired'];

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

export function trainingQuality(score: number): TrainingQuality {
  if (score >= 900) return 'PERFECT';
  if (score >= 650) return 'GREAT';
  if (score >= 400) return 'GOOD';
  return 'NORMAL';
}

export function conditionScoreMultiplier(condition: Condition): number {
  if (condition === 'energetic') return 1.1;
  if (condition === 'focused') return 1.05;
  if (condition === 'tired') return 0.9;
  return 1;
}

export function masteryLevel(xp: number): number {
  if (xp >= 18) return 5;
  if (xp >= 12) return 4;
  if (xp >= 7) return 3;
  if (xp >= 3) return 2;
  return 1;
}

export function deriveCondition(stats: Stats): Condition {
  if (stats.fatigue >= 70) return 'tired';
  if (stats.stress <= 15 && stats.fatigue <= 25) return 'focused';
  if (stats.fatigue <= 15 && stats.stress <= 30) return 'energetic';
  return 'normal';
}

function addMemory(state: GameState, id: MemoryId): GameState {
  if (state.memories.some(memory => memory.id === id)) return state;
  return { ...state, memories: [...state.memories, { id, year: state.year, month: state.month }] };
}

function personalityDeltaForActivity(id: ActivityId): Partial<Personality> {
  if (id === 'hunt') return { courage: 2 };
  if (id === 'magic') return { curiosity: 2 };
  if (id === 'rest') return { calmness: 2 };
  return { curiosity: 1, calmness: 1 };
}

function applyPersonalityDelta(personality: Personality, delta: Partial<Personality>): Personality {
  const next = { ...personality };
  (Object.keys(delta) as PersonalityKey[]).forEach(key => { next[key] = clamp(next[key] + (delta[key] ?? 0)); });
  return next;
}

function mostImprovedStat(before: Stats, after: Stats): keyof Stats {
  return (Object.keys(after) as (keyof Stats)[]).reduce((best, key) => after[key] - before[key] > after[best] - before[best] ? key : best, 'strength');
}

function safeNumber(value: unknown, fallback: number): number { return typeof value === 'number' && Number.isFinite(value) ? value : fallback; }

export function hydrateGameState(raw: string | null): GameState {
  if (!raw) return initialState;
  try {
    const parsed = JSON.parse(raw) as Partial<GameState>;
    if (!parsed || typeof parsed !== 'object') return initialState;
    const stats = { ...initialState.stats };
    if (parsed.stats && typeof parsed.stats === 'object') {
      (Object.keys(stats) as (keyof Stats)[]).forEach(key => { stats[key] = clamp(safeNumber(parsed.stats?.[key], stats[key])); });
    }
    const mastery = emptyMastery();
    if (parsed.mastery && typeof parsed.mastery === 'object') validActivities.forEach(id => {
      const xp = parsed.mastery?.[id]?.xp;
      mastery[id] = { xp: Math.max(0, safeNumber(xp, 0)) };
    });
    const personality = defaultPersonality();
    if (parsed.personality && typeof parsed.personality === 'object') (Object.keys(personality) as PersonalityKey[]).forEach(key => {
      personality[key] = clamp(safeNumber(parsed.personality?.[key], 50));
    });
    const memories = Array.isArray(parsed.memories) ? parsed.memories.filter((entry): entry is MemoryEntry => Boolean(entry && typeof entry === 'object' && ['first_training','first_perfect','first_hug','first_snack','first_s_grade','first_month_complete'].includes((entry as MemoryEntry).id))) : [];
    const schedule = Array.isArray(parsed.schedule) && parsed.schedule.length === 4 && parsed.schedule.every(id => validActivities.includes(id)) ? parsed.schedule : initialState.schedule;
    return {
      ...initialState, ...parsed,
      screen: ['hub','schedule','training','dialogue','result'].includes(parsed.screen ?? '') ? parsed.screen! : initialState.screen,
      year: safeNumber(parsed.year, initialState.year), month: safeNumber(parsed.month, initialState.month), week: safeNumber(parsed.week, initialState.week),
      gold: Math.max(0, safeNumber(parsed.gold, initialState.gold)), gems: Math.max(0, safeNumber(parsed.gems, initialState.gems)),
      combo: Math.max(0, safeNumber(parsed.combo, 0)), trainingScore: Math.max(0, safeNumber(parsed.trainingScore, 0)),
      stats, schedule, mastery, personality, memories,
      condition: validConditions.includes(parsed.condition as Condition) ? parsed.condition as Condition : 'normal',
      lastGrowthReport: parsed.lastGrowthReport && typeof parsed.lastGrowthReport === 'object' ? parsed.lastGrowthReport : null,
    };
  } catch { return initialState; }
}

export function applyDialogueChoice(state: GameState, choice: 'hug' | 'scold' | 'snack'): GameState {
  const stats = { ...state.stats };
  if (choice === 'hug') { stats.stress = clamp(stats.stress - 20); stats.affection = clamp(stats.affection + 10); stats.morality = clamp(stats.morality + 2); }
  if (choice === 'scold') { stats.morality = clamp(stats.morality + 5); stats.stress = clamp(stats.stress + 15); }
  if (choice === 'snack') { stats.stress = clamp(stats.stress - 30); stats.affection = clamp(stats.affection + 4); }
  const dialogueDelta: Partial<Personality> = choice === 'hug' ? { kindness: 4 } : choice === 'snack' ? { kindness: 2 } : { courage: 2, calmness: -1 };
  let next: GameState = { ...state, stats, personality: applyPersonalityDelta(state.personality, dialogueDelta), gold: choice === 'snack' ? Math.max(0, state.gold - 100) : state.gold, lastChoice: choice, screen: 'result' };
  if (choice === 'hug') next = addMemory(next, 'first_hug');
  if (choice === 'snack') next = addMemory(next, 'first_snack');
  const pending = state.pendingGrowth;
  if (pending) {
    const newMemory = next.memories.slice(pending.memoryCountBefore)[0]?.id;
    const personalityChanges: Partial<Record<PersonalityKey, number>> = {};
    (Object.keys(next.personality) as PersonalityKey[]).forEach(key => {
      const delta = next.personality[key] - pending.personalityBefore[key];
      if (delta) personalityChanges[key] = delta;
    });
    next = { ...next, lastGrowthReport: { quality: pending.quality, grade: pending.grade, mostImprovedStat: mostImprovedStat(pending.statsBefore, next.stats), masteryGains: pending.masteryGains, personalityChanges, newMemory, nextCondition: deriveCondition(next.stats), goldReward: 350 } };
  }
  return next;
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
    case 'SET_SCHEDULE': { const schedule = [...state.schedule]; schedule[action.index] = action.activity; return { ...state, schedule }; }
    case 'AUTO_SCHEDULE': return { ...state, schedule: ['hunt', 'magic', 'rest', 'herb'] };
    case 'TRAIN': {
      const base = action.accuracy * (action.kind === 'attack' ? 140 : action.kind === 'dodge' ? 110 : 80);
      const gain = Math.round(base * conditionScoreMultiplier(state.condition));
      return { ...state, combo: action.accuracy > .55 ? state.combo + 1 : 0, trainingScore: state.trainingScore + gain };
    }
    case 'FINISH_TRAINING': {
      const statsBefore = { ...state.stats };
      let stats = { ...state.stats };
      let personality = { ...state.personality };
      const mastery = { ...state.mastery, hunt: { ...state.mastery.hunt }, magic: { ...state.mastery.magic }, rest: { ...state.mastery.rest }, herb: { ...state.mastery.herb } };
      const quality = trainingQuality(state.trainingScore);
      const grade = trainingGrade(state.trainingScore);
      const qualityXp = quality === 'PERFECT' ? 2 : quality === 'GREAT' ? 1 : 0;
      const masteryGains: Record<ActivityId, number> = { hunt: 0, magic: 0, rest: 0, herb: 0 };
      state.schedule.forEach(id => {
        stats = applyActivity(stats, id);
        personality = applyPersonalityDelta(personality, personalityDeltaForActivity(id));
        const gain = 1 + qualityXp;
        mastery[id].xp += gain;
        masteryGains[id] += gain;
      });
      const bonus = grade === 'S' ? 8 : grade === 'A' ? 5 : 2;
      stats.strength = clamp(stats.strength + bonus);
      let next: GameState = { ...state, stats, personality, mastery, screen: 'dialogue', pendingGrowth: { quality, grade, statsBefore, masteryGains, personalityBefore: state.personality, memoryCountBefore: state.memories.length } };
      next = addMemory(next, 'first_training');
      if (quality === 'PERFECT') next = addMemory(next, 'first_perfect');
      if (grade === 'S') next = addMemory(next, 'first_s_grade');
      return next;
    }
    case 'CHOOSE': return applyDialogueChoice(state, action.choice);
    case 'NEXT_MONTH': {
      const month = state.month === 12 ? 1 : state.month + 1;
      const year = state.month === 12 ? state.year + 1 : state.year;
      let next = addMemory(state, 'first_month_complete');
      next = { ...next, month, year, week: 1, screen: 'hub', combo: 0, trainingScore: 0, gold: next.gold + 350, condition: deriveCondition(next.stats), pendingGrowth: undefined };
      return next;
    }
    case 'RESET': return initialState;
    default: return state;
  }
}