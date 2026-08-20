export type BattleSide = 'ally'|'enemy';
export type BattlePosition = 'front'|'back';
export type BattleResult = 'victory'|'defeat';
export type TacticalStatusId = 'guard'|'focus'|'break'|'regen';
export type TacticalStatus = { id:TacticalStatusId; turns:number };

export type TacticalUnit = {
  id:string;
  side:BattleSide;
  position:BattlePosition;
  maxHp:number;
  hp:number;
  agility:number;
  ap:number;
  maxAp:number;
  mp:number;
  maxMp:number;
  shield:number;
  attackPower?:number;
  skillPower?:number;
  supportPower?:number;
  statuses?:TacticalStatus[];
};

export type BattleSession = {
  units:TacticalUnit[];
  timeline:string[];
  round:number;
  seed:number;
  acted:string[];
};

function normalizeOptionalPower(value:number|undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0,Math.floor(value)) : undefined;
}

export function orderedTimeline(units:TacticalUnit[]) {
  return units
    .filter(unit => unit.hp > 0)
    .slice()
    .sort((a,b) => b.agility - a.agility || a.id.localeCompare(b.id))
    .map(unit => unit.id);
}

export function createBattleSession(allies:TacticalUnit[], enemies:TacticalUnit[], seed:number):BattleSession {
  if (allies.length !== 3 || enemies.length !== 3) throw new Error('Tactical battle requires exactly 3 allies and 3 enemies.');
  const units = [...allies,...enemies].map(unit => ({
    ...unit,
    maxHp:Math.max(1,Math.floor(unit.maxHp)),
    hp:Math.max(0,Math.min(Math.floor(unit.hp),Math.max(1,Math.floor(unit.maxHp)))),
    agility:Math.max(0,Math.floor(unit.agility)),
    maxAp:Math.max(0,Math.floor(unit.maxAp)),
    ap:Math.max(0,Math.min(Math.floor(unit.ap),Math.max(0,Math.floor(unit.maxAp)))),
    maxMp:Math.max(0,Math.floor(unit.maxMp)),
    mp:Math.max(0,Math.min(Math.floor(unit.mp),Math.max(0,Math.floor(unit.maxMp)))),
    shield:Math.max(0,Math.floor(unit.shield)),
    attackPower:normalizeOptionalPower(unit.attackPower),
    skillPower:normalizeOptionalPower(unit.skillPower),
    supportPower:normalizeOptionalPower(unit.supportPower),
    statuses:(unit.statuses ?? [])
      .filter(status => ['guard','focus','break','regen'].includes(status.id) && Number.isFinite(status.turns) && status.turns > 0)
      .map(status => ({ id:status.id,turns:Math.max(1,Math.floor(status.turns)) })),
  }));
  return { units, timeline:orderedTimeline(units), round:1, seed:Math.floor(seed), acted:[] };
}

export function isBattleFinished(session:BattleSession):BattleResult|null {
  const alliesAlive = session.units.some(unit => unit.side === 'ally' && unit.hp > 0);
  const enemiesAlive = session.units.some(unit => unit.side === 'enemy' && unit.hp > 0);
  if (!enemiesAlive && alliesAlive) return 'victory';
  if (!alliesAlive && enemiesAlive) return 'defeat';
  return null;
}
