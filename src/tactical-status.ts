import { repairTacticalHealth, type TacticalStatus, type TacticalStatusId, type TacticalUnit } from './tactical-battle';

const statusIds:readonly TacticalStatusId[]=['guard','focus','break','regen'];

function safeStatuses(unit:TacticalUnit):TacticalStatus[] {
  const source=Array.isArray(unit.statuses)?unit.statuses:[];
  return source
    .filter(status=>Boolean(status)&&typeof status.id==='string'&&statusIds.includes(status.id as TacticalStatusId)&&Number.isFinite(status.turns)&&status.turns>0)
    .map(status=>({id:status.id as TacticalStatusId,turns:Math.min(Number.MAX_SAFE_INTEGER,Math.max(1,Math.floor(status.turns)))}));
}

export function addTacticalStatus(unit:TacticalUnit,id:TacticalStatusId,turns:number):TacticalUnit {
  const duration = Number.isFinite(turns)
    ? Math.min(Number.MAX_SAFE_INTEGER,Math.max(1,Math.floor(turns)))
    : 1;
  const statuses = [...safeStatuses(unit).filter(status => status.id !== id),{ id,turns:duration }];
  const shield = Number.isFinite(unit.shield) ? Math.max(0,Math.floor(unit.shield)) : 0;
  return {
    ...unit,
    shield:id === 'guard' ? Math.max(shield,15) : shield,
    statuses,
  };
}

export function tacticalStatusPower(unit:TacticalUnit,rawPower:number):number {
  const safePower = Number.isFinite(rawPower) ? Math.min(Number.MAX_SAFE_INTEGER,Math.max(0,rawPower)) : 0;
  const statuses=safeStatuses(unit);
  let multiplier = 1;
  if (statuses.some(status => status.id === 'focus')) multiplier += .2;
  if (statuses.some(status => status.id === 'break')) multiplier -= .2;
  const scaled=safePower*multiplier;
  return Number.isFinite(scaled) ? Math.min(Number.MAX_SAFE_INTEGER,Math.max(0,Math.floor(scaled))) : Number.MAX_SAFE_INTEGER;
}

export function advanceTacticalStatuses(unit:TacticalUnit):TacticalUnit {
  const safe=repairTacticalHealth(unit);
  const statuses=safeStatuses(safe);
  if (safe.hp <= 0) return { ...safe,statuses:[] };
  const hasRegen = statuses.some(status => status.id === 'regen');
  return {
    ...safe,
    hp:hasRegen ? Math.min(safe.maxHp,safe.hp + 8) : safe.hp,
    statuses:statuses
      .map(status => ({ ...status,turns:status.turns - 1 }))
      .filter(status => status.turns > 0),
  };
}