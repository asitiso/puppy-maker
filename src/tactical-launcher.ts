import type { GameState } from './game';
import type { BattleSession } from './tactical-battle';
import type { CompanionId, LeaderCombatProgression } from './tactical-companions';
import type { TacticalEncounterId } from './tactical-encounters';
import { createTacticalExpeditionBattle } from './tactical-expedition';
import type { ExpeditionStageId } from './expedition-regions';
import { applyV12LoadoutToBattle } from './v12-tactical-equipment-runtime';
import type { V12PersistentBuildState } from './v12-persistent-builds';

const fallbackParty:readonly [CompanionId,CompanionId] = ['bear','owl'];
const companionIds:readonly CompanionId[] = ['bear','owl','wolf','cat'];

type TacticalLaunchState = Pick<GameState,'stats'|'personality'> & {
  selectedTacticalCompanions:readonly CompanionId[];
  v12Builds:V12PersistentBuildState;
};

function finiteNonNegative(value:number) {
  return Number.isFinite(value) ? Math.min(Number.MAX_SAFE_INTEGER,Math.max(0,value)) : 0;
}

function safeRounded(value:number,min:number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min,Math.min(Number.MAX_SAFE_INTEGER,Math.round(value)));
}

function isCompanionId(value:unknown):value is CompanionId {
  return typeof value === 'string' && companionIds.includes(value as CompanionId);
}

export function tacticalEncounterForExpeditionStage(stageId:ExpeditionStageId):TacticalEncounterId {
  if (stageId.startsWith('city_')) return 'starlight_patrol';
  if (stageId.startsWith('lake_')) return 'rift_vanguard';
  return 'training_ground';
}

export function tacticalPartyForGame(state:{selectedTacticalCompanions:readonly CompanionId[]}):[CompanionId,CompanionId] {
  const selected = Array.isArray(state.selectedTacticalCompanions) ? state.selectedTacticalCompanions : [];
  if (selected.length === 2 && isCompanionId(selected[0]) && isCompanionId(selected[1]) && selected[0] !== selected[1]) return [selected[0],selected[1]];
  return [...fallbackParty];
}

export function tacticalLeaderProgression(state:Pick<GameState,'stats'|'personality'>):LeaderCombatProgression {
  const strength = finiteNonNegative(state.stats.strength);
  const magic = finiteNonNegative(state.stats.magic);
  const intelligence = finiteNonNegative(state.stats.intelligence);
  const calmness = finiteNonNegative(state.personality.calmness);
  return {
    power:safeRounded(strength * .75 + magic * .45 + 20,20),
    magic:safeRounded(magic + intelligence * .2,10),
    agility:safeRounded(8 + intelligence * .08 + calmness * .08,8),
    maxHp:safeRounded(100 + strength * 1.6,100),
  };
}

export function createTacticalBattleFromGame(state:TacticalLaunchState,stageId:ExpeditionStageId,seed:number) {
  const session=createTacticalExpeditionBattle(stageId,tacticalPartyForGame(state),tacticalLeaderProgression(state),seed);
  return applyV12LoadoutToBattle(session,state.v12Builds.characterBuilds.loadout);
}

export function tacticalCompletionMetrics(session:BattleSession) {
  const allies = session.units.filter(unit => unit.side === 'ally');
  const damageTaken = allies.reduce((sum,unit) => {
    const maxHp = finiteNonNegative(unit.maxHp);
    const hp = Math.min(maxHp,finiteNonNegative(unit.hp));
    return Math.min(Number.MAX_SAFE_INTEGER,sum + Math.max(0,maxHp-hp));
  },0);
  return {
    rounds:safeRounded(session.round,1),
    survivingAllies:allies.filter(unit => finiteNonNegative(unit.hp) > 0).length,
    damageTaken,
  };
}
