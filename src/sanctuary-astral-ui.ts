import type { GameState } from './game';
import { astralBlessings, resolveAstralBlessingPurchase } from './sanctuary-astral-blessings';
import { astralTrialFor, astralTrialPower } from './sanctuary-astral-trials';
import { constellationProgress } from './sanctuary-constellations';

function previewGrade(power:number) {
  return power >= 105 ? 'S' as const : power >= 80 ? 'A' as const : 'B' as const;
}

export function sanctuaryAstralUiSummary(state:GameState) {
  const trial = astralTrialFor(state.year,state.month);
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
    constellationCount:(state.sanctuaryConstellations ?? []).length,
  });
  const key = `${state.year}-${state.month}:${trial.id}`;
  const unlocked = (state.sanctuaryConstellations ?? []).includes(trial.requiredConstellation);
  const claimed = (state.claimedAstralTrials ?? []).includes(key);
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
  const recentRecords = [...(state.astralTrialRecords ?? [])].slice(-6).reverse();
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
  };
}
