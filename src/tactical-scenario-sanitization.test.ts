import { describe, expect, it } from 'vitest';
import { campaignEncounterToTacticalScenario, type CampaignEncounterDefinition } from './tactical-scenario';

const valid=():CampaignEncounterDefinition=>({
  id:'spring-valid',
  campaign:'caretaker',
  stageId:'forest-1',
  objective:{type:'protect',unitId:'runa'},
  modifiers:[],
  failForward:true,
});

describe('V3 Tactical scenario adapter runtime boundaries',()=>{
  it('owns a copy of the objective so campaign input mutation cannot alter a compiled scenario',()=>{
    const encounter=valid();
    const scenario=campaignEncounterToTacticalScenario(encounter);
    expect(scenario.objective).toEqual(encounter.objective);
    expect(scenario.objective).not.toBe(encounter.objective);
    (encounter.objective as {type:'protect';unitId:string}).unitId='mutated-outside';
    expect(scenario.objective).toEqual({type:'protect',unitId:'runa'});
  });

  it('rejects blank scenario identity or stage routing before battle compilation',()=>{
    for(const encounter of [
      {...valid(),id:'   '},
      {...valid(),stageId:''},
    ]) {
      expect(()=>campaignEncounterToTacticalScenario(encounter)).toThrow('invalid Tactical scenario definition');
    }
  });

  it('rejects unsupported runtime campaign and non-boolean fail-forward configuration',()=>{
    const badCampaign={...valid(),campaign:'summer'} as unknown as CampaignEncounterDefinition;
    const badFailForward={...valid(),failForward:'yes'} as unknown as CampaignEncounterDefinition;
    expect(()=>campaignEncounterToTacticalScenario(badCampaign)).toThrow('invalid Tactical scenario definition');
    expect(()=>campaignEncounterToTacticalScenario(badFailForward)).toThrow('invalid Tactical scenario definition');
  });

  it('rejects malformed protect and target-elimination identifiers',()=>{
    for(const objective of [
      {type:'protect',unitId:' '},
      {type:'target-elimination',targetId:''},
    ]) {
      const corrupted={...valid(),objective} as unknown as CampaignEncounterDefinition;
      expect(()=>campaignEncounterToTacticalScenario(corrupted)).toThrow('invalid Tactical scenario objective');
    }
  });

  it('rejects non-finite, fractional or out-of-range survive and escape boundaries',()=>{
    const objectives=[
      {type:'survive',rounds:Number.NaN},
      {type:'survive',rounds:Number.POSITIVE_INFINITY},
      {type:'survive',rounds:0},
      {type:'survive',rounds:1.5},
      {type:'escape',afterRounds:Number.NaN},
      {type:'escape',afterRounds:Number.POSITIVE_INFINITY},
      {type:'escape',afterRounds:-1},
      {type:'escape',afterRounds:1.5},
    ];
    for(const objective of objectives) {
      const corrupted={...valid(),objective} as unknown as CampaignEncounterDefinition;
      expect(()=>campaignEncounterToTacticalScenario(corrupted)).toThrow('invalid Tactical scenario objective');
    }
  });

  it('rejects unknown runtime objective kinds instead of treating them as target elimination',()=>{
    const corrupted={...valid(),objective:{type:'boss-phase',targetId:'target'}} as unknown as CampaignEncounterDefinition;
    expect(()=>campaignEncounterToTacticalScenario(corrupted)).toThrow('invalid Tactical scenario objective');
  });
});
