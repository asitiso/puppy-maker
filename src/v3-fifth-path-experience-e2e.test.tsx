import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it} from 'vitest';
import FifthPathHub,{type FifthPathHubViewModel} from './FifthPathHub';
import {resolveFifthPathEligibility} from './fifth-path-eligibility';
import {commitTruePath} from './fifth-path-state';
import {commitFifthSeasonObjective,resolveFifthSeasonObjective} from './fifth-path-runtime';
import {commitFifthPathEnding,commitFifthPathOutcome,resolveFifthPathOutcome,resolveFifthTrueEnding} from './fifth-path-ending';
import {
  buildFifthPathAutumnPresentation,
  buildFifthPathSpringPresentation,
  buildFifthPathSummerPresentation,
  buildFifthPathTrueEndingPresentation,
  buildFifthPathWinterPresentation,
} from './fifth-path-experience';
import {emptyLegacyState,hydrateLegacyState} from './legacy-state';
import {emptyV3PersistentState,hydrateV3PersistentState,type V3PersistentState} from './v3-persistent-state';
import {hydrateGameState,initialState,reducer} from './game';

function eligibleLegacy(){
  return hydrateLegacyState({
    ...emptyLegacyState(),
    completedRuns:4,
    completedCampaigns:['caretaker','pathfinder','vanguard','arcanist'],
    trueClues:['caretaker_life_anomaly','pathfinder_world_route','vanguard_hidden_conflict_record','arcanist_rift_cycle'],
    ngPlusUnlocks:['fifth_path_candidate'],
    runSummaries:[
      {runNumber:1,campaign:'caretaker',route:'normal',ending:'v3:care:b:w:c',career:'c',majorWorldOutcomes:['festival_saved'],keyBondMemories:[{characterId:'mira',memoryId:'mira_first_commitment'}],trueClues:['caretaker_life_anomaly'],truePathEvidence:['significant_fail_forward','sanctuary_history']},
      {runNumber:2,campaign:'pathfinder',route:'normal',ending:'v3:path:b:w:c',career:'c',majorWorldOutcomes:['ancient_route_limited'],keyBondMemories:[],trueClues:['pathfinder_world_route'],truePathEvidence:['astral_history']},
      {runNumber:3,campaign:'vanguard',route:'normal',ending:'v3:van:b:w:c',career:'c',majorWorldOutcomes:['coalition_command'],keyBondMemories:[],trueClues:['vanguard_hidden_conflict_record'],truePathEvidence:['celestial_history']},
      {runNumber:4,campaign:'arcanist',route:'normal',ending:'v3:arc:b:w:c',career:'c',majorWorldOutcomes:['rift_stabilized'],keyBondMemories:[],trueClues:['arcanist_rift_cycle'],truePathEvidence:['rift_history']},
    ],
  });
}

function claimSeason(state:V3PersistentState,season:'summer'|'autumn'|'winter',source:'echo_convergence'|'world_reweave'|'tactical_last_possibility'){
  const resolved=resolveFifthSeasonObjective({year:5,season,source,state});
  expect(resolved.accepted).toBe(true);
  if(!resolved.accepted)throw new Error(`expected ${season} Fifth objective`);
  const committed=commitFifthSeasonObjective(state,resolved);
  expect(committed.committed).toBe(true);
  if(!committed.committed)throw new Error(`expected ${season} Fifth objective commit`);
  return committed.state;
}

