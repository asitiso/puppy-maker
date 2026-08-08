import {
  applyGiftEffects,
  applyOutingEffects,
  giftItemIds,
  outingDefinitions,
  outingLocationIds,
  startingInventory,
  type GiftItemId,
  type Inventory,
  type OutingLocationId,
} from './adventure';

export type Screen = 'hub' | 'schedule' | 'training' | 'dialogue' | 'result';
export type ActivityId = 'hunt' | 'magic' | 'rest' | 'herb';
export type Condition = 'energetic' | 'normal' | 'focused' | 'tired';
export type ResultQuality = 'NORMAL' | 'GOOD' | 'GREAT' | 'PERFECT';
export type MemoryId =
  | 'first_training'
  | 'first_perfect'
  | 'first_hug'
  | 'first_snack'
  | 'first_s_grade'
  | 'first_month_complete'
  | 'first_skill'
  | 'close_bond'
  | 'first_outing'
  | 'forest_memory'
  | 'village_memory'
  | 'lakeside_memory'
  | 'first_gift';
export type DialogueChoice = 'hug' | 'scold' | 'snack';
export type SkillId = 'quick_strike' | 'mana_focus' | 'steady_breath' | 'trail_instinct';
export type RandomEventId = 'rare_herb' | 'new_move' | 'magic_flow' | 'second_wind' | 'quiet_focus' | 'fox_curiosity';
export type RelationshipRank = 'acquaintance' | 'familiar' | 'friend' | 'close_friend' | 'precious';
export type AchievementId =
  | 'first_steps'
  | 'skill_beginner'
  | 'memory_keeper'
  | 'close_bond'
  | 'mastery_specialist'
  | 'perfect_growth'
  | 'little_explorer'
  | 'thoughtful_giver';

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

export interface MasteryEntry { xp: number; }
export type MasteryState = Record<ActivityId, MasteryEntry>;

export interface GrowthReport {
  grade: ReturnType<typeof trainingGrade>;
  quality: ResultQuality;
  topStat: { key: keyof Stats; delta: number } | null;
  masteryLevels: Record<ActivityId, number>;
  personalityDeltas: Partial<Personality>;
  newMemories: MemoryId[];
  randomEvent: RandomEventId | null;
  unlockedSkill: SkillId | null;
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
  claimedAchievements: AchievementId[];
  inventory: Inventory;
  visitedOutings: OutingLocationId[];
  lastGrowthReport: GrowthReport | null;
}

export type AchievementDefinition = {
  id: AchievementId;
  title: string;
  description: string;
  reward: { gold?: number; gems?: number };
};

export const achievementDefinitions: AchievementDefinition[] = [
  { id: 'first_steps', title: '첫걸음', description: '첫 훈련을 완료하세요.', reward: { gold: 150 } },
  { id: 'skill_beginner', title: '새 기술의 시작', description: '기술을 1개 해금하세요.', reward: { gold: 200 } },
  { id: 'memory_keeper', title: '추억 수집가', description: '기억을 3개 모으세요.', reward: { gold: 250 } },
  { id: 'close_bond', title: '가까워진 마음', description: '루나와 가까운 친구가 되세요.', reward: { gems: 2 } },
  { id: 'mastery_specialist', title: '숙련의 길', description: '훈련 하나를 Lv.4까지 올리세요.', reward: { gold: 400 } },
  { id: 'perfect_growth', title: '완벽한 성장', description: '첫 PERFECT를 달성하세요.', reward: { gems: 3 } },
  { id: 'little_explorer', title: '작은 탐험가', description: '세 곳의 외출 장소를 모두 방문하세요.', reward: { gold: 300 } },
  { id: 'thoughtful_giver', title: '마음을 담은 선물', description: '루나에게 첫 선물을 건네세요.', reward: { gems: 2 } },
];

