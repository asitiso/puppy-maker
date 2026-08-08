export * from './game-live-base';

import * as Base from './game-base';
import * as Live from './game-live-base';
import {
  journeyTierClaimKey,
  newlyEarnedJourneyTiers,
  seasonJourneyKey,
} from './season-journey';
import {
  advanceWeeklyDirectives,
  weeklyDirectiveKey,
  weeklyDirectives,
} from './weekly-directives';

export function reducer(state:Live.GameState, action:Live.Action):Live.GameState {
  if (action.type !== 'FINISH_TRAINING') return Live.reducer(state,action);

  const baseNext = Base.reducer(state,action as Base.Action);
  if (baseNext === state) return state;
  const next:Live.GameState = { ...state, ...baseNext };
  const weekKey = weeklyDirectiveKey(state.year,state.month,state.week);
  const directives = weeklyDirectives(state.year,state.month,state.week);
  const progress = state.weeklyDirectiveKey === weekKey ? state.weeklyDirectiveProgress : {};
  const weekly = advanceWeeklyDirectives(
    directives,
    progress,
    { kind:'training' },
    state.rewardedWeeklyDirectives,
    weekKey,
  );
  const journeyKey = seasonJourneyKey(state.year,state.month);
  const previousScore = state.seasonJourneyScores[journeyKey] ?? 0;
  const nextScore = previousScore + weekly.reward.journeyPoints;
  const earnedTiers = newlyEarnedJourneyTiers(previousScore,nextScore,state.claimedSeasonJourneyTiers,journeyKey);
  const claims = [...state.claimedSeasonJourneyTiers];
  const rewardedWeekly = [...state.rewardedWeeklyDirectives];
  let gold = 0;
  let gems = 0;
  let tierTokens = 0;
  for (const tier of earnedTiers) {
    claims.push(journeyTierClaimKey(journeyKey,tier.tier));
    gold += tier.reward.gold;
    gems += tier.reward.gems;
    tierTokens += tier.reward.tokens;
  }
  for (const directive of weekly.completed) {
    const rewardKey = `${weekKey}:${directive.id}`;
    if (!rewardedWeekly.includes(rewardKey)) rewardedWeekly.push(rewardKey);
  }
  const tokensEarned = tierTokens + weekly.reward.tokens;
  return {
    ...next,
    seasonJourneyScores:{ ...state.seasonJourneyScores, [journeyKey]:nextScore },
    claimedSeasonJourneyTiers:claims,
    seasonTokenBalances:{ ...state.seasonTokenBalances, [journeyKey]:(state.seasonTokenBalances[journeyKey] ?? 0) + tokensEarned },
    weeklyDirectiveKey:weekKey,
    weeklyDirectiveProgress:weekly.progress,
    rewardedWeeklyDirectives:rewardedWeekly,
    seasonJourneyHistory:state.seasonJourneyHistory,
    gold:next.gold + gold,
    gems:next.gems + gems,
    lastLiveOpsProgress:{
      journeyPoints:weekly.reward.journeyPoints,
      seasonTiersClaimed:earnedTiers.map(tier => tier.tier),
      weeklyCompleted:weekly.completed.map(item => item.id),
      tokensEarned,
    },
  };
}
