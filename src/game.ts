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
import { annualRecord, type AnnualRecord } from './annual-records';
import { attendanceKey, attendanceReward } from './attendance';
import { availableMail, mailDefinitions, type MailRewardId } from './mail-rewards';
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
import {
  eligibleStoryChapters,
  storyChapterDefinitions,
  storyChapterIds,
  type StoryChapterId,
} from './story-chapters';
import {
  applyScheduleSynergyBonuses,
  scheduleSynergies,
  scheduleSynergyDefinitions,
  type ScheduleSynergyId,
} from './schedule-synergies';
import {
  advancedTalents,
  applyAdvancedTalentBonuses,
  type AdvancedTalentId,
} from './advanced-talents';
import {
  careerTitles,
  emptyCareerRecords,
  recordCareerAction,
  type CareerRecords,
  type CareerTitleId,
} from './career-records';
import { smartSchedule } from './smart-schedule';
import {
  completesFourSeasons,
  fourSeasonCompletionRewardGems,
  seasonStampDefinitions,
  seasonStampIds,
  stampForOuting,
  type SeasonStampId,
} from './season-stamps';
import { applyMonthlyFocusBonus, monthlyFocusIds, type MonthlyFocusId } from './monthly-focus';
import { readAmbitionSelections, type YearlyAmbitionSelections } from './yearly-ambition-selection';
import type { YearlyAmbitionId } from './yearly-ambitions';
import {
  emptyExpeditionPersistentState,
  hydrateExpeditionPersistentState,
  pickExpeditionPersistentState,
  type ExpeditionPersistentState,
} from './expedition-state';
import { resolveExpeditionFinish, type ExpeditionFinishSummary } from './expedition-rewards';
import { equipExpeditionRelic, unequipExpeditionRelic, type ExpeditionRelicId } from './expedition-relics';
import { applyCrafting, type ExpeditionCraftingRecipeId } from './expedition-crafting';
import { expeditionStageDefinitions, isExpeditionStageCleared, type ExpeditionStageId } from './expedition-regions';
import { applyCallingSelection, type GuardianCallingId } from './guardian-callings';
import { purchaseGrowthTrait, type GrowthTraitId } from './growth-traits';
import {
  emptyRaisingDepthState,
  hydrateRaisingDepthState,
  pickRaisingDepthState,
  type RaisingDepthPersistentState,
} from './raising-depth-state';
import {
  applyBossGrowthPointReward,
  incrementCallingMonthMastery,
  monthGrowthPointReward,
  reconcileBondSceneRewards,
  type BondRewardProgress,
} from './raising-depth-rewards';

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
export type { AnnualRecord } from './annual-records';
export type { MonthlyCounters, MonthlyMissionId } from './monthly-missions';
export type { GuardianRankId } from './guardian-rank';
export type { StoryChapterId } from './story-chapters';
export type { ScheduleSynergyId } from './schedule-synergies';
export type { AdvancedTalentId } from './advanced-talents';
export type { CareerRecords, CareerTitleId } from './career-records';
export type { MailRewardId } from './mail-rewards';
export type { SeasonStampId } from './season-stamps';
export type { MonthlyFocusId } from './monthly-focus';
export type { YearlyAmbitionSelections } from './yearly-ambition-selection';
export type { YearlyAmbitionId } from './yearly-ambitions';
export type { ExpeditionPersistentState } from './expedition-state';
export type { ExpeditionRelicId } from './expedition-relics';
export type { ExpeditionMaterialId, ExpeditionCraftingRecipeId, CraftingMilestoneId } from './expedition-crafting';
export type { ExpeditionDiscoveryId } from './expedition-discoveries';
export type { ExpeditionRegionId, ExpeditionStageId, ExpeditionStageRecord, ExpeditionGrade } from './expedition-regions';
export type { ExpeditionFinishSummary } from './expedition-rewards';
export type { GuardianCallingId } from './guardian-callings';
export type { GrowthTraitId } from './growth-traits';
export type { BondSceneId } from './bond-scenes';
export type { RaisingDepthPersistentState } from './raising-depth-state';

