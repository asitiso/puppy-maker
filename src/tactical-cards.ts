import type { BattleSession, TacticalUnit } from './tactical-battle';

export type CardKind = 'attack'|'skill'|'support'|'special';
export type TacticalCard = { id:string; kind:CardKind; apCost:number; mpCost:number; target:'enemy'|'ally'; power:number; scaling:'str'|'mag'|'sen'|'mor' };
export type RunaCombatStats = { str:number; mag:number; sen:number; mor:number };

export const tacticalCards:TacticalCard[] = [
  { id:'basic_strike',kind:'attack',apCost:1,mpCost:0,target:'enemy',power:12,scaling:'str' },
  { id:'moon_burst',kind:'skill',apCost:2,mpCost:3,target:'enemy',power:20,scaling:'mag' },
  { id:'healing_light',kind:'support',apCost:2,mpCost:2,target:'ally',power:18,scaling:'sen' },
  { id:'guardian_veil',kind:'support',apCost:2,mpCost:1,target:'ally',power:16,scaling:'mor' },
  { id:'focus_magic',kind:'special',apCost:0,mpCost:0,target:'ally',power:2,scaling:'mag' },
];

function seeded(seed:number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

export function drawBattleHand(seed:number, deck:string[], count=4) {
  const random = seeded(seed);
  const pool = deck.slice();
  const hand:string[] = [];
  while (pool.length && hand.length < count) hand.push(pool.splice(Math.floor(random()*pool.length),1)[0]);
  return hand;
}

export function canPlayCard(actor:TacticalUnit, card:TacticalCard) {
  return actor.hp > 0 && actor.ap >= card.apCost && actor.mp >= card.mpCost;
}

export function resolveCard(session:BattleSession, actorId:string, cardId:string, targetId:string, stats:RunaCombatStats):BattleSession {
  const actor = session.units.find(unit => unit.id === actorId);
  const target = session.units.find(unit => unit.id === targetId);
  const card = tacticalCards.find(entry => entry.id === cardId);
  if (!actor || !target || !card || !canPlayCard(actor,card)) return session;
  if ((card.target === 'enemy' && actor.side === target.side) || (card.target === 'ally' && actor.side !== target.side) || target.hp <= 0) return session;
  const scale = Math.max(0,stats[card.scaling]);
  const amount = Math.max(1,Math.floor(card.power + scale * 0.6));
  return {
    ...session,
    units:session.units.map(unit => {
      if (unit.id !== actorId && unit.id !== targetId) return unit;
      if (unit.id === actorId && card.id === 'focus_magic') return { ...unit, ap:Math.min(unit.maxAp,unit.ap + 2), mp:Math.min(unit.maxMp,unit.mp + 2) };
      const next = unit.id === actorId ? { ...unit, ap:unit.ap-card.apCost, mp:unit.mp-card.mpCost } : unit;
      if (unit.id !== targetId) return next;
      if (card.id === 'healing_light') return { ...next, hp:Math.min(next.maxHp,next.hp+amount) };
      if (card.id === 'guardian_veil') return { ...next, shield:next.shield+amount };
      const absorbed = Math.min(next.shield,amount);
      return { ...next, shield:next.shield-absorbed, hp:Math.max(0,next.hp-(amount-absorbed)) };
    }),
  };
}
