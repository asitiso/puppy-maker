import {characterIds,type CharacterId} from './campaign-model';
import {isV3Record,safeNonNegativeInt,uniqueRegistered} from './v3-state-sanitize';

export type CharacterBondState={trust:number;conflicts:string[];promises:string[];memories:string[]};
export type CharacterBondsState=Record<CharacterId,CharacterBondState>;
type Registry={conflicts:readonly string[];promises:readonly string[];memories:readonly string[]};

const festivalMemories=(character:'mira'|'kael'|'rex'|'selene')=>[
  `${character}_summer_festival_exceptional_victory`,
  `${character}_summer_festival_victory`,
  `${character}_summer_festival_costly_victory`,
  `${character}_summer_festival_defeat`,
] as const;
const winterMemories=(character:'mira'|'kael'|'rex'|'selene')=>[
  `${character}_winter_exceptional_victory`,
  `${character}_winter_victory`,
  `${character}_winter_costly_victory`,
  `${character}_winter_defeat`,
] as const;

export const characterBondIdRegistry:Record<CharacterId,Registry>={
  mira:{
    conflicts:['mira_self_sacrifice','mira_summer_overextended_rescue','mira_autumn_single_rescue_burden','mira_winter_unresolved_tension'],
    promises:['mira_share_the_burden','mira_summer_share_responsibility','mira_autumn_shared_risk','mira_autumn_team_solution','mira_winter_shared_future'],
    memories:['mira_first_commitment','mira_festival_rescue',...festivalMemories('mira'),'mira_autumn_save_one','mira_autumn_spread_risk','mira_autumn_team_solution','mira_long_night',...winterMemories('mira')],
  },
  kael:{
    conflicts:['kael_summer_crossed_boundary','kael_autumn_route_overreach','kael_winter_unresolved_tension'],
    promises:['kael_summer_respect_boundaries','kael_autumn_guarded_boundary','kael_autumn_limited_access','kael_winter_shared_future'],
    memories:['kael_first_commitment',...festivalMemories('kael'),'kael_autumn_open_route','kael_autumn_seal_route','kael_autumn_limited_access',...winterMemories('kael')],
  },
  rex:{
    conflicts:['rex_obsession_with_victory','rex_summer_victory_at_cost','rex_autumn_command_pressure','rex_winter_unresolved_tension'],
    promises:['rex_fair_rivalry','rex_summer_lead_together','rex_autumn_shared_command','rex_autumn_coalition_command','rex_winter_shared_future'],
    memories:['rex_first_commitment','rex_first_defeat',...festivalMemories('rex'),'rex_autumn_centralize','rex_autumn_preserve_independence','rex_autumn_coalition_command','rex_tournament_final',...winterMemories('rex')],
  },
  selene:{
    conflicts:['selene_summer_forbidden_overreach','selene_autumn_forbidden_relic_cost','selene_winter_unresolved_tension'],
    promises:['selene_summer_restrain_power','selene_autumn_refuse_relic','selene_autumn_controlled_use','selene_winter_shared_future'],
    memories:['selene_first_commitment',...festivalMemories('selene'),'selene_autumn_use_relic','selene_autumn_destroy_relic','selene_autumn_controlled_use',...winterMemories('selene')],
  },
  noa:{conflicts:[],promises:[],memories:[]},eiden:{conflicts:[],promises:[],memories:[]},
  lyra:{
    conflicts:['lyra_cycle_cost'],
    promises:['lyra_choose_this_life'],
    memories:['lyra_true_path_victory','lyra_true_path_costly_victory','lyra_true_path_defeat'],
  },
  veyr:{conflicts:[],promises:[],memories:[]},
};

const emptyBond=():CharacterBondState=>({trust:0,conflicts:[],promises:[],memories:[]});
export function emptyCharacterBondsState():CharacterBondsState{
  return Object.fromEntries(characterIds.map(id=>[id,emptyBond()])) as CharacterBondsState;
}
export function hydrateCharacterBondsState(raw:unknown):CharacterBondsState{
  const source=isV3Record(raw)?raw:{};
  return Object.fromEntries(characterIds.map(id=>{
    const value=isV3Record(source[id])?source[id]:{};
    const registry=characterBondIdRegistry[id];
    return [id,{trust:safeNonNegativeInt(value.trust),conflicts:uniqueRegistered(value.conflicts,registry.conflicts),promises:uniqueRegistered(value.promises,registry.promises),memories:uniqueRegistered(value.memories,registry.memories)}];
  })) as CharacterBondsState;
}