export type ExplorationFeedback = {
  location: OutingLocationId;
  event: ExplorationEventId | null;
  discovery: DiscoveryId | null;
};

export interface GameState extends Core.GameState, ExpeditionPersistentState, RaisingDepthPersistentState {
  explorationXp: Record<OutingLocationId, number>;
  discoveries: DiscoveryId[];
  lastExploration: ExplorationFeedback | null;
  monthlyCounters: MonthlyCounters;
  rewardedMonthlyMissions: MonthlyMissionId[];
  growthStreak: number;
  rewardedGuardianRanks: GuardianRankId[];
  rewardedStoryChapters: StoryChapterId[];
  lastScheduleSynergies: ScheduleSynergyId[];
  careerRecords: CareerRecords;
  claimedAttendanceMonths: string[];
  claimedMailRewards: MailRewardId[];
  seasonStamps: SeasonStampId[];
  monthlyFocus: MonthlyFocusId;
  annualRecords: AnnualRecord[];
  yearlyAmbitions: YearlyAmbitionSelections;
  lastExpeditionResult: ExpeditionFinishSummary | null;
}

export type Action =
  | Exclude<Core.Action, { type: 'GO_OUTING' } | { type: 'RESET' }>
  | { type: 'GO_OUTING'; location: OutingLocationId; eventRoll?: number }
  | { type: 'CLAIM_ATTENDANCE' }
  | { type: 'CLAIM_MAIL'; mail: MailRewardId }
  | { type: 'SET_MONTHLY_FOCUS'; focus: MonthlyFocusId }
  | { type: 'SET_YEARLY_AMBITION'; ambition: YearlyAmbitionId }
  | { type: 'SET_GUARDIAN_CALLING'; calling: GuardianCallingId }
  | { type: 'PURCHASE_GROWTH_TRAIT'; trait: GrowthTraitId }
  | { type: 'FINISH_EXPEDITION_STAGE'; stageId: ExpeditionStageId; score: number; fatigueDelta?: number; stressDelta?: number }
  | { type: 'EQUIP_EXPEDITION_RELIC'; relic: ExpeditionRelicId }
  | { type: 'UNEQUIP_EXPEDITION_RELIC'; relic: ExpeditionRelicId }
  | { type: 'CRAFT_EXPEDITION_RECIPE'; recipe: ExpeditionCraftingRecipeId }
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
  rewardedStoryChapters: [],
  lastScheduleSynergies: [],
  careerRecords: emptyCareerRecords(),
  claimedAttendanceMonths: [],
  claimedMailRewards: [],
  seasonStamps: [],
  monthlyFocus: 'balanced',
  annualRecords: [],
  yearlyAmbitions: {},
  lastExpeditionResult: null,
  ...emptyExpeditionPersistentState(),
  ...emptyRaisingDepthState(),
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const finiteNumber = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const clampStat = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

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

function hydrateRewardedStoryChapters(raw: unknown): StoryChapterId[] {
  if (!Array.isArray(raw)) return [];
  return storyChapterIds.filter(id => raw.includes(id));
}

function hydrateScheduleSynergies(raw: unknown): ScheduleSynergyId[] {
  if (!Array.isArray(raw)) return [];
  const ids = scheduleSynergyDefinitions.map(definition => definition.id);
  return ids.filter(id => raw.includes(id));
}

function hydrateCareerRecords(raw: unknown): CareerRecords {
  const source = isRecord(raw) ? raw : {};
  const base = emptyCareerRecords();
  return {
    trainings: Math.max(0, Math.floor(finiteNumber(source.trainings, base.trainings))),
    bestScore: Math.max(0, Math.floor(finiteNumber(source.bestScore, base.bestScore))),
    sGrades: Math.max(0, Math.floor(finiteNumber(source.sGrades, base.sGrades))),
    outings: Math.max(0, Math.floor(finiteNumber(source.outings, base.outings))),
    gifts: Math.max(0, Math.floor(finiteNumber(source.gifts, base.gifts))),
    monthsCompleted: Math.max(0, Math.floor(finiteNumber(source.monthsCompleted, base.monthsCompleted))),
  };
}