export const activities: Record<ActivityId, { name: string; icon: string; effect: Partial<Stats> }> = {
  hunt: { name: '사냥 훈련', icon: 'sword', effect: { strength: 6, fatigue: 9, stress: 4 } },
  magic: { name: '마법 수업', icon: 'spark', effect: { magic: 7, intelligence: 3, fatigue: 7 } },
  rest: { name: '포근한 휴식', icon: 'moon', effect: { stress: -16, fatigue: -20, affection: 2 } },
  herb: { name: '약초 채집', icon: 'leaf', effect: { intelligence: 2, fatigue: 5 } },
};

const defaultMastery = (): MasteryState => ({ hunt: { xp: 0 }, magic: { xp: 0 }, rest: { xp: 0 }, herb: { xp: 0 } });
const defaultPersonality = (): Personality => ({ courage: 20, kindness: 20, curiosity: 20, calmness: 20 });

export const initialState: GameState = {
  screen: 'hub', year: 1, month: 4, week: 2, gold: 5000, gems: 220,
  schedule: ['hunt', 'magic', 'rest', 'herb'], combo: 0, trainingScore: 0,
  stats: { strength: 28, intelligence: 34, magic: 42, morality: 61, affection: 72, stress: 24, fatigue: 18 },
  condition: 'normal', mastery: defaultMastery(), personality: defaultPersonality(), memories: [], claimedAchievements: [],
  inventory: startingInventory(), visitedOutings: [], lastGrowthReport: null,
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));
const activityIds: ActivityId[] = ['hunt', 'magic', 'rest', 'herb'];
const statKeys: Array<keyof Stats> = ['strength', 'intelligence', 'magic', 'morality', 'affection', 'stress', 'fatigue'];
const personalityKeys: Array<keyof Personality> = ['courage', 'kindness', 'curiosity', 'calmness'];
const screens: Screen[] = ['hub', 'schedule', 'training', 'dialogue', 'result'];
const conditions: Condition[] = ['energetic', 'normal', 'focused', 'tired'];
const resultQualities: ResultQuality[] = ['NORMAL', 'GOOD', 'GREAT', 'PERFECT'];
const grades: Array<GrowthReport['grade']> = ['S', 'A', 'B', 'C'];
const memoryIds: MemoryId[] = [
  'first_training', 'first_perfect', 'first_hug', 'first_snack', 'first_s_grade', 'first_month_complete', 'first_skill', 'close_bond',
  'first_outing', 'forest_memory', 'village_memory', 'lakeside_memory', 'first_gift',
];
const memoryPriority: MemoryId[] = [
  'first_skill', 'close_bond', 'first_perfect', 'first_s_grade', 'first_training', 'first_hug', 'first_snack', 'first_month_complete',
  'first_outing', 'forest_memory', 'village_memory', 'lakeside_memory', 'first_gift',
];
const skillIds: SkillId[] = ['quick_strike', 'mana_focus', 'steady_breath', 'trail_instinct'];
const randomEventIds: RandomEventId[] = ['rare_herb', 'new_move', 'magic_flow', 'second_wind', 'quiet_focus', 'fox_curiosity'];
const achievementIds: AchievementId[] = achievementDefinitions.map(item => item.id);

