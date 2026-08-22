import type { MainCampaignId } from './campaign-model';
import { tacticalBattleNodeForStage, type TacticalBattleNode } from './tactical-expedition';

export type TacticalScenarioObjective = { type:'standard' };

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