function hydrateAttendanceClaims(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const valid = raw.filter((value): value is string => {
    if (typeof value !== 'string') return false;
    const match = /^(\d+)-(\d+)$/.exec(value);
    if (!match) return false;
    const year = Number(match[1]);
    const month = Number(match[2]);
    return year >= 1 && month >= 1 && month <= 12 && attendanceKey(year, month) === value;
  });
  return [...new Set(valid)];
}

function hydrateMailClaims(raw: unknown): MailRewardId[] {
  if (!Array.isArray(raw)) return [];
  const ids = mailDefinitions.map(item => item.id);
  return ids.filter(id => raw.includes(id));
}

function hydrateSeasonStamps(raw: unknown): SeasonStampId[] {
  if (!Array.isArray(raw)) return [];
  return seasonStampIds.filter(id => raw.includes(id));
}

function hydrateMonthlyFocus(raw: unknown): MonthlyFocusId {
  return typeof raw === 'string' && monthlyFocusIds.includes(raw as MonthlyFocusId) ? raw as MonthlyFocusId : 'balanced';
}

function hydrateAnnualRecords(raw: unknown): AnnualRecord[] {
  if (!Array.isArray(raw)) return [];
  const guardianRanks = guardianRankDefinitions.map(item => item.id);
  const records: AnnualRecord[] = [];
  for (const value of raw) {
    if (!isRecord(value)) continue;
    const year = Math.max(1, Math.floor(finiteNumber(value.year, 0)));
    if (!year || records.some(record => record.year === year)) continue;
    const guardianRankValue = typeof value.guardianRank === 'string' && guardianRanks.includes(value.guardianRank as GuardianRankId)
      ? value.guardianRank as GuardianRankId
      : 'trainee';
    records.push(annualRecord({
      year,
      trainings: Math.max(0, Math.floor(finiteNumber(value.trainings, 0))),
      outings: Math.max(0, Math.floor(finiteNumber(value.outings, 0))),
      gifts: Math.max(0, Math.floor(finiteNumber(value.gifts, 0))),
      sGrades: Math.max(0, Math.floor(finiteNumber(value.sGrades, 0))),
      bestScore: Math.max(0, Math.floor(finiteNumber(value.bestScore, 0))),
      memories: Math.max(0, Math.floor(finiteNumber(value.memories, 0))),
      skills: Math.max(0, Math.floor(finiteNumber(value.skills, 0))),
      discoveries: Math.max(0, Math.floor(finiteNumber(value.discoveries, 0))),
      seasonStamps: Math.max(0, Math.min(seasonStampIds.length, Math.floor(finiteNumber(value.seasonStamps, 0)))),
      guardianRank: guardianRankValue,
    }));
  }
  return records.sort((a, b) => a.year - b.year);
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
    rewardedStoryChapters: hydrateRewardedStoryChapters(source.rewardedStoryChapters),
    lastScheduleSynergies: hydrateScheduleSynergies(source.lastScheduleSynergies),
    careerRecords: hydrateCareerRecords(source.careerRecords),
    claimedAttendanceMonths: hydrateAttendanceClaims(source.claimedAttendanceMonths),
    claimedMailRewards: hydrateMailClaims(source.claimedMailRewards),
    seasonStamps: hydrateSeasonStamps(source.seasonStamps),
    monthlyFocus: hydrateMonthlyFocus(source.monthlyFocus),
    annualRecords: hydrateAnnualRecords(source.annualRecords),
    yearlyAmbitions: readAmbitionSelections(source.yearlyAmbitions),
    lastExpeditionResult: null,
    ...hydrateExpeditionPersistentState(source),
    ...hydrateRaisingDepthState(source),
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

export function currentStoryChapters(state: GameState): StoryChapterId[] {
  return eligibleStoryChapters({
    memories: state.memories,
    visitedOutings: state.visitedOutings,
    affection: state.stats.affection,
    guardianRank: currentGuardianStatus(state).rank,
    discoveries: state.discoveries.length,
  });
}

export function currentAdvancedTalents(state: GameState): AdvancedTalentId[] {
  return advancedTalents({
    hunt: Core.masteryLevel(state.mastery.hunt.xp),
    magic: Core.masteryLevel(state.mastery.magic.xp),
    rest: Core.masteryLevel(state.mastery.rest.xp),
    herb: Core.masteryLevel(state.mastery.herb.xp),
  });
}

export function currentCareerTitles(state: GameState): CareerTitleId[] {
  return careerTitles({
    records: state.careerRecords,
    guardianRank: currentGuardianStatus(state).rank,
    openedStories: currentStoryChapters(state).length,
  });
}

export function currentAvailableMail(state: GameState): MailRewardId[] {
  return availableMail({
    memories: state.memories,
    visitedOutings: state.visitedOutings,
    guardianRank: currentGuardianStatus(state).rank,
  });
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

function reconcileStoryRewards(state: GameState): GameState {
  const eligible = currentStoryChapters(state);
  const newlyOpened = eligible.filter(id => !state.rewardedStoryChapters.includes(id));
  if (!newlyOpened.length) return state;
  const reward = newlyOpened.reduce((sum, id) => sum + (storyChapterDefinitions.find(chapter => chapter.id === id)?.rewardGems ?? 0), 0);
  return {
    ...state,
    gems: state.gems + reward,
    rewardedStoryChapters: storyChapterIds.filter(id => state.rewardedStoryChapters.includes(id) || newlyOpened.includes(id)),
  };
}

function bondRewardProgress(state: GameState): BondRewardProgress {
  const bossClears = expeditionStageDefinitions.filter(stage => stage.boss && isExpeditionStageCleared(state.expeditionRecords[stage.id])).length;
  return {
    affection:state.stats.affection,
    outings:state.careerRecords.outings,
    trainings:state.careerRecords.trainings,
    gifts:state.careerRecords.gifts,
    guardianRank:currentGuardianStatus(state).rank,
    bossClears,
    annualRecords:state.annualRecords.length,
    unlocked:state.unlockedBondScenes,
    rewarded:state.rewardedBondScenes,
    gold:state.gold,
    gems:state.gems,
  };
}

function reconcileBondRewards(previous: GameState, state: GameState): GameState {
  const result = reconcileBondSceneRewards(bondRewardProgress(previous), bondRewardProgress(state));
  if (!result.changed) return state;
  return {
    ...state,
    gold:result.gold,
    gems:result.gems,
    unlockedBondScenes:result.unlocked,
    rewardedBondScenes:result.rewarded,
  };
}

function reconcileProgressRewards(previous: GameState, state: GameState): GameState {
  const progressed = reconcileStoryRewards(reconcileGuardianRewards(state));
  return reconcileBondRewards(previous, progressed);
}

function applyExplorationEventReward(state: GameState, event: ExplorationEventId | null): GameState {
  if (!event) return state;
  if (event === 'glowing_tracks' || event === 'street_performance' || event === 'silver_fish') return { ...state, gold: state.gold + 50 };
  const item: GiftItemId = event === 'ancient_tree' ? 'star_cookie' : event === 'wand_repair' ? 'fox_charm' : 'herb_tea';
  return { ...state, inventory: { ...state.inventory, [item]: state.inventory[item] + 1 } };
}

function applySeasonStampReward(state: GameState, month: number, location: OutingLocationId): GameState {
  const stamp = stampForOuting(month, location);
  if (!stamp || state.seasonStamps.includes(stamp)) return state;
  const rewardGems = seasonStampDefinitions.find(item => item.id === stamp)?.rewardGems ?? 0;
  const completionReward = completesFourSeasons(state.seasonStamps, stamp) ? fourSeasonCompletionRewardGems : 0;
  return {
    ...state,
    gems: state.gems + rewardGems + completionReward,
    seasonStamps: [...state.seasonStamps, stamp],
  };
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
    rewardedStoryChapters: state.rewardedStoryChapters,
    lastScheduleSynergies: state.lastScheduleSynergies,
    careerRecords: state.careerRecords,
    claimedAttendanceMonths: state.claimedAttendanceMonths,
    claimedMailRewards: state.claimedMailRewards,
    seasonStamps: state.seasonStamps,
    monthlyFocus: state.monthlyFocus,
    annualRecords: state.annualRecords,
    yearlyAmbitions: state.yearlyAmbitions,
    lastExpeditionResult: state.lastExpeditionResult,
    ...pickExpeditionPersistentState(state),
    ...pickRaisingDepthState(state),
  };
}

export function reducer(state: GameState, action: Action): GameState {
  if (action.type === 'RESET') return hydrateGameState(null);

  if (action.type === 'AUTO_SCHEDULE') {
    const next = { ...state, schedule: smartSchedule({ month: state.month, condition: state.condition, focus: state.monthlyFocus }) };
    return reconcileProgressRewards(state, next);
  }

  if (action.type === 'SET_MONTHLY_FOCUS') {
    return reconcileProgressRewards(state, { ...state, monthlyFocus: action.focus });
  }

  if (action.type === 'SET_YEARLY_AMBITION') {
    if (state.yearlyAmbitions[state.year]) return state;
    return reconcileProgressRewards(state, { ...state, yearlyAmbitions: { ...state.yearlyAmbitions, [state.year]: action.ambition } });
  }

  if (action.type === 'SET_GUARDIAN_CALLING') {
    const result = applyCallingSelection({
      current:state.activeCalling,
      next:action.calling,
      guardianRank:currentGuardianStatus(state).rank,
      gold:state.gold,
      year:state.year,
      month:state.month,
      lastSwitchKey:state.callingLastSwitchKey,
      history:state.callingHistory,
    });
    if (!result.changed) return state;
    return reconcileProgressRewards(state, {
      ...state,
      activeCalling:result.current,
      gold:result.gold,
      callingLastSwitchKey:result.lastSwitchKey,
      callingHistory:result.history,
    });
  }

  if (action.type === 'PURCHASE_GROWTH_TRAIT') {
    const result = purchaseGrowthTrait(action.trait, state.purchasedTraits, state.growthPoints);
    if (!result.purchased) return state;
    return reconcileProgressRewards(state, { ...state, purchasedTraits:result.traits, growthPoints:result.points });
  }

  if (action.type === 'FINISH_EXPEDITION_STAGE') {
    const resolved = resolveExpeditionFinish({
      ...pickExpeditionPersistentState(state),
      gold: state.gold,
      gems: state.gems,
      affection: state.stats.affection,
      inventory: state.inventory,
    }, action.stageId, action.score);
    if (!resolved.summary.accepted) return state;
    const fatigue = clampStat(state.stats.fatigue + Math.max(0, action.fatigueDelta ?? 0));
    const stress = clampStat(state.stats.stress + Math.max(0, action.stressDelta ?? 0));
    const nextStats = { ...state.stats, affection: resolved.state.affection, fatigue, stress };
    const bossReward = applyBossGrowthPointReward(action.stageId, resolved.summary.firstClear, state.growthPointBossRewards, state.growthPoints);
    const next: GameState = {
      ...state,
      ...pickExpeditionPersistentState(resolved.state),
      gold: resolved.state.gold,
      gems: resolved.state.gems,
      inventory: resolved.state.inventory,
      stats: nextStats,
      condition: Core.deriveCondition(nextStats),
      lastExpeditionResult: resolved.summary,
      growthPoints:bossReward.points,
      growthPointBossRewards:bossReward.rewarded,
    };
    return reconcileProgressRewards(state, next);
  }

  if (action.type === 'EQUIP_EXPEDITION_RELIC') {
    const equipped = equipExpeditionRelic(state.equippedExpeditionRelics, state.ownedExpeditionRelics, action.relic);
    if (equipped.length === state.equippedExpeditionRelics.length && equipped.every((id, index) => id === state.equippedExpeditionRelics[index])) return state;
    return reconcileProgressRewards(state, { ...state, equippedExpeditionRelics: equipped });
  }

  if (action.type === 'UNEQUIP_EXPEDITION_RELIC') {
    const equipped = unequipExpeditionRelic(state.equippedExpeditionRelics, action.relic);
    if (equipped.length === state.equippedExpeditionRelics.length) return state;
    return reconcileProgressRewards(state, { ...state, equippedExpeditionRelics: equipped });
  }

  if (action.type === 'CRAFT_EXPEDITION_RECIPE') {
    const result = applyCrafting(action.recipe, state.expeditionMaterials);
    if (!result.crafted || !result.milestone) return state;
    const inventory = result.gift ? { ...state.inventory, [result.gift]: state.inventory[result.gift] + 1 } : state.inventory;
    const ownedExpeditionRelics = result.relic && !state.ownedExpeditionRelics.includes(result.relic)
      ? [...state.ownedExpeditionRelics, result.relic]
      : state.ownedExpeditionRelics;
    const craftingMilestones = state.craftingMilestones.includes(result.milestone)
      ? state.craftingMilestones
      : [...state.craftingMilestones, result.milestone];
    return reconcileProgressRewards(state, { ...state, expeditionMaterials: result.materials, inventory, ownedExpeditionRelics, craftingMilestones });
  }

  if (action.type === 'CLAIM_ATTENDANCE') {
    const key = attendanceKey(state.year, state.month);
    if (state.claimedAttendanceMonths.includes(key)) return state;
    const reward = attendanceReward(state.year, state.month);
    const next = {
      ...state,
      gold: state.gold + reward.gold,
      gems: state.gems + reward.gems,
      claimedAttendanceMonths: [...state.claimedAttendanceMonths, key],
    };
    return reconcileProgressRewards(state, next);
  }

  if (action.type === 'CLAIM_MAIL') {
    if (state.claimedMailRewards.includes(action.mail) || !currentAvailableMail(state).includes(action.mail)) return state;
    const definition = mailDefinitions.find(item => item.id === action.mail);
    if (!definition) return state;
    const next = {
      ...state,
      gold: state.gold + definition.reward.gold,
      gems: state.gems + definition.reward.gems,
      claimedMailRewards: [...state.claimedMailRewards, action.mail],
    };
    return reconcileProgressRewards(state, next);
  }

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
      rewardedStoryChapters: state.rewardedStoryChapters,
      lastScheduleSynergies: state.lastScheduleSynergies,
      careerRecords: recordCareerAction(state.careerRecords, { type: 'outing' }),
      claimedAttendanceMonths: state.claimedAttendanceMonths,
      claimedMailRewards: state.claimedMailRewards,
      seasonStamps: state.seasonStamps,
      monthlyFocus: state.monthlyFocus,
      annualRecords: state.annualRecords,
      yearlyAmbitions: state.yearlyAmbitions,
      lastExpeditionResult: state.lastExpeditionResult,
      ...pickExpeditionPersistentState(state),
      ...pickRaisingDepthState(state),
    };
    const rewarded = applySeasonStampReward(applyExplorationEventReward(progressed, outcome.event), state.month, action.location);
    return reconcileProgressRewards(state, applyMonthlyProgress(rewarded, 'outings'));
  }

  if (action.type === 'FINISH_TRAINING') {
    const next = preserveExtendedState(state, Core.reducer(state, action as Core.Action));
    const synergies = scheduleSynergies(state.schedule);
    const synergyBonus = applyScheduleSynergyBonuses(next.stats, next.personality, synergies);
    const synergized: GameState = {
      ...next,
      stats: synergyBonus.stats,
      personality: synergyBonus.personality,
      condition: Core.deriveCondition(synergyBonus.stats),
      lastScheduleSynergies: synergies,
    };
    const talentBonus = applyAdvancedTalentBonuses(
      synergized.stats,
      synergized.personality,
      currentAdvancedTalents(synergized),
      state.schedule,
    );
    const focusedStats = applyMonthlyFocusBonus(talentBonus.stats, state.monthlyFocus);
    const talented: GameState = {
      ...synergized,
      stats: focusedStats,
      personality: talentBonus.personality,
      condition: Core.deriveCondition(focusedStats),
      careerRecords: recordCareerAction(state.careerRecords, {
        type: 'training',
        score: state.trainingScore,
        grade: Core.trainingGrade(state.trainingScore),
      }),
    };
    return reconcileProgressRewards(state, applyMonthlyProgress(talented, 'trainings'));
  }

  if (action.type === 'GIVE_GIFT') {
    const next = Core.reducer(state, action as Core.Action);
    if (next === state) return state;
    const gifted = preserveExtendedState(state, next);
    gifted.careerRecords = recordCareerAction(state.careerRecords, { type: 'gift' });
    return reconcileProgressRewards(state, applyMonthlyProgress(gifted, 'gifts'));
  }

  if (action.type === 'NEXT_MONTH') {
    const allComplete = completedMonthlyMissions(state.monthlyCounters).length === monthlyMissionDefinitions.length;
    const growthStreak = allComplete ? state.growthStreak + 1 : 0;
    const annualRecords = state.month === 12 && !state.annualRecords.some(record => record.year === state.year)
      ? [...state.annualRecords, annualRecord({
          year: state.year,
          trainings: state.careerRecords.trainings,
          outings: state.careerRecords.outings,
          gifts: state.careerRecords.gifts,
          sGrades: state.careerRecords.sGrades,
          bestScore: state.careerRecords.bestScore,
          memories: state.memories.length,
          skills: Core.unlockedSkills(state).length,
          discoveries: state.discoveries.length,
          seasonStamps: state.seasonStamps.length,
          guardianRank: currentGuardianStatus(state).rank,
        })]
      : state.annualRecords;
    const coreNext = Core.reducer(state, action as Core.Action);
    const streakBonus = growthStreak > 0 && growthStreak % 3 === 0 ? 3 : 0;
    const growthPoints = state.growthPoints + monthGrowthPointReward(state.trainingScore);
    const callingMastery = incrementCallingMonthMastery(state.callingMastery, state.activeCalling);
    const next: GameState = {
      ...coreNext,
      gems: coreNext.gems + streakBonus,
      explorationXp: state.explorationXp,
      discoveries: state.discoveries,
      lastExploration: null,
      monthlyCounters: emptyMonthlyCounters(),
      rewardedMonthlyMissions: [],
      growthStreak,
      rewardedGuardianRanks: state.rewardedGuardianRanks,
      rewardedStoryChapters: state.rewardedStoryChapters,
      lastScheduleSynergies: [],
      careerRecords: recordCareerAction(state.careerRecords, { type: 'month' }),
      claimedAttendanceMonths: state.claimedAttendanceMonths,
      claimedMailRewards: state.claimedMailRewards,
      seasonStamps: state.seasonStamps,
      monthlyFocus: 'balanced',
      annualRecords,
      yearlyAmbitions: state.yearlyAmbitions,
      lastExpeditionResult: null,
      ...pickExpeditionPersistentState(state),
      ...pickRaisingDepthState(state),
      growthPoints,
      callingMastery,
    };
    return reconcileProgressRewards(state, next);
  }

  const next = Core.reducer(state, action as Core.Action);
  if (next === state) return state;
  return reconcileProgressRewards(state, preserveExtendedState(state, next));
}
