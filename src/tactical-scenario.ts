import type { MainCampaignId } from './campaign-model';
import { isBattleFinished, type BattleSession, type TacticalStatusId } from './tactical-battle';
import type { CompanionId, LeaderCombatProgression } from './tactical-companions';
import { createTacticalExpeditionBattle, tacticalBattleNodeForStage, type TacticalBattleNode } from './tactical-expedition';

export type TacticalScenarioObjective =
  | { type:'standard' }
  | { type:'protect'; unitId:string }
  | { type:'survive'; rounds:number }
  | { type:'escape'; afterRounds:number }
  | { type:'target-elimination'; targetId:string };

export type TacticalScenarioObjectiveResult = 'success'|'failure'|null;

export type TacticalScenarioModifier =
  | { campaign:'caretaker'; kind:'protect'; unitId:string }
  | { campaign:'caretaker'; kind:'survive'; rounds:number }
  | { campaign:'caretaker'; kind:'rescue'; unitId:string }
  | { campaign:'pathfinder'; kind:'scout'; revealCount:number }
  | { campaign:'pathfinder'; kind:'turn-limit'; maxRounds:number }
  | { campaign:'pathfinder'; kind:'escape'; afterRounds:number }
  | { campaign:'vanguard'; kind:'elite'; levelBonus:number }
  | { campaign:'vanguard'; kind:'chained-battle'; chainId:string; index:number; total:number }
  | { campaign:'arcanist'; kind:'status-amplify'; statusId:TacticalStatusId; multiplier:number }
  | { campaign:'arcanist'; kind:'relic-resonance'; relicId:string }
  | { campaign:'arcanist'; kind:'rule-shift'; ruleId:string };

export type CampaignEncounterDefinition = {
  id:string;
  campaign:MainCampaignId;
  stageId:string;
  objective:TacticalScenarioObjective;
  modifiers:readonly TacticalScenarioModifier[];
  failForward:boolean;
};

export type TacticalScenario = {
  id:string;
  campaign:MainCampaignId;
  stageId:string;
  battleNode:TacticalBattleNode;
  objective:TacticalScenarioObjective;
  modifiers:readonly TacticalScenarioModifier[];
  failForward:boolean;
};

const statusIds:readonly TacticalStatusId[]=['guard','focus','break','regen'];
const nonEmpty=(value:string)=>typeof value==='string'&&value.trim().length>0;
const positiveInteger=(value:number)=>Number.isFinite(value)&&Number.isInteger(value)&&value>=1;
const nonNegativeInteger=(value:number)=>Number.isFinite(value)&&Number.isInteger(value)&&value>=0;

function validModifier(modifier:TacticalScenarioModifier):boolean {
  if(!modifier||typeof modifier!=='object') return false;
  if(modifier.campaign==='caretaker') {
    if(modifier.kind==='protect'||modifier.kind==='rescue') return nonEmpty(modifier.unitId);
    return modifier.kind==='survive'&&positiveInteger(modifier.rounds);
  }
  if(modifier.campaign==='pathfinder') {
    if(modifier.kind==='scout') return positiveInteger(modifier.revealCount);
    if(modifier.kind==='turn-limit') return positiveInteger(modifier.maxRounds);
    return modifier.kind==='escape'&&nonNegativeInteger(modifier.afterRounds);
  }
  if(modifier.campaign==='vanguard') {
    if(modifier.kind==='elite') return nonNegativeInteger(modifier.levelBonus);
    return modifier.kind==='chained-battle'&&nonEmpty(modifier.chainId)&&positiveInteger(modifier.index)&&positiveInteger(modifier.total)&&modifier.index<=modifier.total;
  }
  if(modifier.campaign==='arcanist') {
    if(modifier.kind==='status-amplify') return statusIds.includes(modifier.statusId)&&Number.isFinite(modifier.multiplier)&&modifier.multiplier>0;
    if(modifier.kind==='relic-resonance') return nonEmpty(modifier.relicId);
    return modifier.kind==='rule-shift'&&nonEmpty(modifier.ruleId);
  }
  return false;
}

export function campaignEncounterToTacticalScenario(encounter:CampaignEncounterDefinition):TacticalScenario {
  if(!Array.isArray(encounter.modifiers)||encounter.modifiers.some(modifier=>!validModifier(modifier))) {
    throw new Error('invalid Tactical scenario modifier');
  }
  if(encounter.modifiers.some(modifier=>modifier.campaign!==encounter.campaign)) {
    throw new Error('campaign modifier mismatch');
  }
  return {
    id:encounter.id,
    campaign:encounter.campaign,
    stageId:encounter.stageId,
    battleNode:tacticalBattleNodeForStage(encounter.stageId),
    objective:encounter.objective,
    modifiers:encounter.modifiers.map(modifier=>({...modifier})),
    failForward:encounter.failForward,
  };
}

export function createTacticalScenarioBattle(
  scenario:TacticalScenario,
  selected:readonly CompanionId[],
  progression:LeaderCombatProgression,
  seed:number,
):BattleSession {
  return createTacticalExpeditionBattle(scenario.stageId,selected,progression,seed);
}

function living(session:BattleSession,id:string) {
  const unit=session.units.find(entry=>entry.id===id);
  return Boolean(unit&&Number.isFinite(unit.hp)&&unit.hp>0);
}

export function evaluateTacticalScenarioObjective(scenario:TacticalScenario,session:BattleSession):TacticalScenarioObjectiveResult {
  const battleResult=isBattleFinished(session);
  const completedRounds=Math.max(0,session.round-1);
  const objective=scenario.objective;

  if(objective.type==='standard') return battleResult==='victory'?'success':battleResult==='defeat'?'failure':null;

  if(objective.type==='protect') {
    if(!living(session,objective.unitId)) return 'failure';
    return battleResult==='victory'?'success':battleResult==='defeat'?'failure':null;
  }

  if(objective.type==='survive') {
    if(battleResult==='defeat') return 'failure';
    if(completedRounds>=Math.max(1,Math.floor(objective.rounds))) return 'success';
    return battleResult==='victory'?'success':null;
  }

  if(objective.type==='escape') {
    if(battleResult==='defeat') return 'failure';
    if(completedRounds>=Math.max(0,Math.floor(objective.afterRounds))) return 'success';
    return battleResult==='victory'?'success':null;
  }

  const target=session.units.find(entry=>entry.id===objective.targetId);
  if(target&&(!Number.isFinite(target.hp)||target.hp<=0)) return 'success';
  if(battleResult==='defeat'||battleResult==='victory') return 'failure';
  return null;
}
