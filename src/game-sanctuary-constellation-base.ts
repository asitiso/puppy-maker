export * from './game-sanctuary-grand-base';

import * as Base from './game-sanctuary-grand-base';
import {
  canUnlockConstellationNode,
  constellationEffects,
  constellationProgress,
  sanctuaryConstellationNodes,
  type SanctuaryConstellationId,
} from './sanctuary-constellations';
import { seasonJourneyKey } from './season-journey';

export type GameState = Base.GameState & { sanctuaryConstellations:SanctuaryConstellationId[] };
export type Action = Base.Action | { type:'UNLOCK_SANCTUARY_CONSTELLATION'; constellation:SanctuaryConstellationId };
export const initialState:GameState = { ...Base.initialState, sanctuaryConstellations:[] };

const validIds = sanctuaryConstellationNodes.map(node => node.id);
const isRecord = (value:unknown):value is Record<string,unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

function sanitize(raw:unknown):SanctuaryConstellationId[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((value):value is SanctuaryConstellationId => typeof value === 'string' && validIds.includes(value as SanctuaryConstellationId)))];
}

export function hydrateGameState(raw:unknown):GameState {
  const source = isRecord(raw) ? raw : {};
  return { ...Base.hydrateGameState(raw), sanctuaryConstellations:sanitize(source.sanctuaryConstellations) };
}

function progress(state:GameState) {
  return constellationProgress({
    levels:state.sanctuaryLevels,
    specializationCount:Object.keys(state.sanctuarySpecializations ?? {}).length,
    masterworkCount:state.sanctuaryMasterworks?.length ?? 0,
    prestige:state.sanctuaryPrestige ?? 0,
  });
}

function applyEffects(previous:GameState,next:GameState,action:Action):GameState {
  const effects = constellationEffects(previous.sanctuaryConstellations ?? []);
  let result = next;
  if (action.type === 'FINISH_TRAINING' && effects.trainingPercent > 0) {
    const stats = { ...result.stats };
    for (const key of ['strength','intelligence','magic','morality'] as const) {
      const delta = Math.max(0,next.stats[key] - previous.stats[key]);
      if (delta) stats[key] = Math.min(100,result.stats[key] + delta * effects.trainingPercent / 100);
    }
    result = { ...result, stats };
  }
  if (action.type === 'NEXT_MONTH') {
    const stats = { ...result.stats, fatigue:Math.max(0,result.stats.fatigue - effects.fatigueRecovery), stress:Math.max(0,result.stats.stress - effects.stressRecovery) };
    const oldKey = seasonJourneyKey(previous.year,previous.month);
    result = {
      ...result,
      stats,
      condition:Base.deriveCondition(stats),
      seasonJourneyScores:{ ...result.seasonJourneyScores, [oldKey]:(result.seasonJourneyScores[oldKey] ?? 0) + effects.monthlyJourneyBonus },
    };
  }
  if (action.type === 'FINISH_EXPEDITION_STAGE' && result.lastExpeditionResult?.accepted && effects.expeditionJourneyBonus > 0) {
    const key = seasonJourneyKey(previous.year,previous.month);
    result = { ...result, seasonJourneyScores:{ ...result.seasonJourneyScores, [key]:(result.seasonJourneyScores[key] ?? 0) + effects.expeditionJourneyBonus } };
  }
  return result;
}

export function reducer(state:GameState,action:Action):GameState {
  if (action.type === 'RESET') return initialState;
  if (action.type === 'UNLOCK_SANCTUARY_CONSTELLATION') {
    const result = canUnlockConstellationNode(action.constellation,state.sanctuaryConstellations ?? [],progress(state));
    if (!result.accepted) return state;
    return { ...state, sanctuaryConstellations:[...(state.sanctuaryConstellations ?? []),action.constellation] };
  }
  const baseNext = Base.reducer(state,action as Base.Action);
  if (baseNext === state) return state;
  const next:GameState = { ...baseNext, sanctuaryConstellations:state.sanctuaryConstellations ?? [] };
  return applyEffects(state,next,action);
}
