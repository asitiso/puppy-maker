import type { AdvancedTalentId } from './advanced-talents';
import { expeditionGrade, expeditionStageDefinitions, type ExpeditionGrade, type ExpeditionStageId } from './expedition-regions';
import type { ExpeditionIdentityModifiers } from './raising-expedition-effects';

export type ExpeditionActionKind = 'attack' | 'dodge' | 'charge';
export type ExpeditionCombatCondition = 'energetic' | 'normal' | 'focused' | 'tired';
export type ExpeditionRelicModifierSummary = { attack: number; charge: number; dodge: number; all: number };

export type ExpeditionCombatInput = {
  strength: number;
  magic: number;
  calmness: number;
  fatigue: number;
  condition: ExpeditionCombatCondition;
  huntMastery: number;
  magicMastery: number;
  restMastery: number;
  talents: readonly AdvancedTalentId[];
  relics: ExpeditionRelicModifierSummary;
  identity?: ExpeditionIdentityModifiers;
};

export type ExpeditionBattleState = {
  stageId: ExpeditionStageId;
  score: number;
  pressureGuard: number;
  actionCount: number;
};

export type ExpeditionBattleResult = {
  stageId: ExpeditionStageId;
  score: number;
  grade: ExpeditionGrade;
  fatigueDelta: number;
  stressDelta: number;
};

const conditionMultiplier: Record<ExpeditionCombatCondition, number> = {
  energetic: 1.08,
  normal: 1,
  focused: 1.05,
  tired: 0.86,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function stageFor(id: ExpeditionStageId) {
  const stage = expeditionStageDefinitions.find(item => item.id === id);
  if (!stage) throw new Error(`Unknown expedition stage: ${id}`);
  return stage;
}

function talentBonus(talents: readonly AdvancedTalentId[], kind: ExpeditionActionKind): number {
  const active = new Set(talents);
  if (kind === 'attack') {
    return (active.has('hunter_instinct') ? 0.04 : 0) + (active.has('guardian_strike') ? 0.03 : 0);
  }
  if (kind === 'charge') {
    return (active.has('arcane_rhythm') ? 0.04 : 0) + (active.has('star_channel') ? 0.03 : 0);
  }
  return (active.has('steady_recovery') ? 0.04 : 0) + (active.has('deep_rest') ? 0.03 : 0);
}

export function startExpeditionBattle(stageId: ExpeditionStageId): ExpeditionBattleState {
  return { stageId, score: 0, pressureGuard: 0, actionCount: 0 };
}

export function applyExpeditionAction(
  battle: ExpeditionBattleState,
  kind: ExpeditionActionKind,
  accuracy: number,
  input: ExpeditionCombatInput,
): ExpeditionBattleState {
  const quality = 0.35 + clamp(accuracy, 0, 1) * 0.65;
  const fatiguePenalty = clamp((Math.max(0, input.fatigue) - 25) / 220, 0, 0.28);
  const readiness = conditionMultiplier[input.condition] * (1 - fatiguePenalty);
  const allBonus = clamp(input.relics.all, 0, 0.15);
  const advancedBonus = clamp(talentBonus(input.talents, kind), 0, 0.1);
  const identityBonus = clamp(input.identity?.[kind] ?? 0, 0, 0.1);

  if (kind === 'dodge') {
    const dodgeBonus = clamp(input.relics.dodge, 0, 0.2);
    const guard = (18 + input.calmness * 0.34 + input.restMastery * 4.5) * quality * readiness * (1 + allBonus + dodgeBonus + advancedBonus + identityBonus);
    return {
      ...battle,
      pressureGuard: battle.pressureGuard + Math.max(0, guard),
      score: battle.score + Math.round(Math.max(0, guard) * 0.55),
      actionCount: battle.actionCount + 1,
    };
  }

  if (kind === 'attack') {
    const bonus = clamp(input.relics.attack, 0, 0.15);
    const value = (70 + input.strength * 2.15 + input.huntMastery * 18) * quality * readiness * (1 + allBonus + bonus + advancedBonus + identityBonus);
    return { ...battle, score: battle.score + Math.max(0, Math.round(value)), actionCount: battle.actionCount + 1 };
  }

  const bonus = clamp(input.relics.charge, 0, 0.15);
  const value = (68 + input.magic * 2.2 + input.magicMastery * 18) * quality * readiness * (1 + allBonus + bonus + advancedBonus + identityBonus);
  return { ...battle, score: battle.score + Math.max(0, Math.round(value)), actionCount: battle.actionCount + 1 };
}

export function finishExpeditionBattle(battle: ExpeditionBattleState): ExpeditionBattleResult {
  const stage = stageFor(battle.stageId);
  const mitigatedPressure = Math.max(0, stage.pressure - battle.pressureGuard / 18);
  return {
    stageId: battle.stageId,
    score: Math.max(0, Math.floor(battle.score)),
    grade: expeditionGrade(battle.score, stage.target),
    fatigueDelta: Math.max(0, Math.round(mitigatedPressure * 0.72)),
    stressDelta: Math.max(0, Math.round(mitigatedPressure * 0.48)),
  };
}
