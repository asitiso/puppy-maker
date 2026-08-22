import { describe, expect, it, vi } from 'vitest';
import {
  campaignEncounterToTacticalScenario,
  invokeTacticalBondIntervention,
  type CampaignEncounterDefinition,
  type TacticalBondInterventionCharacterId,
  type TacticalBondInterventionHook,
} from './tactical-scenario';

function scenario(){
  const encounter:CampaignEncounterDefinition={
    id:'spring-bond-hook',
    campaign:'arcanist',
    stageId:'forest-1',
    objective:{type:'standard'},
    modifiers:[],
    failForward:true,
  };
  return campaignEncounterToTacticalScenario(encounter);
}

describe('V3 Tactical Bond Intervention I/O hook',()=>{
  it('supports Mira, Kael, Rex and Selene as plain Tactical intervention inputs',()=>{
    const supported:TacticalBondInterventionCharacterId[]=['mira','kael','rex','selene'];
    for(const characterId of supported){
      const hook:TacticalBondInterventionHook=request=>({accepted:true,interventionId:`${request.characterId}-spring`});
      expect(invokeTacticalBondIntervention(scenario(),characterId,'before-battle',hook)).toEqual({
        accepted:true,
        interventionId:`${characterId}-spring`,
      });
    }
  });

  it('passes only scenario identity and intervention context, never CharacterBondState',()=>{
    const sourceScenario=scenario();
    const before=structuredClone(sourceScenario);
    const hook=vi.fn<TacticalBondInterventionHook>(request=>{
      expect(Object.keys(request).sort()).toEqual(['campaign','characterId','scenarioId','timing']);
      expect(request).toEqual({
        scenarioId:'spring-bond-hook',
        campaign:'arcanist',
        characterId:'selene',
        timing:'objective-check',
      });
      expect(request).not.toHaveProperty('bondState');
      expect(request).not.toHaveProperty('characterBondState');
      return {accepted:false,interventionId:'selene-declined'};
    });

    expect(invokeTacticalBondIntervention(sourceScenario,'selene','objective-check',hook)).toEqual({
      accepted:false,
      interventionId:'selene-declined',
    });
    expect(hook).toHaveBeenCalledOnce();
    expect(sourceScenario).toEqual(before);
  });

  it('rejects unsupported runtime character ids before calling the hook',()=>{
    const hook=vi.fn<TacticalBondInterventionHook>(()=>({accepted:true,interventionId:'should-not-run'}));
    expect(()=>invokeTacticalBondIntervention(scenario(),'noa' as TacticalBondInterventionCharacterId,'terminal',hook)).toThrow('Bond Intervention character');
    expect(hook).not.toHaveBeenCalled();
  });

  it('copies hook output so Tactical does not retain external mutable response state',()=>{
    const response={accepted:true,interventionId:'mira-guard'};
    const hook:TacticalBondInterventionHook=()=>response;
    const output=invokeTacticalBondIntervention(scenario(),'mira','terminal',hook)!;
    expect(output).toEqual(response);
    expect(output).not.toBe(response);
    response.interventionId='mutated-outside';
    expect(output.interventionId).toBe('mira-guard');
  });

  it('rejects malformed hook output instead of forwarding it into combat integration',()=>{
    const malformed=(()=>({accepted:true,interventionId:'   '})) as TacticalBondInterventionHook;
    expect(()=>invokeTacticalBondIntervention(scenario(),'rex','before-battle',malformed)).toThrow('Bond Intervention response');
  });
});
