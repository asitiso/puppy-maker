import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import NgPlusReplayHub from './NgPlusReplayHub';
import {commitLongNightOutcome,commitWinterEnding,resolveLongNightOutcome,resolveModularEnding} from './campaign-winter-season';
import { initialState, reducer, type GameState } from './game';
import type { LegacyState } from './legacy-state';
import { resolveNgPlusRaisingReplay } from './ngplus-raising';
import { buildNgPlusReplayViewModel } from './ngplus-replay-ui';
import { buildNgPlusWorldEchoPresentation } from './ngplus-world-echo';
import { inspectSavedGame, serializeSavedGame } from './save-schema';
import type { SpringAffinityEvidence } from './spring-raising';

const springEvidence: SpringAffinityEvidence[] = [
  { campaign: 'caretaker', source: 'training', amount: 5, reason: '이번 봄에는 보호 훈련을 새로 선택했다.' },
  { campaign: 'pathfinder', source: 'exploration', amount: 4, reason: '이번 회차에서 새로운 길을 직접 탐색했다.' },
  { campaign: 'vanguard', source: 'tactical', amount: 1, reason: '이번 봄의 전투에서는 정면 승부도 시험했다.' },
];

function committedCaretakerEnding(base: GameState): GameState {
  const longNight = resolveLongNightOutcome({ campaign: 'caretaker', outcome: 'victory' });
  expect(longNight.accepted).toBe(true);
  if (!longNight.accepted) throw new Error('expected Long Night outcome');
  const outcome = commitLongNightOutcome({...base.campaignRun,phase:'winter',activeCampaign:'caretaker',seasonMilestones:['autumn_resolved']}, longNight);
  expect(outcome.committed).toBe(true);
  if (!outcome.committed) throw new Error('expected Long Night commit');
  const ending = resolveModularEnding({campaignResolution:'shared_guardianship',bondResolution:'mira_shared_future',worldResolution:'survived_together',careerResolution:'guardian_mentor'});
  expect(ending.accepted).toBe(true);
  if (!ending.accepted) throw new Error('expected modular ending');
  const committed = commitWinterEnding({ ...base, campaignRun: outcome.state }, ending.ending, {
    majorWorldOutcomes: ['festival_saved'],
    keyBondMemories: [{ characterId: 'mira', memoryId: 'mira_winter_victory' }],
    trueClues: ['caretaker_life_anomaly'],
    truePathEvidence:['significant_fail_forward','sanctuary_history'],
  });
  expect(committed.committed).toBe(true);
  if (!committed.committed) throw new Error('expected Winter ending commit');
  return committed.state as GameState;
}

function replayModel(state: GameState) {
  const raising = resolveNgPlusRaisingReplay(state.legacy, springEvidence);
  const world = buildNgPlusWorldEchoPresentation(state.worldHistory, state.legacy.ngPlusUnlocks);
  return {raising,world,model:buildNgPlusReplayViewModel({raising,world,currentRunEvents:['이번 봄의 첫 훈련을 새로 마쳤어요.','이번 회차의 탐험 기록이 시작됐어요.']})};
}

function eligiblePriorLegacy(): LegacyState {
  return {
    completedRuns: 3,
    completedCampaigns: ['pathfinder', 'vanguard', 'arcanist'],
    endingCollection: ['old.pathfinder', 'old.vanguard', 'old.arcanist'],
    careerCollection: ['pathfinder_career', 'vanguard_career', 'arcanist_career'],
    trueClues: ['pathfinder_world_route', 'vanguard_hidden_conflict_record', 'arcanist_rift_cycle'],
    legacyWorldFacts: [],relationshipEchoes: {},ngPlusUnlocks: [],
    runSummaries: [
      {runNumber:1,campaign:'pathfinder',route:'normal',ending:'old.pathfinder',career:'pathfinder_career',majorWorldOutcomes:['ancient_route_opened'],keyBondMemories:[{characterId:'kael',memoryId:'kael_winter_victory'}],trueClues:['pathfinder_world_route'],truePathEvidence:['astral_history']},
      {runNumber:2,campaign:'vanguard',route:'normal',ending:'old.vanguard',career:'vanguard_career',majorWorldOutcomes:['regional_alliance'],keyBondMemories:[],trueClues:['vanguard_hidden_conflict_record'],truePathEvidence:['celestial_history']},
      {runNumber:3,campaign:'arcanist',route:'normal',ending:'old.arcanist',career:'arcanist_career',majorWorldOutcomes:['rift_stabilized'],keyBondMemories:[],trueClues:['arcanist_rift_cycle'],truePathEvidence:['rift_history']},
    ],
  };
}

