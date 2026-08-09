import type { GameState } from './game';
import {
  astralRiftClearCount,
  canEnterConvergence,
  celestialGuardianDefinitions,
  convergencePower,
  type ConvergenceIntensity,
} from './celestial-convergence';
import { callingMasteryLevel } from './calling-mastery';
import { celestialAscensionProgress } from './celestial-ascension';
import { convergenceHonors } from './convergence-honors';
import { convergenceWeeklyDirectives, convergenceWeeklyKey } from './convergence-weekly';
import { guardianBoons } from './guardian-boons';
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

function honorProgress(state:GameState,id:string) {
  const guardians = celestialGuardianDefinitions.map(item => item.id);
  const records = state.celestialConvergenceRecords;
  if (id === 'first_convergence') return { current:Object.keys(records).length ? 1 : 0, target:1 };
  if (id === 'four_guardians') return { current:guardians.filter(guardian => [1,2,3].some(intensity => records[`${guardian}:${intensity}`])).length, target:4 };
  if (id === 'intensity_three_quartet') return { current:guardians.filter(guardian => records[`${guardian}:3`]).length, target:4 };
  const sCount = guardians.reduce((sum,guardian) => sum + [1,2,3].filter(intensity => records[`${guardian}:${intensity}`]?.grade === 'S').length,0);
  return { current:sCount, target:12 };
}

export function convergenceUiSummary(state:GameState) {
  const ascension = ascensionScore(state);
  const sanctuary = sanctuaryScore(state);
  const callingLevel = state.activeCalling ? callingMasteryLevel(state.callingMastery?.[state.activeCalling] ?? 0) : 0;
  const riftClears = astralRiftClearCount(state.astralRiftRecords);
  const riftRelicCount = state.purchasedAstralRiftRelics.length;
  const guardians = celestialGuardianDefinitions.map(guardian => ({
    ...guardian,
    power:convergencePower({
      ascensionScore:ascension,
      sanctuaryGrandProgress:sanctuary,
      callingMasteryLevel:callingLevel,
      astralRiftClearCount:riftClears,
      riftRelicCount,
      activeCalling:state.activeCalling,
      guardianId:guardian.id,
    }),
    intensities:([1,2,3] as ConvergenceIntensity[]).map(intensity => {
      const record = state.celestialConvergenceRecords[`${guardian.id}:${intensity}`];
      return {
        intensity,
        available:canEnterConvergence({ guardianId:guardian.id, intensity, riftRecords:state.astralRiftRecords, riftRelicCount }),
        grade:record?.grade ?? null,
        bestPower:record?.bestPower ?? null,
        clearCount:record?.clearCount ?? 0,
      };
    }),
  }));

  const weekKey = convergenceWeeklyKey(state.year,state.month,state.week);
  const weeklyProgress = state.convergenceWeeklyKey === weekKey ? state.convergenceWeeklyProgress : {};
  const directives = convergenceWeeklyDirectives(state.year,state.month,state.week).map(item => ({
    ...item,
    current:Math.min(item.target,Math.max(0,Math.floor(weeklyProgress[item.id] ?? 0))),
    rewarded:state.rewardedConvergenceDirectives.includes(`${weekKey}:${item.id}`),
  }));

  const purchased = new Set(state.purchasedGuardianBoons);
  const boons = guardianBoons.map(item => {
    const owned = purchased.has(item.id);
    const available = !owned && (!item.prerequisite || purchased.has(item.prerequisite));
    return { ...item, purchased:owned, available, canBuy:available && state.guardianSigils >= item.cost };
  });

  const honors = convergenceHonors.map(item => ({
    ...item,
    claimed:state.claimedConvergenceHonors.includes(item.id),
    ...honorProgress(state,item.id),
  }));

  return { sigils:state.guardianSigils, ascensionScore:ascension, sanctuaryScore:sanctuary, riftClears, guardians, directives, boons, honors };
}
