import type { SeasonLegacyNodeId } from './season-legacy-board';

export type SeasonLegacyEffects = {
  monthlyJourneyBonus:number;
  weeklyTokenBonus:number;
  expeditionJourneyBonus:number;
};

export type SeasonLegacyCrownSynergy = SeasonLegacyEffects & {
  crowns:number;
  label:'왕관 공명 대기'|'쌍왕관 공명'|'삼중 왕관 공명';
  nextCrowns:2|3|null;
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

export function seasonLegacyCrownSynergy(unlocked:SeasonLegacyNodeId[]):SeasonLegacyCrownSynergy {
  const unique = [...new Set(unlocked)];
  const crowns = ['chronicle_crown','bond_crown','expedition_crown'] as const;
  const count = crowns.filter(id => unique.includes(id)).length;
  if (count >= 3) return {
    crowns:3,
    label:'삼중 왕관 공명',
    nextCrowns:null,
    monthlyJourneyBonus:8,
    weeklyTokenBonus:2,
    expeditionJourneyBonus:4,
  };
  if (count >= 2) return {
    crowns:2,
    label:'쌍왕관 공명',
    nextCrowns:3,
    monthlyJourneyBonus:3,
    weeklyTokenBonus:1,
    expeditionJourneyBonus:2,
  };
  return {
    crowns:count,
    label:'왕관 공명 대기',
    nextCrowns:2,
    monthlyJourneyBonus:0,
    weeklyTokenBonus:0,
    expeditionJourneyBonus:0,
  };
}

export function seasonLegacyEffects(unlocked:SeasonLegacyNodeId[]):SeasonLegacyEffects {
  const unique = [...new Set(unlocked)];
  const base = unique.reduce<SeasonLegacyEffects>((result,id) => ({
    monthlyJourneyBonus:result.monthlyJourneyBonus + (chronicleBonus[id] ?? 0),
    weeklyTokenBonus:result.weeklyTokenBonus + (bondBonus[id] ?? 0),
    expeditionJourneyBonus:result.expeditionJourneyBonus + (expeditionBonus[id] ?? 0),
  }),{ monthlyJourneyBonus:0, weeklyTokenBonus:0, expeditionJourneyBonus:0 });
  const synergy = seasonLegacyCrownSynergy(unique);
  return {
    monthlyJourneyBonus:base.monthlyJourneyBonus + synergy.monthlyJourneyBonus,
    weeklyTokenBonus:base.weeklyTokenBonus + synergy.weeklyTokenBonus,
    expeditionJourneyBonus:base.expeditionJourneyBonus + synergy.expeditionJourneyBonus,
  };
}
