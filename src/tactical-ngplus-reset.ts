import type { CompanionBondState, CompanionId } from './tactical-companions';
import type { TacticalBattleRecord, TacticalEncounterId } from './tactical-encounters';
import { createTacticalTerminalHandoffState, type TacticalTerminalHandoffState } from './tactical-scenario';
import { emptyTacticalPersistentState } from './tactical-state';

export type TacticalNgPlusResetState = Readonly<{
  tacticalBattleRecords: Partial<Record<TacticalEncounterId, TacticalBattleRecord>>;
  claimedTacticalFirstClears: readonly TacticalEncounterId[];
  selectedTacticalCompanions: readonly CompanionId[];
  tacticalCompanionBonds: Readonly<Record<CompanionId, CompanionBondState>>;
  tacticalAutoBattle: boolean;
  tacticalBattleSpeed: 1 | 2;
}>;

export type TacticalNgPlusRuntimeState = Readonly<{
  terminalHandoff: TacticalTerminalHandoffState;
}>;

export function resetTacticalForNgPlus(state: TacticalNgPlusResetState): TacticalNgPlusResetState {
  const defaults = emptyTacticalPersistentState();
  return {
    tacticalBattleRecords: {},
    claimedTacticalFirstClears: [],
    selectedTacticalCompanions: [],
    tacticalCompanionBonds: defaults.companionBonds,
    tacticalAutoBattle: state.tacticalAutoBattle === true,
    tacticalBattleSpeed: state.tacticalBattleSpeed === 2 ? 2 : 1,
  };
}

export function createTacticalNgPlusRuntimeState(): TacticalNgPlusRuntimeState {
  return { terminalHandoff: createTacticalTerminalHandoffState() };
}
