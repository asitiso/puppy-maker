import type { MajorOutcomeResult } from './campaign-model';
import type { CampaignWorldObjectiveDefinition } from './campaign-world';
import {
  campaignEncounterToTacticalScenario,
  type CampaignEncounterDefinition,
  type TacticalScenario,
  type TacticalScenarioModifier,
  type TacticalScenarioObjective,
  type TacticalScenarioResult,
} from './tactical-scenario';

function objectiveFor(world:CampaignWorldObjectiveDefinition):TacticalScenarioObjective {
  const stageId=world.stageIds[0];
  switch(world.kind){
    case 'protect_residents':
      return {type:'protect',unitId:'runa'};
    case 'discover_route':
      return {type:'escape',afterRounds:1};
    case 'remove_threat':
      return {type:'target-elimination',targetId:`${stageId}-enemy-1`};
    case 'investigate_relic_rift':
      return {type:'standard'};
  }
}

function modifierFor(world:CampaignWorldObjectiveDefinition):TacticalScenarioModifier {
  switch(world.campaign){
    case 'caretaker':
      return {campaign:'caretaker',kind:'protect',unitId:'runa'};
    case 'pathfinder':
      return {campaign:'pathfinder',kind:'escape',afterRounds:1};
    case 'vanguard':
      return {campaign:'vanguard',kind:'elite',levelBonus:1};
    case 'arcanist':
      return {campaign:'arcanist',kind:'rule-shift',ruleId:'world-objective'};
  }
}

export function worldObjectiveToTacticalEncounter(
  world:CampaignWorldObjectiveDefinition,
):CampaignEncounterDefinition {
  const stageId=world.stageIds[0];
  if(!stageId) throw new Error('World objective requires an Expedition stage');
  return {
    id:`world:${world.id}`,
    campaign:world.campaign,
    stageId,
    objective:objectiveFor(world),
    modifiers:[modifierFor(world)],
    failForward:true,
  };
}

export function worldObjectiveToTacticalScenario(
  world:CampaignWorldObjectiveDefinition,
):TacticalScenario {
  return campaignEncounterToTacticalScenario(worldObjectiveToTacticalEncounter(world));
}

export function mapTacticalResultToGuardianFestivalOutcome(
  result:TacticalScenarioResult,
):MajorOutcomeResult {
  if(result.objectiveResult==='failure') return 'defeat';
  return result.battleResult==='victory'?'victory':'costly_victory';
}
