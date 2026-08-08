import type { GameState } from './game';
import { sanctuaryContractSet, sanctuaryPrestigeRank } from './sanctuary-contracts';

export function sanctuaryContractUiSummary(state:GameState) {
  const key = `${state.year}-${state.month}-${state.week}`;
  const progress = state.sanctuaryContractWeekKey === key ? state.sanctuaryContractProgress : {};
  const rewarded = state.rewardedSanctuaryContracts ?? [];
  const contracts = sanctuaryContractSet(state.year,state.month,state.week,state.sanctuaryLevels).map(contract => {
    const current = Math.min(contract.target,Math.max(0,Math.floor(progress[contract.id] ?? 0)));
    return {
      ...contract,
      current,
      completed:rewarded.includes(`${key}:${contract.id}`) || current >= contract.target,
      progressPercent:Math.min(100,Math.floor(current / contract.target * 100)),
    };
  });
  return {
    weekKey:key,
    prestige:sanctuaryPrestigeRank(state.sanctuaryPrestige ?? 0),
    claimedRanks:state.claimedSanctuaryPrestigeRanks ?? [],
    contracts,
  };
}
