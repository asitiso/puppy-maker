import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import SpringHubOverlay from './SpringHubOverlay';
import { resolveCampaignSeasonalObjective } from './campaign-seasonal-objectives';
import { emptyCampaignRunState } from './campaign-state';
import { campaignWorldObjectives } from './campaign-world';
import {
  applyFirstCommitmentCharacterBond,
  commitSpringCampaign,
  openPathConvergence,
  resolveFirstCommitment,
  type SpringAffinityEvidence,
} from './spring-raising';
import { buildSpringStoryUiModel } from './spring-story-ui';
import { worldObjectiveToTacticalScenario } from './spring-world-tactical-lane';
import {
  createTacticalScenarioBattle,
  createTacticalTerminalHandoffState,
  handoffTacticalTerminalResult,
  resolveTacticalScenarioResult,
} from './tactical-scenario';
import { emptyV3PersistentState, hydrateV3PersistentState } from './v3-persistent-state';

const evidence: SpringAffinityEvidence[] = [
  { campaign:'caretaker', source:'training', amount:91, reason:'훈련 중 동료를 보호했어요.' },
  { campaign:'caretaker', source:'dialogue', amount:73, reason:'대화에서 함께 지키겠다고 약속했어요.' },
  { campaign:'pathfinder', source:'exploration', amount:4, reason:'새로운 흔적을 조사했어요.' },
];

const claimKey = '1-spring:caretaker:spring_caretaker_bond';

