export type Screen = 'hub' | 'schedule' | 'training' | 'dialogue' | 'result';
export type ActivityId = 'hunt' | 'magic' | 'rest' | 'herb';
export type Condition = 'energetic' | 'normal' | 'focused' | 'tired';
export type ResultQuality = 'NORMAL' | 'GOOD' | 'GREAT' | 'PERFECT';
export type MemoryId = 'first_training' | 'first_perfect' | 'first_hug' | 'first_snack' | 'first_s_grade' | 'first_month_complete';
export type DialogueChoice = 'hug' | 'scold' | 'snack';

export interface Stats {
  strength: number;
  intelligence: number;
  magic: number;
  morality: number;
  affection: number;
  stress: number;
  fatigue: number;
}

export interface Personality {
  courage: number;
  kindness: number;
  curiosity: number;
  calmness: number;
}

export interface MasteryEntry {
  xp: number;
}

export type MasteryState = Record<ActivityId, MasteryEntry>;

export interface GrowthReport {
  grade: ReturnType<typeof trainingGrade>;
  quality: ResultQuality;
  topStat: { key: keyof Stats; delta: number } | null;
  masteryLevels: Record<ActivityId, number>;
  personalityDeltas: Partial<Personality>;
  newMemories: MemoryId[];
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
  lastChoice?: DialogueChoice;
  condition: Condition;
  mastery: MasteryState;
  personality: Personality;
  memories: MemoryId[];
  lastGrowthReport: GrowthReport | null;
}

export const activities: Record<ActivityId, { name: string; icon: string; effect: Partial<Stats> }> = {
  hunt: { name: '사냥 훈련', icon: 'sword', effect: { strength: 6, fatigue: 9, stress: 4 } },
  magic: { name: '마법 수업', icon: 'spark', effect: { magic: 7, intelligence: 3, fatigue: 7 } },
  rest: { name: '포근한 휴식', icon: 'moon', effect: { stress: -16, fatigue: -20, affection: 2 } },
  herb: { name: '약초 채집', icon: 'leaf', effect: { intelligence: 2, fatigue: 5 } }
};

const defaultMastery = (): MasteryState => ({
  hunt: { xp: 0 },
  magic: { xp: 0 },
  rest: { xp: 0 },
  herb: { xp: 0 },
});

const defaultPersonality = (): Personality => ({ courage: 20, kindness: 20, curiosity: 20, calmness: 20 });

export const initialState: GameState = {
  screen: 'hub', year: 1, month: 4, week: 2, gold: 5000, gems: 220,
  schedule: ['hunt', 'magic', 'rest', 'herb'], combo: 0, trainingScore: 0,
  stats: { strength: 28, intelligence: 34, magic: 42, morality: 61, affection: 72, stress: 24, fatigue: 18 },
  condition: 'normal',
  mastery: defaultMastery(),
  personality: defaultPersonality(),
  memories: [],
  lastGrowthReport: null,
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));
const activityIds: ActivityId[] = ['hunt', 'magic', 'rest', 'herb'];
const screens: Screen[] = ['hub', 'schedule', 'training', 'dialogue', 'result'];
const conditions: Condition[] = ['energetic', 'normal', 'focused', 'tired'];
const memoryIds: MemoryId[] = ['first_training', 'first_perfect', 'first_hug', 'first_snack', 'first_s_grade', 'first_month_complete'];

const cloneInitialState = (): GameState => ({
  ...initialState,
  schedule: [...initialState.schedule],
  stats: { ...initialState.stats },
  mastery: Object.fromEntries(activityIds.map(id => [id, { ...initialState.mastery[id] }])) as MasteryState,
  personality: { ...initialState.personality },
  memories: [...initialState.memories],
  lastGrowthReport: null,
});

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const finiteNumber = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;

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

export function resultQuality(score: number): ResultQuality {
  if (score >= 900) return 'PERFECT';
  if (score >= 650) return 'GREAT';
  if (score >= 400) return 'GOOD';
  return 'NORMAL';
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
  if (stats.fatigue <= 15) return 'energetic';
  return 'normal';
}

function addMemory(memories: MemoryId[], id: MemoryId): MemoryId[] {
  return memories.includes(id) ? memories : [...memories, id];
}

function applyPersonalityDelta(personality: Personality, delta: Partial<Personality>): Personality {
  const next = { ...personality };
  (Object.keys(delta) as Array<keyof Personality>).forEach(key => {
    next[key] = clamp(next[key] + (delta[key] ?? 0));
  });
  return next;
}

const activityPersonality: Record<ActivityId, Partial<Personality>> = {
  hunt: { courage: 3 },
  magic: { curiosity: 3 },
  rest: { calmness: 3 },
  herb: { curiosity: 2, calmness: 1 },
};

const dialoguePersonality: Record<DialogueChoice, Partial<Personality>> = {
  hug: { kindness: 4 },
  scold: { courage: 2, calmness: 1 },
  snack: { kindness: 2 },
};

