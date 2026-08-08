import * as Core from './game-core';
import {
  discoveryIds,
  outingLocationIds,
  pickExplorationOutcome,
  startingExplorationXp,
  type DiscoveryId,
  type ExplorationEventId,
  type GiftItemId,
  type OutingLocationId,
} from './adventure';
import {
  completedMonthlyMissions,
  emptyMonthlyCounters,
  monthlyMissionDefinitions,
  monthlyMissionIds,
  type MonthlyCounterKey,
  type MonthlyCounters,
  type MonthlyMissionId,
} from './monthly-missions';
import {
  guardianGrowthPoints,
  guardianRank,
  guardianRankDefinitions,
  nextGuardianRank,
  rewardableGuardianRanks,
  type GuardianRankId,
} from './guardian-rank';

export {
  achievementDefinitions,
  activities,
  applyActivity,
  applyDialogueChoice,
  collectionProgress,
  deriveCondition,
  eligibleAchievements,
  masteryLevel,
  pickRandomEvent,
  relationshipRank,
  resultQuality,
  trainingGrade,
  unlockedSkills,
} from './game-core';

export type {
  AchievementDefinition,
  AchievementId,
  ActivityId,
  Condition,
  DialogueChoice,
  GrowthReport,
  MasteryEntry,
  MasteryState,
  MemoryId,
  Personality,
  RandomEventId,
  RelationshipRank,
  ResultQuality,
  Screen,
  SkillId,
  Stats,
} from './game-core';

export type { DiscoveryId, ExplorationEventId, GiftItemId, OutingLocationId } from './adventure';
export type { MonthlyCounters, MonthlyMissionId } from './monthly-missions';
export type { GuardianRankId } from './guardian-rank';

export type ExplorationFeedback = {
  location: OutingLocationId;
  event: ExplorationEventId | null;
  discovery: DiscoveryId | null;
};

export interface GameState extends Core.GameState {
  explorationXp: Record<OutingLocationId, number>;
  discoveries: DiscoveryId[];
  lastExploration: ExplorationFeedback | null;
  monthlyCounters: MonthlyCounters;
  rewardedMonthlyMissions: MonthlyMissionId[];
  growthStreak: number;
  rewardedGuardianRanks: GuardianRankId[];
}

export type Action =
  | Exclude<Core.Action, { type: 'GO_OUTING' } | { type: 'RESET' }>
  | { type: 'GO_OUTING'; location: OutingLocationId; eventRoll?: number }
  | { type: 'RESET' };

export const initialState: GameState = {
  ...Core.initialState,
  explorationXp: startingExplorationXp(),
  discoveries: [],
  lastExploration: null,
  monthlyCounters: emptyMonthlyCounters(),
  rewardedMonthlyMissions: [],
  growthStreak: 0,
  rewardedGuardianRanks: [],
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const finiteNumber = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;

function hydrateExplorationXp(raw: unknown): Record<OutingLocationId, number> {
  const source = isRecord(raw) ? raw : {};
  const fallback = startingExplorationXp();
  return Object.fromEntries(outingLocationIds.map(id => [id, Math.max(0, Math.floor(finiteNumber(source[id], fallback[id])))])) as Record<OutingLocationId, number>;
}

function hydrateDiscoveries(raw: unknown): DiscoveryId[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((id): id is DiscoveryId => typeof id === 'string' && discoveryIds.includes(id as DiscoveryId)))];
}

function hydrateMonthlyCounters(raw: unknown): MonthlyCounters {
  const source = isRecord(raw) ? raw : {};
  const fallback = emptyMonthlyCounters();
  return Object.fromEntries((Object.keys(fallback) as MonthlyCounterKey[]).map(key => [key, Math.max(0, Math.floor(finiteNumber(source[key], 0)))])) as MonthlyCounters;
}

function hydrateRewardedMonthlyMissions(raw: unknown): MonthlyMissionId[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((id): id is MonthlyMissionId => typeof id === 'string' && monthlyMissionIds.includes(id as MonthlyMissionId)))];
}

function hydrateRewardedGuardianRanks(raw: unknown): GuardianRankId[] {
  if (!Array.isArray(raw)) return [];
  return rewardableGuardianRanks.filter(id => raw.includes(id));
}

export function hydrateGameState(raw: unknown): GameState {
  const base = Core.hydrateGameState(raw);
  const source = isRecord(raw) ? raw : {};
  return {
    ...base,
    explorationXp: hydrateExplorationXp(source.explorationXp),
    discoveries: hydrateDiscoveries(source.discoveries),
    lastExploration: null,
    monthlyCounters: hydrateMonthlyCounters(source.monthlyCounters),
    rewardedMonthlyMissions: hydrateRewardedMonthlyMissions(source.rewardedMonthlyMissions),
    growthStreak: Math.max(0, Math.floor(finiteNumber(source.growthStreak, 0))),
    rewardedGuardianRanks: hydrateRewardedGuardianRanks(source.rewardedGuardianRanks),
  };
}

export function currentGuardianStatus(state: GameState) {
  const points = guardianGrowthPoints({
    memories: state.memories.length,
    skills: Core.unlockedSkills(state).length,
    discoveries: state.discoveries.length,
    masteryLevels: Object.values(state.mastery).map(entry => Core.masteryLevel(entry.xp)),
  });
  return { points, rank: guardianRank(points), next: nextGuardianRank(points) };
}

