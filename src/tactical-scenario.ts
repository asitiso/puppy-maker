import type { MainCampaignId } from './campaign-model';
import { isBattleFinished, type BattleSession } from './tactical-battle';
import { tacticalBattleNodeForStage, type TacticalBattleNode } from './tactical-expedition';

export type TacticalScenarioObjective =
  | { type:'standard' }
  | { type:'protect'; unitId:string }
  | { type:'survive'; rounds:number }
  | { type:'escape'; afterRounds:number }
  | { type:'target-elimination'; targetId:string };

export type TacticalScenarioObjectiveResult = 'success'|'failure'|null;

export type CampaignEncounterDefinition = {
  id:string;
  campaign:MainCampaignId;
  stageId:string;
  objective:TacticalScenarioObjective;
  modifiers:readonly [];
  failForward:boolean;
};

export type TacticalScenario = {
  id:string;
  campaign:MainCampaignId;
  stageId:string;
  battleNode:TacticalBattleNode;
  objective:TacticalScenarioObjective;
  modifiers:readonly [];
  failForward:boolean;
};

export function campaignEncounterToTacticalScenario(encounter:CampaignEncounterDefinition):TacticalScenario {
  return {
    id:encounter.id,
    campaign:encounter.campaign,
    stageId:encounter.stageId,
    battleNode:tacticalBattleNodeForStage(encounter.stageId),
    objective:encounter.objective,
    modifiers:encounter.modifiers,
    failForward:encounter.failForward,
  };
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
