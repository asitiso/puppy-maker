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

export interface GameState extends Core.GameState {
  explorationXp: Record<OutingLocationId, number>;
  discoveries: DiscoveryId[];
}

export type Action =
  | Exclude<Core.Action, { type: 'GO_OUTING' } | { type: 'RESET' }>
  | { type: 'GO_OUTING'; location: OutingLocationId; eventRoll?: number }
  | { type: 'RESET' };

export const initialState: GameState = {
  ...Core.initialState,
  explorationXp: startingExplorationXp(),
  discoveries: [],
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const finiteNumber = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;

function hydrateExplorationXp(raw: unknown): Record<OutingLocationId, number> {
  const source = isRecord(raw) ? raw : {};
  const fallback = startingExplorationXp();
  return Object.fromEntries(outingLocationIds.map(id => [
    id,
    Math.max(0, Math.floor(finiteNumber(source[id], fallback[id]))),
  ])) as Record<OutingLocationId, number>;
}

function hydrateDiscoveries(raw: unknown): DiscoveryId[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((id): id is DiscoveryId => typeof id === 'string' && discoveryIds.includes(id as DiscoveryId)))];
}

export function hydrateGameState(raw: unknown): GameState {
  const base = Core.hydrateGameState(raw);
  const source = isRecord(raw) ? raw : {};
  return {
    ...base,
    explorationXp: hydrateExplorationXp(source.explorationXp),
    discoveries: hydrateDiscoveries(source.discoveries),
  };
}

function applyExplorationEventReward(state: GameState, event: ExplorationEventId | null): GameState {
  if (!event) return state;
  if (event === 'glowing_tracks' || event === 'street_performance' || event === 'silver_fish') {
    return { ...state, gold: state.gold + 50 };
  }

  const item: GiftItemId = event === 'ancient_tree' ? 'star_cookie' : event === 'wand_repair' ? 'fox_charm' : 'herb_tea';
  return {
    ...state,
    inventory: { ...state.inventory, [item]: state.inventory[item] + 1 },
  };
}

export function reducer(state: GameState, action: Action): GameState {
  if (action.type === 'RESET') return hydrateGameState(null);

  if (action.type === 'GO_OUTING') {
    const outcome = pickExplorationOutcome(
      action.location,
      state.explorationXp[action.location],
      state.discoveries,
      action.eventRoll ?? 0.999999,
    );
    const base = Core.reducer(state, { type: 'GO_OUTING', location: action.location }) as GameState;
    const discoveries = outcome.discovery && !state.discoveries.includes(outcome.discovery)
      ? [...state.discoveries, outcome.discovery]
      : state.discoveries;
    const progressed: GameState = {
      ...base,
      explorationXp: {
        ...state.explorationXp,
        [action.location]: state.explorationXp[action.location] + 1,
      },
      discoveries,
    };
    return applyExplorationEventReward(progressed, outcome.event);
  }

  const next = Core.reducer(state, action as Core.Action) as GameState;
  if (next === state) return state;
  return {
    ...next,
    explorationXp: state.explorationXp,
    discoveries: state.discoveries,
  };
}
