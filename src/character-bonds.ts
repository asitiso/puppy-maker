import {characterIds,type CharacterId} from './campaign-model';
import {isV3Record,safeNonNegativeInt,uniqueRegistered} from './v3-state-sanitize';

export type CharacterBondState={trust:number;conflicts:string[];promises:string[];memories:string[]};
export type CharacterBondsState=Record<CharacterId,CharacterBondState>;
type Registry={conflicts:readonly string[];promises:readonly string[];memories:readonly string[]};

export const characterBondIdRegistry:Record<CharacterId,Registry>={
  mira:{conflicts:['mira_self_sacrifice'],promises:['mira_share_the_burden'],memories:['mira_festival_rescue','mira_long_night']},
  kael:{conflicts:[],promises:[],memories:[]},
  rex:{conflicts:['rex_obsession_with_victory'],promises:['rex_fair_rivalry'],memories:['rex_first_defeat','rex_tournament_final']},
  selene:{conflicts:[],promises:[],memories:[]},noa:{conflicts:[],promises:[],memories:[]},
  eiden:{conflicts:[],promises:[],memories:[]},lyra:{conflicts:[],promises:[],memories:[]},veyr:{conflicts:[],promises:[],memories:[]},
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
