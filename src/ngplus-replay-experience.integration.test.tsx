import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import NgPlusReplayHub from './NgPlusReplayHub';
import { emptyLegacyState, type LegacyState } from './legacy-state';
import { resolveNgPlusRaisingReplay } from './ngplus-raising';
import { buildNgPlusWorldEchoPresentation } from './ngplus-world-echo';
import type { SpringAffinityEvidence } from './spring-raising';
import type { WorldHistoryState } from './world-history';
import { buildNgPlusReplayViewModel } from './ngplus-replay-ui';

const evidence: SpringAffinityEvidence[] = [
  { campaign: 'caretaker', source: 'training', amount: 5, reason: '이번 봄에는 보호 훈련을 선택했다.' },
  { campaign: 'pathfinder', source: 'exploration', amount: 4, reason: '이번 회차에서 새 경로를 직접 탐색했다.' },
  { campaign: 'vanguard', source: 'tactical', amount: 2, reason: '이번 봄의 전투에서 정면 승부를 선택했다.' },
];

const legacy = (patch: Partial<LegacyState> = {}): LegacyState => ({
  ...emptyLegacyState(),
  completedRuns: 1,
  completedCampaigns: ['caretaker'],
  endingCollection: ['winter.caretaker.team_solution.victory.epilogue'],
  careerCollection: ['winter.career.seasoned'],
  ngPlusUnlocks: ['past_life_dialogue', 'relationship_reunion', 'world_echo', 'fifth_path_candidate'],
  trueClues: ['caretaker_life_anomaly', 'pathfinder_world_route'],
  runSummaries: [{
    runNumber: 1,
    campaign: 'caretaker',
    route: 'normal',
    ending: 'winter.caretaker.team_solution.victory.epilogue',
    career: 'winter.career.seasoned',
    majorWorldOutcomes: [],
    keyBondMemories: [{ characterId: 'mira', memoryId: 'mira_winter_victory' }],
    trueClues: [],
  }],
  relationshipEchoes: { mira: ['mira_winter_victory'] },
  ...patch,
});

const worldHistory: WorldHistoryState = {
  currentFacts: ['regional_alliance'],
  inheritedFacts: ['regional_alliance', 'caretaker_team_solution', 'ancient_route_limited'],
};

describe('NG+ Macro A Replay Experience', () => {
  it('composes past-life, reunion and inherited World echoes around a fresh authoritative Spring replay', () => {
    const raising = resolveNgPlusRaisingReplay(legacy(), evidence);
    const world = buildNgPlusWorldEchoPresentation(worldHistory, legacy().ngPlusUnlocks);
    const model = buildNgPlusReplayViewModel({
      raising,
      world,
      currentRunEvents: ['이번 봄의 첫 훈련을 새로 마쳤어요.', '현재 회차의 탐험 기록이 시작됐어요.'],
    });

    expect(model.normalCandidates).toHaveLength(2);
    expect(model.normalCandidates.map(candidate => candidate.id)).toEqual(['caretaker', 'pathfinder']);
    expect(model.specialCandidate?.id).toBe('fifth_path_candidate');
    expect(world.currentFacts).toEqual(['regional_alliance']);
    expect(world.inheritedEchoes.some(echo => echo.factId === 'regional_alliance')).toBe(true);

    const html = renderToStaticMarkup(
      <NgPlusReplayHub open model={model} onOpen={() => undefined} onClose={() => undefined} />,
    );

    expect(html).toContain('지난 삶의 기억');
    expect(html).toContain('다시 만난 관계');
    expect(html).toContain('이어진 세계의 메아리');
    expect(html).toContain('이번 회차의 기록');
    expect(html).toContain('Caretaker');
    expect(html).toContain('Pathfinder');
    expect(html).toContain('추가로 보이는 가능성');
    expect(html).toContain('미라');
    expect(html).toContain('노아');
    expect(html).toContain('에이든');
    expect(html).toContain('리라');
    expect(html).not.toContain('베이르');

    const serialized = JSON.stringify(model);
    expect(serialized).not.toMatch(/campaignAffinities|trust\s*[:=]|rawScore|careerScore|legacyPower|threshold|bestScore|sGrades/i);
    expect(html).not.toMatch(/affinity|trust\s*[:=]|rawScore|legacyPower|\d+\s*\/\s*100/i);
  });

  it('falls back to an ordinary fresh Spring replay when inherited presentation unlocks are absent', () => {
    const cleanLegacy = legacy({ ngPlusUnlocks: [], runSummaries: [], relationshipEchoes: {}, trueClues: [] });
    const raising = resolveNgPlusRaisingReplay(cleanLegacy, evidence);
    const world = buildNgPlusWorldEchoPresentation(worldHistory, cleanLegacy.ngPlusUnlocks);
    const model = buildNgPlusReplayViewModel({
      raising,
      world,
      currentRunEvents: ['이번 회차의 봄 행동만 기록돼요.'],
    });

    expect(model.normalCandidates.length).toBeGreaterThanOrEqual(2);
    expect(model.specialCandidate).toBeNull();
    expect(model.journey.pastLife).toEqual([]);
    expect(model.journey.reunions).toEqual([]);
    expect(model.journey.worldEchoes).toEqual([]);
    expect(model.journey.currentRun).toEqual(['이번 회차의 봄 행동만 기록돼요.']);
  });
});