describe('V3 NG+ final Wave cross-macro replay', () => {
  it('connects a real Winter ending through authoritative NEW_RUN into Macro A echoes, normal Spring convergence, UI and save/reload', () => {
    const completed = committedCaretakerEnding(initialState);
    const spring = reducer(completed, { type: 'NEW_RUN' });
    expect(spring.campaignRun).toMatchObject({runNumber:2,phase:'spring_exploration',activeCampaign:null,activeRoute:'normal',seasonMilestones:[]});
    expect(spring.legacy.completedRuns).toBe(1);
    expect(spring.legacy.runSummaries).toHaveLength(1);
    expect(spring.legacy.ngPlusUnlocks).toEqual(expect.arrayContaining(['past_life_dialogue','relationship_reunion','world_echo']));
    expect(spring.legacy.ngPlusUnlocks).not.toContain('fifth_path_candidate');
    expect(spring.worldHistory.currentFacts).toEqual([]);
    expect(spring.worldHistory.inheritedFacts).toContain('festival_saved');
    const replay = replayModel(spring);
    expect(replay.raising.pastLife?.campaign).toBe('caretaker');
    expect(replay.raising.relationshipHooks.some(hook => hook.character === 'mira')).toBe(true);
    expect(replay.world.currentFacts).toEqual([]);
    expect(replay.world.inheritedEchoes.some(echo => echo.factId === 'festival_saved')).toBe(true);
    expect(replay.model.normalCandidates.length).toBeGreaterThanOrEqual(2);
    expect(replay.model.specialCandidate).toBeNull();
    const html = renderToStaticMarkup(<NgPlusReplayHub open model={replay.model} onOpen={() => undefined} onClose={() => undefined} />);
    expect(html).toContain('지난 삶의 기억');
    expect(html).toContain('다시 만난 관계');
    expect(html).toContain('이어진 세계의 메아리');
    expect(html).not.toMatch(/campaignAffinities|trust\s*[:=]|rawScore|legacyPower|\d+\s*\/\s*100/i);
    const inspected = inspectSavedGame(serializeSavedGame(spring));
    expect(inspected.status).toBe('valid');
    expect(inspected.state.campaignRun.runNumber).toBe(2);
    expect(inspected.state.worldHistory).toEqual(spring.worldHistory);
    expect(inspected.state.legacy).toEqual(spring.legacy);
    expect(reducer(inspected.state, { type: 'NEW_RUN' })).toEqual(inspected.state);
  });

  it('surfaces canonically earned fifth_path_candidate only as an additive hook while normal campaigns remain available', () => {
    const base: GameState = {...initialState,campaignRun:{...initialState.campaignRun,runNumber:4},legacy:eligiblePriorLegacy()};
    const completed = committedCaretakerEnding(base);
    expect(completed.legacy.completedRuns).toBe(4);
    const spring = reducer(completed, { type: 'NEW_RUN' });
    expect(spring.campaignRun.runNumber).toBe(5);
    expect(spring.legacy.runSummaries).toHaveLength(4);
    expect(spring.legacy.ngPlusUnlocks).toContain('fifth_path_candidate');
    const replay = replayModel(spring);
    expect(replay.model.normalCandidates.length).toBeGreaterThanOrEqual(2);
    expect(replay.model.normalCandidates.map(candidate => candidate.id)).toEqual(expect.arrayContaining(['caretaker','pathfinder']));
    expect(replay.model.specialCandidate?.id).toBe('fifth_path_candidate');
    const html = renderToStaticMarkup(<NgPlusReplayHub open model={replay.model} onOpen={() => undefined} onClose={() => undefined} />);
    expect(html).toContain('추가로 보이는 가능성');
    expect(html).toContain('아직 이름 붙지 않은 가능성');
    expect(html).not.toMatch(/true_path|Fifth Path 캠페인|플레이 가능한 Fifth/i);
  });
});
