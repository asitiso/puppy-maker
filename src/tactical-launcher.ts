import type { GameState } from './game';
import type { BattleSession } from './tactical-battle';
import type { CompanionId, LeaderCombatProgression } from './tactical-companions';
import type { TacticalEncounterId } from './tactical-encounters';
import { createTacticalExpeditionBattle } from './tactical-expedition';
import type { ExpeditionStageId } from './expedition-regions';

const fallbackParty:[CompanionId,CompanionId] = ['bear','owl'];

export function tacticalEncounterForExpeditionStage(stageId:ExpeditionStageId):TacticalEncounterId {
  if (stageId.startsWith('city_')) return 'starlight_patrol';
  if (stageId.startsWith('lake_')) return 'rift_vanguard';
  return 'training_ground';
}

export function tacticalPartyForGame(state:Pick<GameState,'selectedTacticalCompanions'>):[CompanionId,CompanionId] {
  const selected = state.selectedTacticalCompanions;
  if (selected.length === 2 && selected[0] !== selected[1]) return [selected[0],selected[1]];
  return fallbackParty;
}

export function tacticalLeaderProgression(state:Pick<GameState,'stats'|'personality'>):LeaderCombatProgression {
  const strength = Math.max(0,state.stats.strength);
  const magic = Math.max(0,state.stats.magic);
  const intelligence = Math.max(0,state.stats.intelligence);
  const calmness = Math.max(0,state.personality.calmness);
  return {
    power:Math.max(20,Math.round(strength * .75 + magic * .45 + 20)),
    magic:Math.max(10,Math.round(magic + intelligence * .2)),
    agility:Math.max(8,Math.round(8 + intelligence * .08 + calmness * .08)),
    maxHp:Math.max(100,Math.round(100 + strength * 1.6)),
  };
}

export function createTacticalBattleFromGame(state:GameState,stageId:ExpeditionStageId,seed:number) {
  return createTacticalExpeditionBattle(stageId,tacticalPartyForGame(state),tacticalLeaderProgression(state),seed);
}

export function tacticalCompletionMetrics(session:BattleSession) {
  const allies = session.units.filter(unit => unit.side === 'ally');
  return {
    rounds:Math.max(1,session.round),
    survivingAllies:allies.filter(unit => unit.hp > 0).length,
    damageTaken:allies.reduce((sum,unit) => sum + Math.max(0,unit.maxHp-unit.hp),0),
  };
}