const cloneInitialState = (): GameState => ({
  ...initialState,
  schedule: [...initialState.schedule],
  stats: { ...initialState.stats },
  mastery: Object.fromEntries(activityIds.map(id => [id, { ...initialState.mastery[id] }])) as MasteryState,
  personality: { ...initialState.personality },
  memories: [...initialState.memories],
  claimedAchievements: [...initialState.claimedAchievements],
  inventory: { ...initialState.inventory },
  visitedOutings: [...initialState.visitedOutings],
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

export function unlockedSkills(state: GameState): SkillId[] {
  const result: SkillId[] = [];
  if (masteryLevel(state.mastery.hunt.xp) >= 2) result.push('quick_strike');
  if (masteryLevel(state.mastery.magic.xp) >= 2) result.push('mana_focus');
  if (masteryLevel(state.mastery.rest.xp) >= 2) result.push('steady_breath');
  if (masteryLevel(state.mastery.herb.xp) >= 2) result.push('trail_instinct');
  return result;
}

export function relationshipRank(affection: number): RelationshipRank {
  if (affection >= 90) return 'precious';
  if (affection >= 75) return 'close_friend';
  if (affection >= 60) return 'friend';
  if (affection >= 40) return 'familiar';
  return 'acquaintance';
}

export function collectionProgress(state: GameState) {
  return {
    memories: state.memories.length,
    skills: unlockedSkills(state).length,
    masteredActivities: activityIds.filter(id => masteryLevel(state.mastery[id].xp) >= 4).length,
  };
}

export function eligibleAchievements(state: GameState): AchievementId[] {
  const progress = collectionProgress(state);
  const rank = relationshipRank(state.stats.affection);
  const eligible = new Set<AchievementId>();
  if (state.memories.includes('first_training')) eligible.add('first_steps');
  if (progress.skills >= 1) eligible.add('skill_beginner');
  if (progress.memories >= 3) eligible.add('memory_keeper');
  if (rank === 'close_friend' || rank === 'precious') eligible.add('close_bond');
  if (progress.masteredActivities >= 1) eligible.add('mastery_specialist');
  if (state.memories.includes('first_perfect')) eligible.add('perfect_growth');
  if (state.visitedOutings.length >= outingLocationIds.length) eligible.add('little_explorer');
  if (state.memories.includes('first_gift')) eligible.add('thoughtful_giver');
  return achievementIds.filter(id => eligible.has(id));
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

function pickReportMemory(memories: MemoryId[]): MemoryId[] {
  const chosen = memoryPriority.find(id => memories.includes(id));
  return chosen ? [chosen] : [];
}

function applyPersonalityDelta(personality: Personality, delta: Partial<Personality>): Personality {
  const next = { ...personality };
  personalityKeys.forEach(key => {
    if (delta[key] !== undefined) next[key] = clamp(next[key] + (delta[key] ?? 0));
  });
  return next;
}

function personalityDifference(before: Personality, after: Personality): Partial<Personality> {
  const delta: Partial<Personality> = {};
  personalityKeys.forEach(key => {
    const difference = after[key] - before[key];
    if (difference !== 0) delta[key] = difference;
  });
  return delta;
}

function mergePersonalityDeltas(...deltas: Array<Partial<Personality>>): Partial<Personality> {
  const merged: Partial<Personality> = {};
  for (const delta of deltas) {
    personalityKeys.forEach(key => {
      const value = delta[key];
      if (value !== undefined && value !== 0) merged[key] = (merged[key] ?? 0) + value;
    });
  }
  return merged;
}

const activityPersonality: Record<ActivityId, Partial<Personality>> = {
  hunt: { courage: 3 }, magic: { curiosity: 3 }, rest: { calmness: 3 }, herb: { curiosity: 2, calmness: 1 },
};
const dialoguePersonality: Record<DialogueChoice, Partial<Personality>> = {
  hug: { kindness: 4 }, scold: { courage: 2, calmness: 1 }, snack: { kindness: 2 },
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

type WeightedEvent = { id: RandomEventId; weight: number };

function eligibleRandomEvents(state: GameState): WeightedEvent[] {
  const events: WeightedEvent[] = [];
  if (state.schedule.includes('herb')) events.push({ id: 'rare_herb', weight: 2 });
  if (state.schedule.includes('hunt') && state.personality.courage >= 25) events.push({ id: 'new_move', weight: 2 });
  if (state.schedule.includes('magic') && (state.condition === 'focused' || state.condition === 'energetic')) events.push({ id: 'magic_flow', weight: 2 });
  if (state.stats.fatigue >= 35) events.push({ id: 'second_wind', weight: 2 });
  if (state.personality.calmness >= 25) events.push({ id: 'quiet_focus', weight: 1 });
  if (state.personality.curiosity >= 25 && (state.schedule.includes('herb') || state.schedule.includes('magic'))) events.push({ id: 'fox_curiosity', weight: 1 });
  return events;
}

export function pickRandomEvent(state: GameState, roll: number): RandomEventId | null {
  const eligible = eligibleRandomEvents(state);
  if (!eligible.length) return null;
  const safeRoll = Math.min(0.999999, Math.max(0, roll));
  const eventWeight = eligible.reduce((total, event) => total + event.weight, 0);
  const totalWeight = eventWeight + 4;
  let cursor = safeRoll * totalWeight;
  for (const event of eligible) {
    if (cursor < event.weight) return event.id;
    cursor -= event.weight;
  }
  return null;
}

function applyRandomEvent(state: GameState, event: RandomEventId | null): GameState {
  if (!event) return state;
  if (event === 'rare_herb') return { ...state, gold: state.gold + 100, personality: applyPersonalityDelta(state.personality, { curiosity: 1 }) };
  if (event === 'new_move') return { ...state, mastery: { ...state.mastery, hunt: { xp: state.mastery.hunt.xp + 1 } } };
  if (event === 'magic_flow') return { ...state, trainingScore: state.trainingScore + 80 };
  if (event === 'second_wind') return { ...state, stats: { ...state.stats, fatigue: clamp(state.stats.fatigue - 8) } };
  if (event === 'quiet_focus') return { ...state, stats: { ...state.stats, stress: clamp(state.stats.stress - 6) } };
  const target: ActivityId = state.schedule.includes('herb') ? 'herb' : 'magic';
  return { ...state, mastery: { ...state.mastery, [target]: { xp: state.mastery[target].xp + 1 } } };
}

function newlyUnlockedSkill(before: GameState, after: GameState): SkillId | null {
  const beforeSkills = unlockedSkills(before);
  return unlockedSkills(after).find(skill => !beforeSkills.includes(skill)) ?? null;
}

function buildGrowthReport(
  state: GameState,
  personalityDeltas: Partial<Personality>,
  newMemories: MemoryId[],
  randomEvent: RandomEventId | null = null,
  unlockedSkill: SkillId | null = null,
): GrowthReport {
  return {
    grade: trainingGrade(state.trainingScore), quality: resultQuality(state.trainingScore), topStat: topStatGrowth(state.schedule, state.trainingScore),
    masteryLevels: Object.fromEntries(activityIds.map(id => [id, masteryLevel(state.mastery[id].xp)])) as Record<ActivityId, number>,
    personalityDeltas, newMemories: pickReportMemory(newMemories), randomEvent, unlockedSkill,
  };
}

function hydrateGrowthReport(raw: unknown): GrowthReport | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.grade !== 'string' || !grades.includes(raw.grade as GrowthReport['grade'])) return null;
  if (typeof raw.quality !== 'string' || !resultQualities.includes(raw.quality as ResultQuality)) return null;
  if (!isRecord(raw.masteryLevels) || !isRecord(raw.personalityDeltas) || !Array.isArray(raw.newMemories)) return null;

  let topStat: GrowthReport['topStat'] = null;
  if (raw.topStat !== null) {
    if (!isRecord(raw.topStat) || typeof raw.topStat.key !== 'string' || !statKeys.includes(raw.topStat.key as keyof Stats)) return null;
    if (typeof raw.topStat.delta !== 'number' || !Number.isFinite(raw.topStat.delta)) return null;
    topStat = { key: raw.topStat.key as keyof Stats, delta: raw.topStat.delta };
  }

  const masteryLevels = {} as Record<ActivityId, number>;
  for (const id of activityIds) {
    const value = raw.masteryLevels[id];
    if (typeof value !== 'number' || !Number.isFinite(value)) return null;
    masteryLevels[id] = Math.min(5, Math.max(1, Math.floor(value)));
  }

  const personalityDeltas: Partial<Personality> = {};
  for (const key of personalityKeys) {
    const value = raw.personalityDeltas[key];
    if (value !== undefined) {
      if (typeof value !== 'number' || !Number.isFinite(value)) return null;
      personalityDeltas[key] = value;
    }
  }

  const newMemories = raw.newMemories.filter((id): id is MemoryId => typeof id === 'string' && memoryIds.includes(id as MemoryId));
  const randomEvent = typeof raw.randomEvent === 'string' && randomEventIds.includes(raw.randomEvent as RandomEventId) ? raw.randomEvent as RandomEventId : null;
  const unlockedSkill = typeof raw.unlockedSkill === 'string' && skillIds.includes(raw.unlockedSkill as SkillId) ? raw.unlockedSkill as SkillId : null;
  return { grade: raw.grade as GrowthReport['grade'], quality: raw.quality as ResultQuality, topStat, masteryLevels, personalityDeltas, newMemories: pickReportMemory(newMemories), randomEvent, unlockedSkill };
}

export function hydrateGameState(raw: unknown): GameState {
  const fallback = cloneInitialState();
  if (!isRecord(raw)) return fallback;

  const statsRaw = isRecord(raw.stats) ? raw.stats : {};
  const stats: Stats = {
    strength: clamp(finiteNumber(statsRaw.strength, fallback.stats.strength)), intelligence: clamp(finiteNumber(statsRaw.intelligence, fallback.stats.intelligence)),
    magic: clamp(finiteNumber(statsRaw.magic, fallback.stats.magic)), morality: clamp(finiteNumber(statsRaw.morality, fallback.stats.morality)),
    affection: clamp(finiteNumber(statsRaw.affection, fallback.stats.affection)), stress: clamp(finiteNumber(statsRaw.stress, fallback.stats.stress)), fatigue: clamp(finiteNumber(statsRaw.fatigue, fallback.stats.fatigue)),
  };

  const masteryRaw = isRecord(raw.mastery) ? raw.mastery : {};
  const mastery = Object.fromEntries(activityIds.map(id => {
    const entry = isRecord(masteryRaw[id]) ? masteryRaw[id] : {};
    return [id, { xp: Math.max(0, Math.floor(finiteNumber(entry.xp, fallback.mastery[id].xp))) }];
  })) as MasteryState;

  const personalityRaw = isRecord(raw.personality) ? raw.personality : {};
  const personality: Personality = {
    courage: clamp(finiteNumber(personalityRaw.courage, fallback.personality.courage)), kindness: clamp(finiteNumber(personalityRaw.kindness, fallback.personality.kindness)),
    curiosity: clamp(finiteNumber(personalityRaw.curiosity, fallback.personality.curiosity)), calmness: clamp(finiteNumber(personalityRaw.calmness, fallback.personality.calmness)),
  };

  const schedule = Array.isArray(raw.schedule) && raw.schedule.length === 4 && raw.schedule.every(id => typeof id === 'string' && activityIds.includes(id as ActivityId))
    ? [...raw.schedule] as ActivityId[] : [...fallback.schedule];
  const memories = Array.isArray(raw.memories)
    ? [...new Set(raw.memories.filter((id): id is MemoryId => typeof id === 'string' && memoryIds.includes(id as MemoryId)))] : fallback.memories;
  const claimedAchievements = Array.isArray(raw.claimedAchievements)
    ? [...new Set(raw.claimedAchievements.filter((id): id is AchievementId => typeof id === 'string' && achievementIds.includes(id as AchievementId)))] : [];
  const inventoryRaw = isRecord(raw.inventory) ? raw.inventory : null;
  const inventory = inventoryRaw
    ? Object.fromEntries(giftItemIds.map(id => [id, Math.max(0, Math.floor(finiteNumber(inventoryRaw[id], fallback.inventory[id])))])) as Inventory
    : { ...fallback.inventory };
  const visitedOutings = Array.isArray(raw.visitedOutings)
    ? [...new Set(raw.visitedOutings.filter((id): id is OutingLocationId => typeof id === 'string' && outingLocationIds.includes(id as OutingLocationId)))]
    : [];

  return {
    ...fallback,
    screen: typeof raw.screen === 'string' && screens.includes(raw.screen as Screen) ? raw.screen as Screen : fallback.screen,
    year: Math.max(1, Math.floor(finiteNumber(raw.year, fallback.year))), month: Math.min(12, Math.max(1, Math.floor(finiteNumber(raw.month, fallback.month)))),
    week: Math.min(4, Math.max(1, Math.floor(finiteNumber(raw.week, fallback.week)))), gold: Math.max(0, Math.floor(finiteNumber(raw.gold, fallback.gold))),
    gems: Math.max(0, Math.floor(finiteNumber(raw.gems, fallback.gems))), schedule, stats,
    combo: Math.max(0, Math.floor(finiteNumber(raw.combo, fallback.combo))), trainingScore: Math.max(0, Math.floor(finiteNumber(raw.trainingScore, fallback.trainingScore))),
    lastChoice: raw.lastChoice === 'hug' || raw.lastChoice === 'scold' || raw.lastChoice === 'snack' ? raw.lastChoice : undefined,
    condition: typeof raw.condition === 'string' && conditions.includes(raw.condition as Condition) ? raw.condition as Condition : fallback.condition,
    mastery, personality, memories, claimedAchievements, inventory, visitedOutings, lastGrowthReport: hydrateGrowthReport(raw.lastGrowthReport),
  };
}

export function applyDialogueChoice(state: GameState, choice: DialogueChoice): GameState {
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
  | { type: 'FINISH_TRAINING'; eventRoll?: number }
  | { type: 'CHOOSE'; choice: DialogueChoice }
  | { type: 'CLAIM_ACHIEVEMENT'; achievement: AchievementId }
  | { type: 'GO_OUTING'; location: OutingLocationId }
  | { type: 'GIVE_GIFT'; item: GiftItemId }
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
      const skills = unlockedSkills(state);
      const tiredMultiplier = state.condition === 'tired' && skills.includes('steady_breath') ? 0.95 : 0.9;
      const conditionMultiplier = state.condition === 'energetic' ? 1.1 : state.condition === 'focused' ? 1.05 : state.condition === 'tired' ? tiredMultiplier : 1;
      const skillMultiplier = action.kind === 'attack' && skills.includes('quick_strike') ? 1.05 : action.kind === 'charge' && skills.includes('mana_focus') ? 1.05 : 1;
      const base = action.kind === 'attack' ? 140 : action.kind === 'dodge' ? 110 : 80;
      const gain = Math.round(action.accuracy * base * conditionMultiplier * skillMultiplier);
      return { ...state, combo: action.accuracy > .55 ? state.combo + 1 : 0, trainingScore: state.trainingScore + gain };
    }
    case 'FINISH_TRAINING': {
      let stats = { ...state.stats };
      const personalityBefore = { ...state.personality };
      let mastery: MasteryState = Object.fromEntries(activityIds.map(id => [id, { ...state.mastery[id] }])) as MasteryState;
      let personality = { ...state.personality };
      const quality = resultQuality(state.trainingScore);
      const masteryGain = quality === 'GREAT' || quality === 'PERFECT' ? 2 : 1;
      const hasTrailInstinct = unlockedSkills(state).includes('trail_instinct');

      state.schedule.forEach(id => {
        stats = applyActivity(stats, id);
        if (id === 'herb' && hasTrailInstinct) stats.intelligence = clamp(stats.intelligence + 1);
        mastery[id] = { xp: mastery[id].xp + masteryGain };
        personality = applyPersonalityDelta(personality, activityPersonality[id]);
      });
      stats.strength = clamp(stats.strength + trainingBonus(state.trainingScore));

      let memories = addMemory(state.memories, 'first_training');
      if (quality === 'PERFECT') memories = addMemory(memories, 'first_perfect');
      if (trainingGrade(state.trainingScore) === 'S') memories = addMemory(memories, 'first_s_grade');

      const preEventState: GameState = { ...state, stats, mastery, personality, memories, condition: deriveCondition(stats), screen: 'dialogue', lastGrowthReport: null };
      const randomEvent = pickRandomEvent(state, action.eventRoll ?? 0.999999);
      const eventState = applyRandomEvent(preEventState, randomEvent);
      const unlockedSkill = newlyUnlockedSkill(state, eventState);
      if (unlockedSkills(eventState).length > 0) memories = addMemory(eventState.memories, 'first_skill');
      else memories = eventState.memories;
      const finalState: GameState = { ...eventState, memories, condition: deriveCondition(eventState.stats) };
      const trainingNewMemories = finalState.memories.filter(id => !state.memories.includes(id));

      return {
        ...finalState,
        lastGrowthReport: buildGrowthReport(finalState, personalityDifference(personalityBefore, finalState.personality), trainingNewMemories, randomEvent, unlockedSkill),
      };
    }
    case 'CHOOSE': {
      const personalityBefore = { ...state.personality };
      const personality = applyPersonalityDelta(state.personality, dialoguePersonality[action.choice]);
      let memories = state.memories;
      if (action.choice === 'hug') memories = addMemory(memories, 'first_hug');
      if (action.choice === 'snack') memories = addMemory(memories, 'first_snack');
      let chosen = applyDialogueChoice({ ...state, memories, personality }, action.choice);
      if (relationshipRank(chosen.stats.affection) === 'close_friend' || relationshipRank(chosen.stats.affection) === 'precious') {
        memories = addMemory(chosen.memories, 'close_bond');
        chosen = { ...chosen, memories };
      }
      const dialogueNewMemories = memories.filter(id => !state.memories.includes(id));
      const previousDeltas = state.lastGrowthReport?.personalityDeltas ?? {};
      const allNewMemories = [...(state.lastGrowthReport?.newMemories ?? []), ...dialogueNewMemories];
      return {
        ...chosen,
        condition: deriveCondition(chosen.stats),
        lastGrowthReport: buildGrowthReport(
          chosen,
          mergePersonalityDeltas(previousDeltas, personalityDifference(personalityBefore, personality)),
          allNewMemories,
          state.lastGrowthReport?.randomEvent ?? null,
          state.lastGrowthReport?.unlockedSkill ?? null,
        ),
      };
    }
    case 'GO_OUTING': {
      const effects = applyOutingEffects(state.stats, state.personality, action.location);
      const rewardItem = outingDefinitions[action.location].rewardItem;
      let memories = addMemory(state.memories, 'first_outing');
      const locationMemory: Record<OutingLocationId, MemoryId> = {
        forest: 'forest_memory', village: 'village_memory', lakeside: 'lakeside_memory',
      };
      memories = addMemory(memories, locationMemory[action.location]);
      const visitedOutings = state.visitedOutings.includes(action.location)
        ? state.visitedOutings
        : [...state.visitedOutings, action.location];
      const inventory = { ...state.inventory, [rewardItem]: state.inventory[rewardItem] + 1 };
      return {
        ...state,
        stats: effects.stats,
        personality: effects.personality,
        memories,
        visitedOutings,
        inventory,
        condition: deriveCondition(effects.stats),
      };
    }
    case 'GIVE_GIFT': {
      if (state.inventory[action.item] <= 0) return state;
      const effects = applyGiftEffects(state.stats, state.personality, action.item);
      const inventory = { ...state.inventory, [action.item]: state.inventory[action.item] - 1 };
      const memories = addMemory(state.memories, 'first_gift');
      return {
        ...state,
        stats: effects.stats,
        personality: effects.personality,
        inventory,
        memories,
        condition: deriveCondition(effects.stats),
      };
    }
    case 'CLAIM_ACHIEVEMENT': {
      if (state.claimedAchievements.includes(action.achievement)) return state;
      if (!eligibleAchievements(state).includes(action.achievement)) return state;
      const definition = achievementDefinitions.find(item => item.id === action.achievement);
      if (!definition) return state;
      return {
        ...state,
        gold: state.gold + (definition.reward.gold ?? 0),
        gems: state.gems + (definition.reward.gems ?? 0),
        claimedAchievements: [...state.claimedAchievements, action.achievement],
      };
    }
    case 'NEXT_MONTH': {
      const month = state.month === 12 ? 1 : state.month + 1;
      const year = state.month === 12 ? state.year + 1 : state.year;
      const memories = addMemory(state.memories, 'first_month_complete');
      return { ...state, month, year, week: 1, screen: 'hub', combo: 0, trainingScore: 0, gold: state.gold + 350, memories, condition: deriveCondition(state.stats), lastGrowthReport: null };
    }
    case 'RESET': return cloneInitialState();
    default: return state;
  }
}
