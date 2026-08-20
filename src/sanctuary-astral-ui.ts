import type { GameState } from './game';
import {
  celestialAscensionProgress,
  celestialAscensionRank,
  celestialAscensionRewards,
} from './celestial-ascension';
import { celestialRecordProgress } from './celestial-records';
import { astralBlessings, resolveAstralBlessingPurchase } from './sanctuary-astral-blessings';
import { eligibleAstralTrialFor, astralTrialPower } from './sanctuary-astral-trials';
import { constellationProgress } from './sanctuary-constellations';

function previewGrade(power:number) {
  return power >= 105 ? 'S' as const : power >= 80 ? 'A' as const : 'B' as const;
}

export function sanctuaryAstralUiSummary(state:GameState) {
  const constellations = state.sanctuaryConstellations ?? [];
  const trial = eligibleAstralTrialFor(state.year,state.month,constellations);
  const progress = constellationProgress({
    levels:state.sanctuaryLevels,
    specializationCount:Object.keys(state.sanctuarySpecializations ?? {}).length,
    masterworkCount:state.sanctuaryMasterworks?.length ?? 0,
    prestige:state.sanctuaryPrestige ?? 0,
  });
  const power = astralTrialPower({
    trial:trial.id,
    stats:{
      strength:state.stats.strength,
      intelligence:state.stats.intelligence,
      magic:state.stats.magic,
      morality:state.stats.morality,
    },
    sanctuaryProgress:progress,
    constellationCount:constellations.length,
  });
  const key = `${state.year}-${state.month}:${trial.id}`;
  const monthPrefix = `${state.year}-${state.month}:`;
  const unlocked = constellations.includes(trial.requiredConstellation);
  const claimed = (state.claimedAstralTrials ?? []).some(claimKey => claimKey.startsWith(monthPrefix));
  const starShards = Math.max(0,Math.floor(state.astralStarShards ?? 0));
  const purchased = state.purchasedAstralBlessings ?? [];
  const trialKeys = state.claimedAstralTrials ?? [];
  const blessings = astralBlessings.map(item => {
    const trialCleared = trialKeys.some(claimKey => claimKey.endsWith(`:${item.requiredTrial}`));
    const isPurchased = purchased.includes(item.id);
    const purchase = resolveAstralBlessingPurchase({ blessing:item.id, shards:starShards, purchased, trialKeys });
    return {
      ...item,
      trialCleared,
      purchased:isPurchased,
      canBuy:purchase.accepted,
    };
  });
  const records = state.astralTrialRecords ?? [];
  const recentRecords = [...records].slice(-6).reverse();
  const recordProgress = celestialRecordProgress(records);
  const ascensionScore = celestialAscensionProgress({
    trialRecords:records,
    blessingCount:purchased.length,
    constellationCount:constellations.length,
    sanctuaryGrandProgress:progress,
  });
  const ascensionRank = celestialAscensionRank(ascensionScore);
  const claimedAscension = state.claimedCelestialAscensionRanks ?? [];
  const ascensionRewards = celestialAscensionRewards.map(item => ({
    ...item,
    claimed:claimedAscension.includes(item.rank),
    reached:ascensionScore >= item.threshold,
  }));
  const nextAscensionReward = ascensionRewards.find(item => !item.claimed) ?? null;
  return {
    progress,
    starShards,
    trial:{
      ...trial,
      key,
      power,
      previewGrade:previewGrade(power),
      unlocked,
      claimed,
      canChallenge:unlocked && !claimed,
    },
    blessings,
    recentRecords,
    ascension:{
      score:ascensionScore,
      rank:ascensionRank,
      components:{
        trialClears:Math.min(12,records.length),
        uniqueSClears:Math.min(4,recordProgress.uniqueSClears),
        blessings:Math.min(4,purchased.length),
        constellations:Math.min(5,constellations.length),
        sanctuaryProgress:progress,
      },
      rewards:ascensionRewards,
      nextReward:nextAscensionReward,
    },
  };
}
