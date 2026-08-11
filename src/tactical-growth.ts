import type { GuardianCallingId } from './guardian-callings';
import { callingMasteryLevel } from './calling-mastery';
import type { TacticalUnit } from './tactical-battle';

export type TacticalRole = 'balanced'|'striker'|'caster'|'support'|'scout';
export type TacticalSpecialId = 'guardian_burst'|'vanguard_breaker'|'astral_burst'|'heart_sanctuary'|'starfall_mark';
export type TacticalGrowthUnit = TacticalUnit & {
  attackPower:number;
  skillPower:number;
  supportPower:number;
  role:TacticalRole;
  specialId:TacticalSpecialId;
};

export type TacticalGrowthState = {
  stats:{ strength:number; intelligence:number; magic:number; affection:number };
  activeCalling?:GuardianCallingId|null;
  callingMastery?:Partial<Record<GuardianCallingId,number>>;
};

const clamp = (value:number,min:number,max:number) => Math.max(min,Math.min(max,Math.floor(value)));
const roleByCalling:Record<GuardianCallingId,TacticalRole> = {
  vanguard:'striker', arcanist:'caster', caretaker:'support', pathfinder:'scout',
};
const specialByCalling:Record<GuardianCallingId,TacticalSpecialId> = {
  vanguard:'vanguard_breaker', arcanist:'astral_burst', caretaker:'heart_sanctuary', pathfinder:'starfall_mark',
};

export function buildRunaTacticalUnit(state:TacticalGrowthState):TacticalGrowthUnit {
  const calling = state.activeCalling ?? null;
  const mastery = calling ? callingMasteryLevel(state.callingMastery?.[calling] ?? 0) : 0;
  const callingBonus = Math.min(8,mastery * 2);
  return {
    id:'runa', side:'ally', position:'front',
    maxHp:clamp(110 + state.stats.strength * .7,110,190),
    hp:clamp(110 + state.stats.strength * .7,110,190),
    agility:clamp(10 + state.stats.intelligence * .08 + (calling === 'pathfinder' ? 3 : 0),8,24),
    ap:3, maxAp:3, mp:0, maxMp:10, shield:0,
    attackPower:clamp(18 + state.stats.strength * .55 + (calling === 'vanguard' ? callingBonus : 0),18,80),
    skillPower:clamp(18 + state.stats.magic * .45 + state.stats.intelligence * .25 + (calling === 'arcanist' ? callingBonus : 0),18,90),
    supportPower:clamp(12 + state.stats.affection * .45 + state.stats.intelligence * .1 + (calling === 'caretaker' ? callingBonus : 0),12,70),
    role:calling ? roleByCalling[calling] : 'balanced',
    specialId:calling ? specialByCalling[calling] : 'guardian_burst',
  };
}

export function buildDefaultTacticalAllies(state:TacticalGrowthState):TacticalGrowthUnit[] {
  const runa = buildRunaTacticalUnit(state);
  const bear:TacticalGrowthUnit = {
    id:'guardian_bear', side:'ally', position:'front', maxHp:150, hp:150, agility:7,
    ap:3, maxAp:3, mp:0, maxMp:10, shield:10,
    attackPower:32, skillPower:24, supportPower:16, role:'striker', specialId:'guardian_burst',
  };
  const owl:TacticalGrowthUnit = {
    id:'guardian_owl', side:'ally', position:'back', maxHp:105, hp:105, agility:11,
    ap:3, maxAp:3, mp:0, maxMp:10, shield:0,
    attackPower:20, skillPower:36, supportPower:30, role:'support', specialId:'guardian_burst',
  };
  return [runa,bear,owl];
}
