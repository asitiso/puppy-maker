import { describe, expect, it } from 'vitest';
import { tacticalBattleNodeForStage } from './tactical-expedition';
import { campaignEncounterToTacticalScenario, type CampaignEncounterDefinition } from './tactical-scenario';

describe('V3 Tactical scenario adapter', () => {
  it('compiles a campaign encounter onto the existing Tactical battle node contract', () => {
    const encounter:CampaignEncounterDefinition = {
      id:'spring-caretaker-standard',
      campaign:'caretaker',
      stageId:'forest-1',
      objective:{type:'standard'},
      modifiers:[],
      failForward:false,
    };

    const scenario = campaignEncounterToTacticalScenario(encounter);

    expect(scenario).toEqual({
      id:'spring-caretaker-standard',
      campaign:'caretaker',
      stageId:'forest-1',
      battleNode:tacticalBattleNodeForStage('forest-1'),
      objective:{type:'standard'},
      modifiers:[],
      failForward:false,
    });
  });
});
