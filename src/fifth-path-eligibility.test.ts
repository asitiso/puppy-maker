import {describe,expect,it} from 'vitest';
import {emptyLegacyState,hydrateLegacyState} from './legacy-state';
import {resolveFifthPathEligibility} from './fifth-path-eligibility';

const allClues=[
  'caretaker_life_anomaly',
  'pathfinder_world_route',
  'vanguard_hidden_conflict_record',
  'arcanist_rift_cycle',
] as const;

function eligibleLegacy(){
  return hydrateLegacyState({
    ...emptyLegacyState(),
    completedRuns:4,
    completedCampaigns:['caretaker','pathfinder','vanguard','arcanist'],
    trueClues:allClues,
    ngPlusUnlocks:['fifth_path_candidate'],
    runSummaries:[
      {
        runNumber:1,campaign:'caretaker',route:'normal',ending:'v3:care:b:w:c',career:'c',
        majorWorldOutcomes:['festival_saved'],
        keyBondMemories:[{characterId:'mira',memoryId:'mira_first_commitment'}],
        trueClues:['caretaker_life_anomaly'],
        truePathEvidence:['significant_fail_forward','sanctuary_history'],
      },
      {
        runNumber:2,campaign:'pathfinder',route:'normal',ending:'v3:path:b:w:c',career:'c',
        majorWorldOutcomes:['ancient_route_limited'],keyBondMemories:[],trueClues:['pathfinder_world_route'],
        truePathEvidence:['astral_history'],
      },
      {
        runNumber:3,campaign:'vanguard',route:'normal',ending:'v3:van:b:w:c',career:'c',
        majorWorldOutcomes:['coalition_command'],keyBondMemories:[],trueClues:['vanguard_hidden_conflict_record'],
        truePathEvidence:['celestial_history'],
      },
      {
        runNumber:4,campaign:'arcanist',route:'normal',ending:'v3:arc:b:w:c',career:'c',
        majorWorldOutcomes:['rift_stabilized'],keyBondMemories:[],trueClues:['arcanist_rift_cycle'],
        truePathEvidence:['rift_history'],
      },
    ],
  });
}

describe('V3 Fifth Path canonical eligibility',()=>{
  it('accepts only sanitized multi-run evidence and reports semantic evidence without raw thresholds',()=>{
    const result=resolveFifthPathEligibility(eligibleLegacy());
    expect(result.eligible).toBe(true);
    expect(result.reasons).toEqual([]);
    expect(result.evidence).toEqual(expect.objectContaining({
      campaignBreadth:true,
      canonicalClues:true,
      meaningfulWorldOutcome:true,
      keyBondMemory:true,
      significantFailForward:true,
      endgameHistory:true,
      sufficientNgPlusHistory:true,
    }));
    expect(JSON.stringify(result)).not.toMatch(/score|power|threshold|trust/i);
  });

  it.each([
    ['campaign_breadth',(legacy:any)=>({...legacy,completedCampaigns:['caretaker','pathfinder','vanguard']})],
    ['canonical_clues',(legacy:any)=>({...legacy,trueClues:allClues.slice(0,3)})],
    ['meaningful_world_outcome',(legacy:any)=>({...legacy,runSummaries:legacy.runSummaries.map((s:any)=>({...s,majorWorldOutcomes:[]}))})],
    ['key_bond_memory',(legacy:any)=>({...legacy,runSummaries:legacy.runSummaries.map((s:any)=>({...s,keyBondMemories:[]}))})],
    ['significant_fail_forward',(legacy:any)=>({...legacy,runSummaries:legacy.runSummaries.map((s:any)=>({...s,truePathEvidence:(s.truePathEvidence??[]).filter((x:string)=>x!=='significant_fail_forward')}))})],
    ['endgame_history',(legacy:any)=>({...legacy,runSummaries:legacy.runSummaries.map((s:any)=>({...s,truePathEvidence:(s.truePathEvidence??[]).filter((x:string)=>!x.endsWith('_history'))}))})],
    ['sufficient_ngplus_history',(legacy:any)=>({...legacy,completedRuns:3,runSummaries:legacy.runSummaries.slice(0,3)})],
  ] as const)('rejects missing %s evidence', (reason,mutate)=>{
    const source=JSON.parse(JSON.stringify(eligibleLegacy()));
    const result=resolveFifthPathEligibility(hydrateLegacyState(mutate(source)));
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain(reason);
  });

  it('drops malformed evidence IDs and cannot keep a stale fifth_path_candidate alive',()=>{
    const raw:any=JSON.parse(JSON.stringify(eligibleLegacy()));
    raw.runSummaries[0].truePathEvidence=['significant_fail_forward','fake_power_999'];
    raw.runSummaries=raw.runSummaries.map((s:any)=>({...s,truePathEvidence:(s.truePathEvidence??[]).filter((x:string)=>!x.endsWith('_history'))}));
    raw.ngPlusUnlocks=['fifth_path_candidate'];
    const hydrated=hydrateLegacyState(raw);
    const result=resolveFifthPathEligibility(hydrated);
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain('endgame_history');
  });
});
