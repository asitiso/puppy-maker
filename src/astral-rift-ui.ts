import type { GameState } from './game';
import { astralRiftDefinitions, astralRiftPower, canEnterAstralRift, type AstralRiftIntensity } from './astral-rift';
import { astralRiftRelics } from './astral-rift-relics';
import { astralRiftWeeklyDirectives, astralRiftWeeklyKey } from './astral-rift-weekly';
import { astralRiftHonors, astralRiftHonorProgress } from './astral-rift-honors';
import { callingMasteryLevel } from './calling-mastery';
import { celestialAscensionProgress, celestialAscensionRank } from './celestial-ascension';
import { sanctuaryGrandProgress } from './sanctuary-grand-milestones';

function sanctuaryScore(state:GameState) {
  return sanctuaryGrandProgress({
    levels:state.sanctuaryLevels,
    specializationCount:Object.keys(state.sanctuarySpecializations ?? {}).length,
    masterworkCount:state.sanctuaryMasterworks?.length ?? 0,
    prestige:state.sanctuaryPrestige ?? 0,
  });
}

function ascensionScore(state:GameState) {
  return celestialAscensionProgress({
    trialRecords:state.astralTrialRecords ?? [],
    blessingCount:state.purchasedAstralBlessings?.length ?? 0,
    constellationCount:state.sanctuaryConstellations?.length ?? 0,
    sanctuaryGrandProgress:sanctuaryScore(state),
  });
}

export function astralRiftUiSummary(state:GameState) {
  const ascension = ascensionScore(state);
  const callingLevel = state.activeCalling ? callingMasteryLevel(state.callingMastery?.[state.activeCalling] ?? 0) : 0;
  const power = astralRiftPower({
    ascensionScore:ascension,
    sanctuaryGrandProgress:sanctuaryScore(state),
    callingMasteryLevel:callingLevel,
    blessingCount:state.purchasedAstralBlessings?.length ?? 0,
  });
  const rifts = astralRiftDefinitions.map(rift => ({
    ...rift,
    intensities:([1,2,3] as AstralRiftIntensity[]).map(intensity => {
      const record = state.astralRiftRecords[`${rift.id}:${intensity}`];
      return {
        intensity,
        available:canEnterAstralRift({ riftId:rift.id, intensity, ascensionScore:ascension, records:state.astralRiftRecords }),
        grade:record?.grade ?? null,
        bestPower:record?.bestPower ?? null,
        clearCount:record?.clearCount ?? 0,
      };
    }),
  }));
  const weekKey = astralRiftWeeklyKey(state.year,state.month,state.week);
  const weeklyProgress = state.astralRiftWeeklyKey === weekKey ? state.astralRiftWeeklyProgress : {};
  const directives = astralRiftWeeklyDirectives(state.year,state.month,state.week).map(item => ({
    ...item,
    current:Math.min(item.target,Math.max(0,Math.floor(weeklyProgress[item.id] ?? 0))),
    rewarded:state.rewardedAstralRiftDirectives.includes(`${weekKey}:${item.id}`),
  }));
  const purchased = new Set(state.purchasedAstralRiftRelics);
  const relics = astralRiftRelics.map(item => {
    const owned = purchased.has(item.id);
    const available = !owned && (!item.prerequisite || purchased.has(item.prerequisite));
    return { ...item, purchased:owned, available, canBuy:available && state.astralRiftEchoes >= item.cost };
  });
  const honorProgress = astralRiftHonorProgress(state.astralRiftRecords);
  const honors = astralRiftHonors.map(item => ({ ...item, claimed:state.claimedAstralRiftHonors.includes(item.id), progress:honorProgress }));
  return {
    power,
    echoes:state.astralRiftEchoes,
    ascension:celestialAscensionRank(ascension),
    rifts,
    directives,
    relics,
    honors,
    honorProgress,
  };
}
