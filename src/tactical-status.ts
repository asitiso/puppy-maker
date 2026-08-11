import type { TacticalStatusId, TacticalUnit } from './tactical-battle';

export function addTacticalStatus(unit:TacticalUnit,id:TacticalStatusId,turns:number):TacticalUnit {
  const duration = Math.max(1,Math.floor(turns));
  const statuses = [...(unit.statuses ?? []).filter(status => status.id !== id),{ id,turns:duration }];
  return {
    ...unit,
    shield:id === 'guard' ? Math.max(unit.shield,15) : unit.shield,
    statuses,
  };
}

export function tacticalStatusPower(unit:TacticalUnit,rawPower:number):number {
  let multiplier = 1;
  if ((unit.statuses ?? []).some(status => status.id === 'focus')) multiplier += .2;
  if ((unit.statuses ?? []).some(status => status.id === 'break')) multiplier -= .2;
  return Math.max(0,Math.floor(rawPower * multiplier));
}

export function advanceTacticalStatuses(unit:TacticalUnit):TacticalUnit {
  if (unit.hp <= 0) return { ...unit,statuses:[] };
  const hasRegen = (unit.statuses ?? []).some(status => status.id === 'regen');
  return {
    ...unit,
    hp:hasRegen ? Math.min(unit.maxHp,unit.hp + 8) : unit.hp,
    statuses:(unit.statuses ?? [])
      .map(status => ({ ...status,turns:status.turns - 1 }))
      .filter(status => status.turns > 0),
  };
}
