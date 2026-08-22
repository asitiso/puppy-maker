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

export const characterBondIdRegistry:Record<CharacterId,Registry>={
  mira:{
    conflicts:['mira_self_sacrifice','mira_summer_overextended_rescue'],
    promises:['mira_share_the_burden','mira_summer_share_responsibility'],
    memories:['mira_first_commitment','mira_festival_rescue',...festivalMemories('mira'),'mira_long_night'],
  },
  kael:{
    conflicts:['kael_summer_crossed_boundary'],
    promises:['kael_summer_respect_boundaries'],
    memories:['kael_first_commitment',...festivalMemories('kael')],
  },
  rex:{
    conflicts:['rex_obsession_with_victory','rex_summer_victory_at_cost'],
    promises:['rex_fair_rivalry','rex_summer_lead_together'],
    memories:['rex_first_commitment','rex_first_defeat',...festivalMemories('rex'),'rex_tournament_final'],
  },
  selene:{
    conflicts:['selene_summer_forbidden_overreach'],
    promises:['selene_summer_restrain_power'],
    memories:['selene_first_commitment',...festivalMemories('selene')],
  },
  noa:{conflicts:[],promises:[],memories:[]},eiden:{conflicts:[],promises:[],memories:[]},
  lyra:{conflicts:[],promises:[],memories:[]},veyr:{conflicts:[],promises:[],memories:[]},
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