function trainingBonus(score: number): number {
  const grade = trainingGrade(score);
  return grade === 'S' ? 8 : grade === 'A' ? 5 : 2;
}

function topStatGrowth(schedule: ActivityId[], score: number): GrowthReport['topStat'] {
  const totals: Partial<Record<keyof Stats, number>> = {};
  for (const id of schedule) {
    for (const [key, delta] of Object.entries(activities[id].effect)) {
      const statKey = key as keyof Stats;
      if ((delta ?? 0) > 0) totals[statKey] = (totals[statKey] ?? 0) + (delta ?? 0);
    }
  }
  totals.strength = (totals.strength ?? 0) + trainingBonus(score);
  const entries = Object.entries(totals) as Array<[keyof Stats, number]>;
  if (!entries.length) return null;
  const [key, delta] = entries.reduce((best, current) => current[1] > best[1] ? current : best);
  return { key, delta };
}

function buildGrowthReport(state: GameState, personalityDeltas: Partial<Personality>, newMemories: MemoryId[]): GrowthReport {
  return {
    grade: trainingGrade(state.trainingScore),
    quality: resultQuality(state.trainingScore),
    topStat: topStatGrowth(state.schedule, state.trainingScore),
    masteryLevels: Object.fromEntries(activityIds.map(id => [id, masteryLevel(state.mastery[id].xp)])) as Record<ActivityId, number>,
    personalityDeltas,
    newMemories: newMemories.slice(0, 1),
  };
}

export function hydrateGameState(raw: unknown): GameState {
  const fallback = cloneInitialState();
  if (!isRecord(raw)) return fallback;

  const statsRaw = isRecord(raw.stats) ? raw.stats : {};
  const stats: Stats = {
    strength: clamp(finiteNumber(statsRaw.strength, fallback.stats.strength)),
    intelligence: clamp(finiteNumber(statsRaw.intelligence, fallback.stats.intelligence)),
    magic: clamp(finiteNumber(statsRaw.magic, fallback.stats.magic)),
    morality: clamp(finiteNumber(statsRaw.morality, fallback.stats.morality)),
    affection: clamp(finiteNumber(statsRaw.affection, fallback.stats.affection)),
    stress: clamp(finiteNumber(statsRaw.stress, fallback.stats.stress)),
    fatigue: clamp(finiteNumber(statsRaw.fatigue, fallback.stats.fatigue)),
  };

  const masteryRaw = isRecord(raw.mastery) ? raw.mastery : {};
  const mastery = Object.fromEntries(activityIds.map(id => {
    const entry = isRecord(masteryRaw[id]) ? masteryRaw[id] : {};
    return [id, { xp: Math.max(0, Math.floor(finiteNumber(entry.xp, fallback.mastery[id].xp))) }];
  })) as MasteryState;

  const personalityRaw = isRecord(raw.personality) ? raw.personality : {};
  const personality: Personality = {
    courage: clamp(finiteNumber(personalityRaw.courage, fallback.personality.courage)),
    kindness: clamp(finiteNumber(personalityRaw.kindness, fallback.personality.kindness)),
    curiosity: clamp(finiteNumber(personalityRaw.curiosity, fallback.personality.curiosity)),
    calmness: clamp(finiteNumber(personalityRaw.calmness, fallback.personality.calmness)),
  };

  const schedule = Array.isArray(raw.schedule)
    ? raw.schedule.filter((id): id is ActivityId => typeof id === 'string' && activityIds.includes(id as ActivityId))
    : fallback.schedule;

  const memories = Array.isArray(raw.memories)
    ? [...new Set(raw.memories.filter((id): id is MemoryId => typeof id === 'string' && memoryIds.includes(id as MemoryId)))]
    : fallback.memories;

  return {
    ...fallback,
    screen: typeof raw.screen === 'string' && screens.includes(raw.screen as Screen) ? raw.screen as Screen : fallback.screen,
    year: Math.max(1, Math.floor(finiteNumber(raw.year, fallback.year))),
    month: Math.min(12, Math.max(1, Math.floor(finiteNumber(raw.month, fallback.month)))),
    week: Math.min(4, Math.max(1, Math.floor(finiteNumber(raw.week, fallback.week)))),
    gold: Math.max(0, Math.floor(finiteNumber(raw.gold, fallback.gold))),
    gems: Math.max(0, Math.floor(finiteNumber(raw.gems, fallback.gems))),
    schedule: schedule.length ? schedule : [...fallback.schedule],
    stats,
    combo: Math.max(0, Math.floor(finiteNumber(raw.combo, fallback.combo))),
    trainingScore: Math.max(0, Math.floor(finiteNumber(raw.trainingScore, fallback.trainingScore))),
    lastChoice: raw.lastChoice === 'hug' || raw.lastChoice === 'scold' || raw.lastChoice === 'snack' ? raw.lastChoice : undefined,
    condition: typeof raw.condition === 'string' && conditions.includes(raw.condition as Condition) ? raw.condition as Condition : fallback.condition,
    mastery,
    personality,
    memories,
    lastGrowthReport: isRecord(raw.lastGrowthReport) ? raw.lastGrowthReport as unknown as GrowthReport : null,
  };
}