describe('V3 Fifth Path playable Macro A connected E2E',()=>{
  it('connects canonical eligibility and explicit choice through seasons, fail-forward True Ending, UI, reload and the next clean Spring',()=>{
    const base=emptyV3PersistentState();
    let state:V3PersistentState={
      ...base,
      campaignRun:{...base.campaignRun,runNumber:5},
      legacy:eligibleLegacy(),
    };

    const eligibility=resolveFifthPathEligibility(state.legacy);
    expect(eligibility.eligible).toBe(true);

    const spring=buildFifthPathSpringPresentation({
      fifthEligible:eligibility.eligible,
      eligibilityReasons:['여러 삶의 단서가 하나의 더 깊은 가능성으로 이어져요.'],
      normalCandidates:[
        {id:'caretaker',title:'Caretaker',tendency:'떠오르는 가능성',reasons:['이번 봄의 행동이 이 길을 열었어요.']},
        {id:'pathfinder',title:'Pathfinder',tendency:'희미하게 보이는 길',reasons:['현재 회차의 선택이 이 방향을 가리켜요.']},
      ],
    });
    expect(spring.normalCandidates).toHaveLength(2);
    expect(spring.fifthCandidate?.choiceId).toBe('true_path');
    expect(spring.autoSelectedCampaign).toBeNull();

    const selected=commitTruePath(state);
    expect(selected.committed).toBe(true);
    if(!selected.committed)throw new Error('expected explicit true_path commit');
    state=selected.state;
    expect(state.campaignRun.activeCampaign).toBe('true_path');
    expect(state.campaignRun.phase).toBe('summer');

    const summerUi=buildFifthPathSummerPresentation({
      activeCampaign:state.campaignRun.activeCampaign,
      season:'summer',
      worldSignals:['서로 다른 캠페인의 흔적이 같은 균열을 가리켜요.'],
      bondSignals:['리라가 반복되는 장면을 먼저 알아차렸어요.'],
    });
    expect(summerUi?.campaign).toBe('true_path');
    state=claimSeason(state,'summer','echo_convergence');
    expect(state.campaignRun.phase).toBe('autumn');
    expect(state.worldHistory.currentFacts).toContain('true_path_echoes_aligned');

    const autumnUi=buildFifthPathAutumnPresentation({
      activeCampaign:state.campaignRun.activeCampaign,
      season:'autumn',
      worldSignals:['각 진영의 해결 방식이 같은 밤에 서로 충돌해요.'],
      bondSignals:['리라는 기존의 정답 하나를 포기해야 한다고 말해요.'],
    });
    expect(autumnUi?.choice.id).toBe('rewrite_the_pattern');
    state=claimSeason(state,'autumn','world_reweave');
    expect(state.campaignRun.phase).toBe('winter');
    expect(state.worldHistory.currentFacts).toContain('true_path_world_rewoven');

    state=claimSeason(state,'winter','tactical_last_possibility');
    const outcome=resolveFifthPathOutcome({battleResult:'defeat',cost:'high'});
    expect(outcome.accepted).toBe(true);
    if(!outcome.accepted)throw new Error('expected fail-forward Fifth outcome');
    const outcomeCommit=commitFifthPathOutcome(state,outcome);
    expect(outcomeCommit.committed).toBe(true);
    if(!outcomeCommit.committed)throw new Error('expected Fifth outcome commit');
    state=outcomeCommit.state;
    expect(state.campaignRun.majorOutcomes.long_night).toBe('defeat');
    expect(state.campaignRun.failForwardOutcomes).toContain('long_night');

    const winterUi=buildFifthPathWinterPresentation({
      activeCampaign:state.campaignRun.activeCampaign,
      season:'winter',
      outcome:'defeat',
      worldSignals:['세계는 하나의 정답 대신 서로 다른 선택을 품은 채 버텼어요.'],
      bondSignals:['리라는 이번에는 기억을 잃지 않겠다고 약속해요.'],
    });
    expect(winterUi?.next).toBe('true_ending');

    const ending=resolveFifthTrueEnding({bondResolution:'lyra_choose_this_life',worldResolution:'cycle_rejoined',careerResolution:'guardian_of_possibility'});
    expect(ending.accepted).toBe(true);
    if(!ending.accepted)throw new Error('expected Fifth True Ending');
    const endingCommit=commitFifthPathEnding(state,ending.ending);
    expect(endingCommit.committed).toBe(true);
    if(!endingCommit.committed)throw new Error('expected Fifth ending commit');
    state=endingCommit.state;

    const endingUi=buildFifthPathTrueEndingPresentation({
      reachedTrueEnding:state.campaignRun.seasonMilestones.includes('ending_committed'),
      outcome:'defeat',
      worldLegacy:['세계는 여러 답을 함께 품을 수 있게 되었어요.'],
      bondLegacy:['리라는 다음 만남에서도 이번 선택을 기억하겠다고 약속했어요.'],
    });
    expect(endingUi?.id).toBe('true_ending');

    const view:FifthPathHubViewModel={
      spring,
      selected:true,
      current:endingUi,
      vn:{name:'리라',dialogue:'이번에는 기억할게. 우리가 다른 답을 만들었다는 걸.',choices:['새로운 봄으로 간다']},
    };
    const html=renderToStaticMarkup(<FifthPathHub open model={view} onOpen={()=>undefined} onClose={()=>undefined} onSelectTruePath={()=>undefined}/>);
    expect(html).toContain('True Ending · 반복 너머의 봄');
    expect(html).toContain('리라');
    expect(html).not.toMatch(/affinity|trust\s*[:=]|score|threshold|legacyPower|\d+\s*\/\s*100/i);

    const reloaded=hydrateV3PersistentState(JSON.parse(JSON.stringify(state)));
    expect(reloaded).toEqual(state);
    const game=hydrateGameState({...initialState,...reloaded,tacticalAutoBattle:true,tacticalBattleSpeed:2});
    const next=reducer(game,{type:'NEW_RUN'});
    expect(next.campaignRun.runNumber).toBe(6);
    expect(next.campaignRun.phase).toBe('spring_exploration');
    expect(next.campaignRun.activeCampaign).toBeNull();
    expect(next.worldHistory.currentFacts).toEqual([]);
    expect(next.worldHistory.inheritedFacts).toContain('true_path_cost_borne');
    expect(next.characterBonds.lyra.memories).toEqual([]);
    expect(next.legacy.completedRuns).toBe(5);
    expect(next.legacy.completedCampaigns).toContain('true_path');
    expect(next.tacticalAutoBattle).toBe(true);
    expect(next.tacticalBattleSpeed).toBe(2);
  });
});
