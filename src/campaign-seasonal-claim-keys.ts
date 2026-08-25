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
  'autumn:caretaker:autumn_caretaker_guardianship',
  'autumn:caretaker:autumn_caretaker_bond',
  'autumn:pathfinder:autumn_pathfinder_route',
  'autumn:pathfinder:autumn_pathfinder_limited_access',
  'autumn:vanguard:autumn_vanguard_command',
  'autumn:vanguard:autumn_vanguard_coalition',
  'autumn:arcanist:autumn_arcanist_relic',
  'autumn:arcanist:autumn_arcanist_control',
  'winter:caretaker:winter_caretaker_protection',
  'winter:caretaker:winter_caretaker_shared_burden',
  'winter:pathfinder:winter_pathfinder_route',
  'winter:pathfinder:winter_pathfinder_route_memory',
  'winter:vanguard:winter_vanguard_command',
  'winter:vanguard:winter_vanguard_elite_chain',
  'winter:arcanist:winter_arcanist_reality',
  'winter:arcanist:winter_arcanist_control',
  'summer:true_path:fifth_summer_echo_convergence',
  'autumn:true_path:fifth_autumn_world_reweave',
  'winter:true_path:fifth_winter_last_possibility',
  'summer:hollow:hollow_summer_predatory_shortcut',
  'autumn:hollow:hollow_autumn_rift_bargain',
  'winter:hollow:hollow_winter_veyr_convergence',
]);

export function isValidCampaignSeasonalObjectiveClaimKey(value:unknown):value is string {
  if(typeof value!=='string') return false;
  const match=/^([1-9]\d*)-(spring|summer|autumn|winter):(caretaker|pathfinder|vanguard|arcanist|true_path|hollow):([a-z0-9_]+)$/.exec(value);
  if(!match) return false;
  return campaignSeasonalObjectiveClaimTriples.has(`${match[2]}:${match[3]}:${match[4]}`);
}

export function sanitizeCampaignSeasonalObjectiveClaimKeys(raw:unknown):string[] {
  if(!Array.isArray(raw)) return [];
  return [...new Set(raw.filter(isValidCampaignSeasonalObjectiveClaimKey))];
}
