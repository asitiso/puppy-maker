const campaignSeasonalObjectiveClaimTriples = new Set([
  'spring:caretaker:spring_caretaker_bond',
  'spring:caretaker:spring_caretaker_guardianship',
  'spring:pathfinder:spring_pathfinder_discovery',
  'spring:pathfinder:spring_pathfinder_frontier',
  'spring:vanguard:spring_vanguard_challenge',
  'spring:vanguard:spring_vanguard_streak',
  'spring:arcanist:spring_arcanist_relic',
  'spring:arcanist:spring_arcanist_resonance',
  'summer:caretaker:summer_caretaker_rescue',
  'summer:caretaker:summer_caretaker_recovery',
  'summer:pathfinder:summer_pathfinder_uncharted',
  'summer:pathfinder:summer_pathfinder_limited_route',
  'summer:vanguard:summer_vanguard_elite',
  'summer:vanguard:summer_vanguard_chain',
  'summer:arcanist:summer_arcanist_rift',
  'summer:arcanist:summer_arcanist_rule_shift',
]);

export function isValidCampaignSeasonalObjectiveClaimKey(value:unknown):value is string {
  if(typeof value!=='string') return false;
  const match=/^([1-9]\d*)-(spring|summer):(caretaker|pathfinder|vanguard|arcanist):([a-z0-9_]+)$/.exec(value);
  if(!match) return false;
  return campaignSeasonalObjectiveClaimTriples.has(`${match[2]}:${match[3]}:${match[4]}`);
}

export function sanitizeCampaignSeasonalObjectiveClaimKeys(raw:unknown):string[] {
  if(!Array.isArray(raw)) return [];
  return [...new Set(raw.filter(isValidCampaignSeasonalObjectiveClaimKey))];
}
