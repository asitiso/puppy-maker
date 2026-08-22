import { describe, expect, it } from 'vitest';
import { createTacticalExpeditionBattle } from './tactical-expedition';
import {
  campaignEncounterToTacticalScenario,
  createTacticalScenarioBattle,
  type CampaignEncounterDefinition,
} from './tactical-scenario';

const progression={power:42,magic:32,agility:13,maxHp:150};
const party=['wolf','owl'] as const;

function encounter():CampaignEncounterDefinition {
  return {
    id:'spring-pathfinder-engine',
    campaign:'pathfinder',
    stageId:'forest-1',
    objective:{type:'escape',afterRounds:2},
    modifiers:[
      {campaign:'pathfinder',kind:'scout',revealCount:2},
      {campaign:'pathfinder',kind:'turn-limit',maxRounds:6},
    ],
    failForward:true,
  };
}

describe('V3 Tactical scenario engine adapter',()=>{
  it('delegates battle creation to the existing Tactical expedition engine',()=>{
    const scenario=campaignEncounterToTacticalScenario(encounter());
    const viaScenario=createTacticalScenarioBattle(scenario,party,progression,73);
    const direct=createTacticalExpeditionBattle('forest-1',party,progression,73);

    expect(viaScenario).toEqual(direct);
    expect(viaScenario).not.toBe(direct);
    expect(viaScenario.units).not.toBe(direct.units);
  });

  it('remains deterministic for the same scenario, party, progression and seed',()=>{
    const scenario=campaignEncounterToTacticalScenario(encounter());
    expect(createTacticalScenarioBattle(scenario,party,progression,91)).toEqual(
      createTacticalScenarioBattle(scenario,party,progression,91),
    );
  });
});