describe('V3 Spring final Wave E2E', () => {
  it('flows Spring affinity → convergence → commitment → seasonal claim → Tactical handoff → UI → save/reload without duplication', () => {
    const opened = openPathConvergence(emptyCampaignRunState(), evidence);
    expect(opened.state.phase).toBe('path_selection');
    expect(opened.candidates).toHaveLength(2);
    expect(opened.candidates.map(candidate => candidate.campaign)).toEqual(['caretaker','pathfinder']);
    expect(opened.state.campaignAffinities.caretaker).toBe(12);
    expect(opened.state.campaignAffinities.pathfinder).toBe(4);

    const committed = commitSpringCampaign(opened.state, opened.candidates, 'caretaker');
    expect(committed.committed).toBe(true);
    expect(committed.state.activeCampaign).toBe('caretaker');

    const commitment = resolveFirstCommitment(committed.state);
    expect(commitment.event?.type).toBe('first_commitment');
    expect(commitment.event?.character).toBe('mira');
    if (!commitment.event) throw new Error('First Commitment must exist');

    const initial = emptyV3PersistentState();
    const bonded = applyFirstCommitmentCharacterBond(initial.characterBonds, commitment.event);
    expect(bonded.mira.memories).toContain('mira_first_commitment');

    const seasonal = resolveCampaignSeasonalObjective({
      year:1,
      week:1,
      season:'spring',
      campaign:'caretaker',
      signals:['bond','protect','recovery'],
      claimedKeys:[],
    });
    expect(seasonal.accepted).toBe(true);
    if (!seasonal.accepted) throw new Error('Spring objective must be accepted');
    expect(seasonal.claimKey).toBe(claimKey);

    const persisted = {
      ...initial,
      campaignRun:{
        ...commitment.state,
        claimedSeasonalObjectives:[seasonal.claimKey],
      },
      characterBonds:bonded,
      worldHistory:{
        currentFacts:['ancient_route_opened'] as const,
        inheritedFacts:['rift_unstable'] as const,
      },
    };
    const loaded = hydrateV3PersistentState(JSON.parse(JSON.stringify(persisted)));
    const reloaded = hydrateV3PersistentState(JSON.parse(JSON.stringify(loaded)));

    expect(reloaded).toEqual(loaded);
    expect(reloaded.campaignRun.activeCampaign).toBe('caretaker');
    expect(reloaded.campaignRun.claimedSeasonalObjectives).toEqual([claimKey]);
    expect(reloaded.characterBonds.mira.memories).toContain('mira_first_commitment');
    expect(reloaded.worldHistory.currentFacts).toEqual(['ancient_route_opened']);
    expect(reloaded.worldHistory.inheritedFacts).toEqual(['rift_unstable']);

    const duplicateBond = applyFirstCommitmentCharacterBond(reloaded.characterBonds, commitment.event);
    expect(duplicateBond).toEqual(reloaded.characterBonds);
    const duplicateSeasonal = resolveCampaignSeasonalObjective({
      year:1,
      week:2,
      season:'spring',
      campaign:'caretaker',
      signals:['bond','protect'],
      claimedKeys:reloaded.campaignRun.claimedSeasonalObjectives,
    });
    expect(duplicateSeasonal).toEqual(expect.objectContaining({accepted:false, reason:'already_claimed'}));

    const worldObjective = campaignWorldObjectives.find(item => item.id === 'spring_caretaker_resident_guard');
    expect(worldObjective).toBeDefined();
    if (!worldObjective) throw new Error('Spring World objective must exist');
    const scenario = worldObjectiveToTacticalScenario(worldObjective);
    const battle = createTacticalScenarioBattle(
      scenario,
      ['bear','owl'],
      {maxHp:120, agility:15, power:24, magic:20},
      61,
    );
    const won = {...battle, round:3, units:battle.units.map(unit => unit.side === 'enemy' ? {...unit, hp:0} : unit)};
    const terminal = resolveTacticalScenarioResult(scenario, won, 'spring-final-attempt');
    expect(terminal?.objectiveResult).toBe('success');
    expect(terminal?.battleResult).toBe('victory');
    const handed = handoffTacticalTerminalResult(createTacticalTerminalHandoffState(), terminal);
    expect(handed.result).not.toBeNull();
    expect(handoffTacticalTerminalResult(handed.state, terminal).result).toBeNull();

    const model = buildSpringStoryUiModel({
      season:'봄 · Spring',
      campaignState:reloaded.campaignRun,
      candidates:opened.candidates,
      commitment:commitment.event,
      bonds:reloaded.characterBonds,
      relationChange:'미라와 첫 약속이 관계에 남았어요.',
      worldChange:'봄의 수호 활동이 마을에 기록됐어요.',
      objective:'봄 동안 선택한 길을 행동으로 보여 주세요.',
      completedEvents:['Caretaker 길을 선택했어요.'],
      upcomingQuestion:'다음 선택에서도 이 약속을 지킬까요?',
      vn:{
        portrait:'/assets/runa/runa_talk.png',
        name:'미라',
        dialogue:'이번에는 같이 지키자.',
        choices:['같이 가자'],
        log:['미라: 약속은 기억하고 있어.'],
        seen:true,
      },
    });
    const html = renderToStaticMarkup(
      <SpringHubOverlay open model={model} onOpen={() => undefined} onClose={() => undefined} />,
    );
    expect(model.campaign).toBe('Caretaker');
    expect(model.bonds[0]?.name).toBe('미라');
    expect(html).toContain('Caretaker');
    expect(html).toContain('미라');
    expect(html).not.toMatch(/affinity/i);
    expect(html).not.toContain('91');
    expect(html).not.toContain('73');
  });

  it('canonicalizes malformed Spring persistence once and keeps current/inherited World Facts separated', () => {
    const malformed = {
      campaignRun:{
        activeCampaign:'caretaker',
        claimedSeasonalObjectives:[
          claimKey,
          claimKey,
          '01-spring:caretaker:spring_caretaker_bond',
          '1-spring:vanguard:spring_caretaker_bond',
          '1-spring:caretaker:stale_objective',
          7,
          null,
        ],
        failForwardOutcomes:['guardian_festival','guardian_festival','stale_event'],
        majorOutcomes:{guardian_festival:'defeat', stale_event:'victory'},
      },
      worldHistory:{
        currentFacts:['festival_saved','festival_saved','rift_unstable','stale_fact'],
        inheritedFacts:['ancient_route_opened','ancient_route_opened','stale_fact'],
      },
    };

    const first = hydrateV3PersistentState(malformed);
    const second = hydrateV3PersistentState(first);
    expect(second).toEqual(first);
    expect(first.campaignRun.claimedSeasonalObjectives).toEqual([claimKey]);
    expect(first.campaignRun.failForwardOutcomes).toEqual(['guardian_festival']);
    expect(first.campaignRun.majorOutcomes).toEqual({guardian_festival:'defeat'});
    expect(first.worldHistory.currentFacts).toEqual(['festival_saved','rift_unstable']);
    expect(first.worldHistory.inheritedFacts).toEqual(['ancient_route_opened']);
    expect(first.worldHistory.currentFacts).not.toEqual(first.worldHistory.inheritedFacts);
  });
});
