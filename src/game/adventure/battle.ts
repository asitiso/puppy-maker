// The real thing NOTES.md said full 3v3 GDD-style combat would need:
// player HP / enemy HP, a genuine turn loop, and the 4 skill cards as
// actual actions (not a reskin of the reflex/memory minigames). This is
// scoped down from "3v3 party" to "1v1 boss with a real HP bar", which is
// the part of GDD 3.5/SCR-07 that's actually buildable and testable in one
// pass: a 4-card deck, 3 drawn per turn (per the GDD's own "매 턴 3장의
// 카드가 랜덤 드로우"), enemy counterattacks each turn, fight ends on
// either HP hitting 0 or the turn limit.
export type BattleCardId = 'fireball' | 'heal' | 'shield' | 'focus';
export interface BattleCard { id: BattleCardId; name: string; description: string }
export const BATTLE_CARDS: BattleCard[] = [
  { id: 'fireball', name: '파이어볼', description: '적에게 큰 피해를 입힌다' },
  { id: 'heal', name: '치유의 빛', description: '루나의 체력을 회복한다' },
  { id: 'shield', name: '수호의 막', description: '이번 턴 받는 피해를 크게 줄인다' },
  { id: 'focus', name: '마력 집중', description: '다음 카드의 효과를 강화한다' },
];

export function drawHand(random: () => number = Math.random, size = 3): BattleCardId[] {
  const pool = BATTLE_CARDS.map((c) => c.id);
  const hand: BattleCardId[] = [];
  for (let i = 0; i < size && pool.length; i++) hand.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  return hand;
}

export interface BattleEnemy { name: string; maxHp: number; baseAttack: number; attackGrowth: number }
export const BATTLE_ENEMY: BattleEnemy = { name: '겨울 그림자 늑대', maxHp: 800, baseAttack: 58, attackGrowth: 4 };

export interface BattleState {
  playerHp: number; playerMaxHp: number;
  enemyHp: number; enemyMaxHp: number;
  enemyName: string;
  focused: boolean;
  turn: number; maxTurns: number;
  hand: BattleCardId[];
  log: string[];
  finished: boolean;
  outcome?: 'WIN' | 'LOSE' | 'DRAW';
}

export function createBattle(enemy: BattleEnemy, playerMaxHp: number, maxTurns: number, random: () => number = Math.random): BattleState {
  return { playerHp: playerMaxHp, playerMaxHp, enemyHp: enemy.maxHp, enemyMaxHp: enemy.maxHp, enemyName: enemy.name, focused: false, turn: 1, maxTurns, hand: drawHand(random), log: [], finished: false };
}

function enemyAttackFor(enemy: BattleEnemy, turn: number) {
  return enemy.baseAttack + enemy.attackGrowth * (turn - 1);
}

// assist: 0..~0.2, same RunaAssist.amount other engines already use to
// scale their hit power — reused here for fireball/heal strength instead
// of inventing a separate stat hook.
export function playCard(state: BattleState, cardId: BattleCardId, assist: number, enemy: BattleEnemy = BATTLE_ENEMY, random: () => number = Math.random): BattleState {
  if (state.finished || !state.hand.includes(cardId)) return state;
  const boost = state.focused ? 1.5 : 1;
  let playerHp = state.playerHp, enemyHp = state.enemyHp, focused = false, blocked = false;
  const log = [...state.log];
  if (cardId === 'fireball') {
    const dmg = Math.max(1, Math.round((90 + assist * 300) * boost));
    enemyHp = Math.max(0, enemyHp - dmg);
    log.push(`파이어볼! ${dmg} 피해`);
  } else if (cardId === 'heal') {
    const heal = Math.round((45 + assist * 80) * boost);
    playerHp = Math.min(state.playerMaxHp, playerHp + heal);
    log.push(`치유의 빛 +${heal}`);
  } else if (cardId === 'shield') {
    blocked = true;
    log.push('수호의 막 전개');
  } else {
    focused = true;
    log.push('마력 집중 (다음 카드 강화)');
  }
  if (enemyHp <= 0) return { ...state, enemyHp: 0, playerHp, focused: false, log, finished: true, outcome: 'WIN' };
  const incoming = Math.round(enemyAttackFor(enemy, state.turn) * (blocked ? 0.25 : 1));
  playerHp = Math.max(0, playerHp - incoming);
  log.push(`${state.enemyName}의 반격! ${incoming} 피해`);
  if (playerHp <= 0) return { ...state, playerHp: 0, enemyHp, focused: false, log, finished: true, outcome: 'LOSE' };
  const turn = state.turn + 1;
  if (turn > state.maxTurns) {
    const outcome = enemyHp <= state.enemyMaxHp * 0.4 ? 'DRAW' : 'LOSE';
    return { ...state, playerHp, enemyHp, focused: false, turn: state.turn, log, finished: true, outcome };
  }
  return { ...state, playerHp, enemyHp, focused, turn, hand: drawHand(random), log, finished: false };
}

// Same 0-1000 scale as the other adventure engines so it can flow through
// finalAdventureScore/gradeForScore unchanged.
export function battleScore(state: BattleState): number {
  const enemyDefeatedRatio = 1 - state.enemyHp / state.enemyMaxHp;
  const playerSurvivedRatio = state.playerHp / state.playerMaxHp;
  const turnEfficiency = Math.max(0, 1 - (state.turn - 1) / state.maxTurns);
  if (state.outcome === 'WIN') return Math.round(650 + 250 * turnEfficiency + 100 * playerSurvivedRatio);
  if (state.outcome === 'DRAW') return Math.round(350 + 250 * enemyDefeatedRatio);
  return Math.round(150 * enemyDefeatedRatio);
}
