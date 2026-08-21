export type BattleSide = 'ally'|'enemy';
export type BattlePosition = 'front'|'back';
export type BattleResult = 'victory'|'defeat';
export type TacticalStatusId = 'guard'|'focus'|'break'|'regen';
export type TacticalStatus = { id:TacticalStatusId; turns:number };
export type TacticalEnemyArchetype = 'brute'|'guardian'|'hexer'|'medic'|'assassin';

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
  aiArchetype?:TacticalEnemyArchetype;
  statuses?:TacticalStatus[];
};

export type BattleSession = {
  units:TacticalUnit[];
  timeline:string[];
  round:number;
  seed:number;
  acted:string[];
};

const TACTICAL_AP_CAP=3;
const TACTICAL_MP_CAP=10;
const tacticalStatusIds:readonly TacticalStatusId[]=['guard','focus','break','regen'];

function finiteInteger(value:number,fallback:number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(-Number.MAX_SAFE_INTEGER,Math.min(Number.MAX_SAFE_INTEGER,Math.floor(value)));
}

function normalizeOptionalPower(value:number|undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(Number.MAX_SAFE_INTEGER,Math.max(0,Math.floor(value))) : undefined;
}

function normalizeStatuses(statuses:TacticalStatus[]|undefined):TacticalStatus[] {
  const source=Array.isArray(statuses)?statuses:[];
  return source
    .filter(status=>Boolean(status)&&typeof status.id==='string'&&tacticalStatusIds.includes(status.id as TacticalStatusId)&&Number.isFinite(status.turns)&&status.turns>0)
    .map(status=>({id:status.id as TacticalStatusId,turns:Math.max(1,Math.min(Number.MAX_SAFE_INTEGER,Math.floor(status.turns)))}));
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
  const ids=[...allies,...enemies].map(unit=>unit.id);
  if (ids.some(id=>typeof id!=='string'||id.trim().length===0)) throw new Error('Tactical battle requires non-empty unit ids.');
  if (new Set(ids).size !== ids.length) throw new Error('Tactical battle requires unique unit ids.');
  if (allies.some(unit=>unit.side!=='ally') || enemies.some(unit=>unit.side!=='enemy')) throw new Error('Tactical battle requires matching party sides.');
  const units = [...allies,...enemies].map(unit => {
    const maxHp=Math.max(1,finiteInteger(unit.maxHp,1));
    const maxAp=Math.max(1,Math.min(TACTICAL_AP_CAP,finiteInteger(unit.maxAp,1)));
    const maxMp=Math.max(0,Math.min(TACTICAL_MP_CAP,finiteInteger(unit.maxMp,0)));
    return {
      ...unit,
      maxHp,
      hp:Math.max(0,Math.min(finiteInteger(unit.hp,0),maxHp)),
      agility:Math.max(0,finiteInteger(unit.agility,0)),
      maxAp,
      ap:Math.max(0,Math.min(finiteInteger(unit.ap,0),maxAp)),
      maxMp,
      mp:Math.max(0,Math.min(finiteInteger(unit.mp,0),maxMp)),
      shield:Math.max(0,finiteInteger(unit.shield,0)),
      attackPower:normalizeOptionalPower(unit.attackPower),
      skillPower:normalizeOptionalPower(unit.skillPower),
      supportPower:normalizeOptionalPower(unit.supportPower),
      aiArchetype:unit.side === 'enemy' ? unit.aiArchetype : undefined,
      statuses:normalizeStatuses(unit.statuses),
    };
  });
  return { units, timeline:orderedTimeline(units), round:1, seed:finiteInteger(seed,0), acted:[] };
}

export function isBattleFinished(session:BattleSession):BattleResult|null {
  const alliesAlive = session.units.some(unit => unit.side === 'ally' && unit.hp > 0);
  const enemiesAlive = session.units.some(unit => unit.side === 'enemy' && unit.hp > 0);
  if (!alliesAlive) return 'defeat';
  if (!enemiesAlive) return 'victory';
  return null;
}
