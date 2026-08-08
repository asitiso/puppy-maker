export * from './game-sanctuary-masterwork-base';

import * as Base from './game-sanctuary-masterwork-base';
import {
  canBuildSanctuaryMasterwork,
  sanctuaryMasterworkEffects,
  sanctuaryMasterworks as sanctuaryMasterworkDefinitions,
  sanctuaryMasterworkSetReward,
  type SanctuaryMasterworkId,
} from './sanctuary-masterworks';
import {
  journeyTierClaimKey,
  newlyEarnedJourneyTiers,
  seasonJourneyKey,
} from './season-journey';

export type GameState = Base.GameState & {
  sanctuaryMasterworks:ReadonlyArray<SanctuaryMasterworkId>;
};

export type Action = Base.Action | { type:'BUILD_SANCTUARY_MASTERWORK'; masterwork:SanctuaryMasterworkId };

export const initialState:GameState = {
  ...Base.initialState,
  sanctuaryMasterworks:[],
};

const masterworkIds = sanctuaryMasterworkDefinitions.map(item => item.id);
const isRecord = (value:unknown):value is Record<string,unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

function sanitizeMasterworks(raw:unknown):SanctuaryMasterworkId[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((value):value is SanctuaryMasterworkId =>
    typeof value === 'string' && masterworkIds.includes(value as SanctuaryMasterworkId)
  ))];
}

export function hydrateGameState(raw:unknown):GameState {
  const source = isRecord(raw) ? raw : {};
  return {
    ...Base.hydrateGameState(raw),
    sanctuaryMasterworks:sanitizeMasterworks(source.sanctuaryMasterworks),
  };
}

function applyJourneyBonus(next:GameState,key:ReturnType<typeof seasonJourneyKey>,bonus:number):GameState {
  if (bonus <= 0) return next;
  const before = next.seasonJourneyScores[key] ?? 0;
  const score = before + bonus;
  const earned = newlyEarnedJourneyTiers(before,score,next.claimedSeasonJourneyTiers,key);
  const claims = [...next.claimedSeasonJourneyTiers];
  let gold = 0;
  let gems = 0;
  let tokens = 0;
  for (const tier of earned) {
    claims.push(journeyTierClaimKey(key,tier.tier));
    gold += tier.reward.gold;
    gems += tier.reward.gems;
    tokens += tier.reward.tokens;
  }
  return {
    ...next,
    seasonJourneyScores:{ ...next.seasonJourneyScores, [key]:score },
    claimedSeasonJourneyTiers:claims,
    seasonTokenBalances:{ ...next.seasonTokenBalances, [key]:(next.seasonTokenBalances[key] ?? 0) + tokens },
    gold:next.gold + gold,
    gems:next.gems + gems,
    lastLiveOpsProgress:next.lastLiveOpsProgress ? {
      ...next.lastLiveOpsProgress,
      journeyPoints:next.lastLiveOpsProgress.journeyPoints + bonus,
      seasonTiersClaimed:[...new Set([...next.lastLiveOpsProgress.seasonTiersClaimed,...earned.map(item => item.tier)])],
      tokensEarned:next.lastLiveOpsProgress.tokensEarned + tokens,
    } : next.lastLiveOpsProgress,
  };
}

function applyMasterworkEffects(previous:GameState,next:GameState,action:Action):GameState {
  const effects = sanctuaryMasterworkEffects(previous.sanctuaryMasterworks ?? []);
  let result = next;

  if (action.type === 'FINISH_TRAINING') {
    if (effects.trainingPercent > 0) {
      const stats = { ...result.stats };
      for (const key of ['strength','intelligence','magic','morality'] as const) {
        const delta = Math.max(0,next.stats[key] - previous.stats[key]);
        if (delta > 0) stats[key] = Math.min(100,result.stats[key] + delta * effects.trainingPercent / 100);
      }
      result = { ...result, stats };
    }
    if (effects.weeklyTokenBonus > 0 && (result.lastLiveOpsProgress?.weeklyCompleted.length ?? 0) > 0) {
      const key = seasonJourneyKey(previous.year,previous.month);
      result = {
        ...result,
        seasonTokenBalances:{ ...result.seasonTokenBalances, [key]:(result.seasonTokenBalances[key] ?? 0) + effects.weeklyTokenBonus },
        lastLiveOpsProgress:result.lastLiveOpsProgress ? {
          ...result.lastLiveOpsProgress,
          tokensEarned:result.lastLiveOpsProgress.tokensEarned + effects.weeklyTokenBonus,
        } : result.lastLiveOpsProgress,
      };
    }
  }

  if (action.type === 'NEXT_MONTH' && (effects.fatigueRecovery || effects.stressRecovery)) {
    const stats = {
      ...result.stats,
      fatigue:Math.max(0,result.stats.fatigue - effects.fatigueRecovery),
      stress:Math.max(0,result.stats.stress - effects.stressRecovery),
    };
    result = { ...result, stats, condition:Base.deriveCondition(stats) };
  }

  if (action.type === 'FINISH_EXPEDITION_STAGE' && result.lastExpeditionResult?.accepted && effects.expeditionJourneyBonus > 0) {
    result = applyJourneyBonus(result,seasonJourneyKey(previous.year,previous.month),effects.expeditionJourneyBonus);
  }

  return result;
}

export function reducer(state:GameState,action:Action):GameState {
  if (action.type === 'RESET') return initialState;

  if (action.type === 'BUILD_SANCTUARY_MASTERWORK') {
    const result = canBuildSanctuaryMasterwork({
      id:action.masterwork,
      levels:state.sanctuaryLevels,
      specializations:state.sanctuarySpecializations,
      completed:state.sanctuaryMasterworks ?? [],
      gold:state.gold,
      materials:state.expeditionMaterials,
    });
    if (!result.accepted) return state;
    const completed = [...(state.sanctuaryMasterworks ?? []),action.masterwork];
    const setReward = sanctuaryMasterworkSetReward(completed) ?? { gold:0, gems:0 };
    const cost = result.definition.cost;
    return {
      ...state,
      sanctuaryMasterworks:completed,
      gold:state.gold - cost.gold + result.definition.reward.gold + setReward.gold,
      gems:state.gems + result.definition.reward.gems + setReward.gems,
      expeditionMaterials:{
        star_bark:state.expeditionMaterials.star_bark - cost.materials.star_bark,
        arcane_shard:state.expeditionMaterials.arcane_shard - cost.materials.arcane_shard,
        wind_pearl:state.expeditionMaterials.wind_pearl - cost.materials.wind_pearl,
      },
    };
  }

  const effects = sanctuaryMasterworkEffects(state.sanctuaryMasterworks ?? []);
  const oldSeasonKey = seasonJourneyKey(state.year,state.month);
  const baseInput = action.type === 'NEXT_MONTH' && effects.monthlyJourneyBonus > 0
    ? applyJourneyBonus(state,oldSeasonKey,effects.monthlyJourneyBonus)
    : state;
  const baseNext = Base.reducer(baseInput,action as Base.Action);
  if (baseNext === baseInput) return state;
  let next:GameState = { ...baseNext, sanctuaryMasterworks:state.sanctuaryMasterworks ?? [] };
  next = applyMasterworkEffects(state,next,action);
  return next;
}
