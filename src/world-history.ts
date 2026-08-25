import {isV3Record,uniqueRegistered} from './v3-state-sanitize';

export const worldFactIds=[
  'festival_saved','festival_heavy_losses','ancient_route_opened','ancient_route_sealed','ancient_route_limited',
  'eiden_central_command','regional_alliance','forbidden_relic_used','forbidden_relic_destroyed','rift_stabilized','rift_unstable',
  'caretaker_critical_person_saved','caretaker_risk_shared','caretaker_team_solution','coalition_command','forbidden_relic_controlled',
  'true_path_echoes_aligned','true_path_world_rewoven','true_path_cycle_rejoined','true_path_cost_borne',
  'hollow_shortcut_taken','hollow_rift_entrenched',
] as const;

export type WorldFactId=typeof worldFactIds[number];
export type WorldHistoryState={currentFacts:WorldFactId[];inheritedFacts:WorldFactId[]};

export const emptyWorldHistoryState=():WorldHistoryState=>({currentFacts:[],inheritedFacts:[]});

export function hydrateWorldHistoryState(raw:unknown):WorldHistoryState{
  const source=isV3Record(raw)?raw:{};
  return {
    currentFacts:uniqueRegistered(source.currentFacts,worldFactIds),
    inheritedFacts:uniqueRegistered(source.inheritedFacts,worldFactIds),
  };
}
