import type { GameState } from './game';
import { seasonLegacyBoard, seasonLegacyNodes, seasonLegacyPoints } from './season-legacy-board';
import { seasonLegacyEffects } from './season-legacy-effects';

export function seasonLegacyRecap(state:GameState) {
  const unlocked = [...new Set(state.unlockedSeasonLegacyNodes ?? [])];
  const earnedPoints = seasonLegacyPoints(state.seasonJourneyHistory,state.claimedSeasonCompletionHonors ?? []);
  const spentPoints = unlocked.reduce((sum,id) => sum + (seasonLegacyNodes.find(node => node.id === id)?.cost ?? 0),0);
  const availablePoints = Math.max(0,earnedPoints - spentPoints);
  const board = seasonLegacyBoard(unlocked);
  const nextAffordable = board.find(node => node.available && node.cost <= availablePoints) ?? null;
  const nextLocked = board.find(node => !node.unlocked) ?? null;
  return {
    earnedPoints,
    spentPoints,
    availablePoints,
    unlockedCount:unlocked.length,
    totalNodes:seasonLegacyNodes.length,
    nextAffordable,
    nextLocked,
    activeBonuses:seasonLegacyEffects(unlocked),
  };
}