function reconcileGuardianRewards(state: GameState): GameState {
  const { points } = currentGuardianStatus(state);
  const newlyEarned = guardianRankDefinitions
    .filter(definition => definition.rewardGems > 0 && points >= definition.threshold)
    .map(definition => definition.id)
    .filter(id => !state.rewardedGuardianRanks.includes(id));
  if (!newlyEarned.length) return state;
  const reward = newlyEarned.reduce((sum, id) => sum + (guardianRankDefinitions.find(definition => definition.id === id)?.rewardGems ?? 0), 0);
  return { ...state, gems: state.gems + reward, rewardedGuardianRanks: [...state.rewardedGuardianRanks, ...newlyEarned] };
}

function applyExplorationEventReward(state: GameState, event: ExplorationEventId | null): GameState {
  if (!event) return state;
  if (event === 'glowing_tracks' || event === 'street_performance' || event === 'silver_fish') return { ...state, gold: state.gold + 50 };
  const item: GiftItemId = event === 'ancient_tree' ? 'star_cookie' : event === 'wand_repair' ? 'fox_charm' : 'herb_tea';
  return { ...state, inventory: { ...state.inventory, [item]: state.inventory[item] + 1 } };
}

function automaticExplorationRoll(state: GameState, location: OutingLocationId): number {
  const sequence = [0.12, 0.82, 0.52, 0.36, 0.9, 0.58, 0.15, 0.5, 0.35, 0.95];
  const locationOffset = outingLocationIds.indexOf(location) * 3;
  return sequence[(state.explorationXp[location] + state.month + locationOffset) % sequence.length];
}

function applyMonthlyProgress(state: GameState, counter: MonthlyCounterKey): GameState {
  const monthlyCounters = { ...state.monthlyCounters, [counter]: state.monthlyCounters[counter] + 1 };
  const completed = completedMonthlyMissions(monthlyCounters);
  const newlyRewarded = completed.filter(id => !state.rewardedMonthlyMissions.includes(id));
  if (!newlyRewarded.length) return { ...state, monthlyCounters };
  let gold = state.gold;
  let gems = state.gems;
  for (const id of newlyRewarded) {
    const definition = monthlyMissionDefinitions.find(item => item.id === id);
    if (!definition) continue;
    gold += definition.reward.gold ?? 0;
    gems += definition.reward.gems ?? 0;
  }
  return { ...state, gold, gems, monthlyCounters, rewardedMonthlyMissions: [...state.rewardedMonthlyMissions, ...newlyRewarded] };
}

function preserveExtendedState(state: GameState, next: Core.GameState): GameState {
  return {
    ...next,
    explorationXp: state.explorationXp,
    discoveries: state.discoveries,
    lastExploration: state.lastExploration,
    monthlyCounters: state.monthlyCounters,
    rewardedMonthlyMissions: state.rewardedMonthlyMissions,
    growthStreak: state.growthStreak,
    rewardedGuardianRanks: state.rewardedGuardianRanks,
  };
}

export function reducer(state: GameState, action: Action): GameState {
  if (action.type === 'RESET') return hydrateGameState(null);

  if (action.type === 'GO_OUTING') {
    const roll = action.eventRoll ?? automaticExplorationRoll(state, action.location);
    const outcome = pickExplorationOutcome(action.location, state.explorationXp[action.location], state.discoveries, roll);
    const base = Core.reducer(state, { type: 'GO_OUTING', location: action.location }) as Core.GameState;
    const discoveries = outcome.discovery && !state.discoveries.includes(outcome.discovery) ? [...state.discoveries, outcome.discovery] : state.discoveries;
    const progressed: GameState = {
      ...base,
      explorationXp: { ...state.explorationXp, [action.location]: state.explorationXp[action.location] + 1 },
      discoveries,
      lastExploration: { location: action.location, event: outcome.event, discovery: outcome.discovery },
      monthlyCounters: state.monthlyCounters,
      rewardedMonthlyMissions: state.rewardedMonthlyMissions,
      growthStreak: state.growthStreak,
      rewardedGuardianRanks: state.rewardedGuardianRanks,
    };
    return reconcileGuardianRewards(applyMonthlyProgress(applyExplorationEventReward(progressed, outcome.event), 'outings'));
  }

  if (action.type === 'FINISH_TRAINING') {
    const next = Core.reducer(state, action as Core.Action);
    return reconcileGuardianRewards(applyMonthlyProgress(preserveExtendedState(state, next), 'trainings'));
  }

  if (action.type === 'GIVE_GIFT') {
    const next = Core.reducer(state, action as Core.Action);
    if (next === state) return state;
    return reconcileGuardianRewards(applyMonthlyProgress(preserveExtendedState(state, next), 'gifts'));
  }

  if (action.type === 'NEXT_MONTH') {
    const allComplete = completedMonthlyMissions(state.monthlyCounters).length === monthlyMissionDefinitions.length;
    const growthStreak = allComplete ? state.growthStreak + 1 : 0;
    const coreNext = Core.reducer(state, action as Core.Action);
    const streakBonus = growthStreak > 0 && growthStreak % 3 === 0 ? 3 : 0;
    return reconcileGuardianRewards({
      ...coreNext,
      gems: coreNext.gems + streakBonus,
      explorationXp: state.explorationXp,
      discoveries: state.discoveries,
      lastExploration: null,
      monthlyCounters: emptyMonthlyCounters(),
      rewardedMonthlyMissions: [],
      growthStreak,
      rewardedGuardianRanks: state.rewardedGuardianRanks,
    });
  }

  const next = Core.reducer(state, action as Core.Action);
  if (next === state) return state;
  return reconcileGuardianRewards(preserveExtendedState(state, next));
}
