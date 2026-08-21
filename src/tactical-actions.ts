import type { BattleSession, TacticalUnit } from './tactical-battle';

export type TacticalActionId = 'attack'|'skill'|'support'|'special';
export type TacticalActionTarget = 'enemy_direct'|'enemy_any'|'ally';
export type TacticalActionDefinition = {
  id:TacticalActionId;
  label:string;
  apCost:number;
  mpCost:number;
  target:TacticalActionTarget;
  power:number;
};

export const tacticalActions:TacticalActionDefinition[] = [
  { id:'attack', label:'ATTACK', apCost:1, mpCost:0, target:'enemy_direct', power:20 },
  { id:'skill', label:'SKILL', apCost:2, mpCost:0, target:'enemy_any', power:34 },
  { id:'support', label:'SUPPORT', apCost:2, mpCost:0, target:'ally', power:24 },
  { id:'special', label:'SPECIAL', apCost:0, mpCost:10, target:'enemy_any', power:50 },
];

export function tacticalAction(id:TacticalActionId):TacticalActionDefinition|null {
  return tacticalActions.find(action => action.id === id) ?? null;
}

export function availableTacticalActions(unit:TacticalUnit) {
  if (unit.hp <= 0) return [];
  return tacticalActions.filter(action => unit.ap >= action.apCost && unit.mp >= action.mpCost);
}

export function validTacticalTargets(session:BattleSession,actorId:string,actionId:TacticalActionId):string[] {
  const actor = session.units.find(unit => unit.id === actorId);
  if (!actor || actor.hp <= 0) return [];
  const action = tacticalAction(actionId);
  if (!action || actor.ap < action.apCost || actor.mp < action.mpCost) return [];
  const living = session.units.filter(unit => unit.hp > 0);
  if (action.target === 'ally') {
    return living.filter(unit => unit.side === actor.side).map(unit => unit.id).sort();
  }
  const enemies = living.filter(unit => unit.side !== actor.side);
  if (action.target === 'enemy_any') return enemies.map(unit => unit.id).sort();
  const fronts = enemies.filter(unit => unit.position === 'front');
  return (fronts.length ? fronts : enemies).map(unit => unit.id).sort();
}
