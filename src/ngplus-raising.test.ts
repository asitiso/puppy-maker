import {describe,expect,it} from 'vitest';
import {mainCampaignIds} from './campaign-model';
import {emptyLegacyState,type LegacyState} from './legacy-state';
import {pathConvergence,type SpringAffinityEvidence} from './spring-raising';
import {resolveNgPlusRaisingReplay} from './ngplus-raising';

const evidence:SpringAffinityEvidence[]=[
  {campaign:'caretaker',source:'training',amount:5,reason:'이번 봄에는 보호 훈련을 선택했다.'},
  {campaign:'pathfinder',source:'exploration',amount:4,reason:'새 경로를 직접 탐색했다.'},
  {campaign:'vanguard',source:'tactical',amount:2,reason:'정면 승부를 피하지 않았다.'},
];

const legacy=(patch:Partial<LegacyState>={}):LegacyState=>({
  ...emptyLegacyState(),
  completedRuns:1,
  completedCampaigns:['caretaker'],
  endingCollection:['winter.caretaker.team_solution.victory.epilogue'],
  careerCollection:['winter.career.seasoned'],
  ngPlusUnlocks:['past_life_dialogue','relationship_reunion'],
  runSummaries:[{
    runNumber:1,
    campaign:'caretaker',
    route:'normal',
    ending:'winter.caretaker.team_solution.victory.epilogue',
    career:'winter.career.seasoned',
    majorWorldOutcomes:[],
    keyBondMemories:[{characterId:'mira',memoryId:'mira_winter_victory'}],
    trueClues:[],
  }],
  relationshipEchoes:{mira:['mira_winter_victory']},
  ...patch,
});

describe('V3 NG+ Raising replay semantics',()=>{
  it('surfaces qualitative past-life evidence from the latest completed run without raw optimization values',()=>{
    const result=resolveNgPlusRaisingReplay(legacy(),evidence);
    expect(result.pastLife).toMatchObject({campaign:'caretaker',runNumber:1});
    expect(result.pastLife?.endingKey).toContain('winter.caretaker');
    expect(result.pastLife?.careerKey).toBe('winter.career.seasoned');
    expect(JSON.stringify(result.pastLife)).not.toMatch(/score|trust|affinit|threshold|bestScore|sGrades/i);
  });

  it('creates representative reunion hooks from relationship echoes and shared Noa/Eiden reunion hooks',()=>{
    const result=resolveNgPlusRaisingReplay(legacy(),evidence);
    expect(result.relationshipHooks).toEqual(expect.arrayContaining([
      expect.objectContaining({character:'mira',kind:'reunion'}),
      expect.objectContaining({character:'noa',kind:'shared_reunion'}),
      expect.objectContaining({character:'eiden',kind:'shared_reunion'}),
    ]));
    expect(result.relationshipHooks.some(hook=>hook.character==='veyr')).toBe(false);
  });

  it('does not invent past-life or reunion semantics when the corresponding unlocks are absent',()=>{
    const result=resolveNgPlusRaisingReplay(legacy({ngPlusUnlocks:[]}),evidence);
    expect(result.pastLife).toBeNull();
    expect(result.relationshipHooks).toEqual([]);
  });

  it('keeps Lyra as a repetition/Fifth Path eligibility hint only',()=>{
    const result=resolveNgPlusRaisingReplay(legacy({ngPlusUnlocks:['past_life_dialogue','relationship_reunion','fifth_path_candidate']}),evidence);
    expect(result.relationshipHooks).toContainEqual(expect.objectContaining({character:'lyra',kind:'possibility_hint'}));
    expect(result.relationshipHooks).not.toContainEqual(expect.objectContaining({character:'lyra',kind:'reunion'}));
  });

  it('preserves ordinary Spring candidate tendencies instead of letting Legacy overpower current-run play',()=>{
    const baseline=pathConvergence(evidence);
    const result=resolveNgPlusRaisingReplay(legacy(),evidence);
    expect(result.normalCandidates.map(candidate=>[candidate.campaign,candidate.tendency]))
      .toEqual(baseline.map(candidate=>[candidate.campaign,candidate.tendency]));
    expect(result.normalCandidates).toHaveLength(2);
  });

  it('adds prior-life rationale qualitatively without replacing current-run reasons',()=>{
    const result=resolveNgPlusRaisingReplay(legacy(),evidence);
    const caretaker=result.normalCandidates.find(candidate=>candidate.campaign==='caretaker');
    expect(caretaker?.reasons).toContain('이번 봄에는 보호 훈련을 선택했다.');
    expect(caretaker?.legacyReasons?.some(reason=>reason.includes('caretaker'))).toBe(true);
  });

  it('adds fifth_path_candidate only as a special extra candidate and keeps at least two normal campaigns',()=>{
    const result=resolveNgPlusRaisingReplay(legacy({
      ngPlusUnlocks:['past_life_dialogue','relationship_reunion','fifth_path_candidate'],
      trueClues:['caretaker_life_anomaly','pathfinder_world_route'],
    }),evidence);
    expect(result.normalCandidates.length).toBeGreaterThanOrEqual(2);
    expect(result.specialCandidate).toMatchObject({id:'fifth_path_candidate',kind:'special_candidate'});
    expect(result.normalCandidates.every(candidate=>mainCampaignIds.includes(candidate.campaign))).toBe(true);
  });

  it('does not expose Fifth Path content when only ordinary NG+ replay unlocks exist',()=>{
    const result=resolveNgPlusRaisingReplay(legacy(),evidence);
    expect(result.specialCandidate).toBeNull();
    expect(JSON.stringify(result)).not.toContain('true_path');
  });

  it('degrades malformed/stale legacy input to clean ordinary Spring replay',()=>{
    const result=resolveNgPlusRaisingReplay({
      completedRuns:999,
      ngPlusUnlocks:['stale_unlock'],
      relationshipEchoes:{mira:['mira_winter_stale']},
      runSummaries:[{runNumber:'NaN',campaign:'stale'}],
    } as never,evidence);
    expect(result.pastLife).toBeNull();
    expect(result.relationshipHooks).toEqual([]);
    expect(result.specialCandidate).toBeNull();
    expect(result.normalCandidates.map(candidate=>candidate.campaign)).toEqual(pathConvergence(evidence).map(candidate=>candidate.campaign));
  });
});