export function applyDialogueChoice(state: GameState, choice: DialogueChoice): GameState {
  const stats = { ...state.stats };
  if (choice === 'hug') { stats.stress = clamp(stats.stress - 20); stats.affection = clamp(stats.affection + 10); stats.morality = clamp(stats.morality + 2); }
  if (choice === 'scold') { stats.morality = clamp(stats.morality + 5); stats.stress = clamp(stats.stress + 15); }
  if (choice === 'snack') { stats.stress = clamp(stats.stress - 30); stats.affection = clamp(stats.affection + 4); }
  return {
    ...state,
    stats,
    gold: choice === 'snack' ? Math.max(0, state.gold - 100) : state.gold,
    lastChoice: choice,
    screen: 'result',
  };
}

export type Action =
  | { type: 'GO'; screen: Screen }
  | { type: 'SET_SCHEDULE'; index: number; activity: ActivityId }
  | { type: 'AUTO_SCHEDULE' }
  | { type: 'TRAIN'; kind: 'attack' | 'dodge' | 'charge'; accuracy: number }
  | { type: 'FINISH_TRAINING' }
  | { type: 'CHOOSE'; choice: DialogueChoice }
  | { type: 'NEXT_MONTH' }
  | { type: 'RESET' };

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'GO': return { ...state, screen: action.screen };
    case 'SET_SCHEDULE': {
      const schedule = [...state.schedule];
      schedule[action.index] = action.activity;
      return { ...state, schedule };
    }
    case 'AUTO_SCHEDULE': return { ...state, schedule: ['hunt', 'magic', 'rest', 'herb'] };
    case 'TRAIN': {
      const conditionMultiplier = state.condition === 'energetic' ? 1.1 : state.condition === 'focused' ? 1.05 : state.condition === 'tired' ? 0.9 : 1;
      const gain = Math.round(action.accuracy * (action.kind === 'attack' ? 140 : action.kind === 'dodge' ? 110 : 80) * conditionMultiplier);
      return { ...state, combo: action.accuracy > .55 ? state.combo + 1 : 0, trainingScore: state.trainingScore + gain };
    }
    case 'FINISH_TRAINING': {
      let stats = { ...state.stats };
      let mastery: MasteryState = Object.fromEntries(activityIds.map(id => [id, { ...state.mastery[id] }])) as MasteryState;
      let personality = { ...state.personality };
      const quality = resultQuality(state.trainingScore);
      const masteryGain = quality === 'GREAT' || quality === 'PERFECT' ? 2 : 1;

      state.schedule.forEach(id => {
        stats = applyActivity(stats, id);
        mastery[id] = { xp: mastery[id].xp + masteryGain };
        personality = applyPersonalityDelta(personality, activityPersonality[id]);
      });

      stats.strength = clamp(stats.strength + trainingBonus(state.trainingScore));

      let memories = addMemory(state.memories, 'first_training');
      if (quality === 'PERFECT') memories = addMemory(memories, 'first_perfect');
      if (trainingGrade(state.trainingScore) === 'S') memories = addMemory(memories, 'first_s_grade');

      return {
        ...state,
        stats,
        mastery,
        personality,
        memories,
        condition: deriveCondition(stats),
        screen: 'dialogue',
      };
    }
    case 'CHOOSE': {
      const beforeMemories = state.memories;
      let memories = beforeMemories;
      if (action.choice === 'hug') memories = addMemory(memories, 'first_hug');
      if (action.choice === 'snack') memories = addMemory(memories, 'first_snack');
      const newMemories = memories.filter(id => !beforeMemories.includes(id));
      const personalityDeltas = dialoguePersonality[action.choice];
      const personality = applyPersonalityDelta(state.personality, personalityDeltas);
      const chosen = applyDialogueChoice({ ...state, memories, personality }, action.choice);
      return {
        ...chosen,
        condition: deriveCondition(chosen.stats),
        lastGrowthReport: buildGrowthReport({ ...chosen, memories, personality }, personalityDeltas, newMemories),
      };
    }
    case 'NEXT_MONTH': {
      const month = state.month === 12 ? 1 : state.month + 1;
      const year = state.month === 12 ? state.year + 1 : state.year;
      const memories = addMemory(state.memories, 'first_month_complete');
      return {
        ...state,
        month,
        year,
        week: 1,
        screen: 'hub',
        combo: 0,
        trainingScore: 0,
        gold: state.gold + 350,
        memories,
        condition: deriveCondition(state.stats),
      };
    }
    case 'RESET': return cloneInitialState();
    default: return state;
  }
}
