import type { SeasonLegacyNodeId } from './season-legacy-board';

export type SeasonLegacyEffects = {
  monthlyJourneyBonus:number;
  weeklyTokenBonus:number;
  expeditionJourneyBonus:number;
};

const chronicleBonus:Partial<Record<SeasonLegacyNodeId,number>> = {
  chronicle_seed:3,
  chronicle_keeper:5,
  chronicle_crown:7,
};
const bondBonus:Partial<Record<SeasonLegacyNodeId,number>> = {
  bond_seed:1,
  bond_keeper:1,
  bond_crown:1,
};
const expeditionBonus:Partial<Record<SeasonLegacyNodeId,number>> = {
  expedition_seed:2,
  expedition_keeper:3,
  expedition_crown:4,
};

function crownSynergy(unlocked:SeasonLegacyNodeId[]):SeasonLegacyEffects {
  const crowns = ['chronicle_crown','bond_crown','expedition_crown'] as const;
  const count = crowns.filter(id => unlocked.includes(id)).length;
  if (count >= 3) return { monthlyJourneyBonus:8, weeklyTokenBonus:2, expeditionJourneyBonus:4 };
  if (count >= 2) return { monthlyJourneyBonus:3, weeklyTokenBonus:1, expeditionJourneyBonus:2 };
  return { monthlyJourneyBonus:0, weeklyTokenBonus:0, expeditionJourneyBonus:0 };
}

export function seasonLegacyEffects(unlocked:SeasonLegacyNodeId[]):SeasonLegacyEffects {
  const unique = [...new Set(unlocked)];
  const base = unique.reduce<SeasonLegacyEffects>((result,id) => ({
    monthlyJourneyBonus:result.monthlyJourneyBonus + (chronicleBonus[id] ?? 0),
    weeklyTokenBonus:result.weeklyTokenBonus + (bondBonus[id] ?? 0),
    expeditionJourneyBonus:result.expeditionJourneyBonus + (expeditionBonus[id] ?? 0),
  }),{ monthlyJourneyBonus:0, weeklyTokenBonus:0, expeditionJourneyBonus:0 });
  const synergy = crownSynergy(unique);
  return {
    monthlyJourneyBonus:base.monthlyJourneyBonus + synergy.monthlyJourneyBonus,
    weeklyTokenBonus:base.weeklyTokenBonus + synergy.weeklyTokenBonus,
    expeditionJourneyBonus:base.expeditionJourneyBonus + synergy.expeditionJourneyBonus,
  };
}
