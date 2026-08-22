import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import SpringHubOverlay from './SpringHubOverlay';
import { emptyCampaignRunState } from './campaign-state';
import { emptyCharacterBondsState } from './character-bonds';
import {
  applyFirstCommitmentCharacterBond,
  commitSpringCampaign,
  openPathConvergence,
  resolveFirstCommitment,
  type SpringAffinityEvidence,
} from './spring-raising';
import { buildSpringStoryUiModel } from './spring-story-ui';

const evidence: SpringAffinityEvidence[] = [
  { campaign: 'caretaker', source: 'training', amount: 91, reason: '훈련 중 동료를 보호하는 선택을 했어요.' },
  { campaign: 'caretaker', source: 'dialogue', amount: 73, reason: '대화에서 책임을 나누겠다고 약속했어요.' },
  { campaign: 'pathfinder', source: 'exploration', amount: 4, reason: '새로운 흔적을 끝까지 조사했어요.' },
];

describe('Lane A Spring story + UI vertical slice', () => {
  it('flows Affinity → Path → Campaign commit → First Commitment → Bond → Home/Journey without raw numbers', () => {
    const opened = openPathConvergence(emptyCampaignRunState(), evidence);
    expect(opened.state.phase).toBe('path_selection');
    expect(opened.candidates).toHaveLength(2);
    expect(opened.candidates[0].campaign).toBe('caretaker');

    const committed = commitSpringCampaign(opened.state, opened.candidates, 'caretaker');
    expect(committed.committed).toBe(true);
    expect(committed.state.activeCampaign).toBe('caretaker');

    const commitment = resolveFirstCommitment(committed.state);
    expect(commitment.event?.type).toBe('first_commitment');
    expect(commitment.event?.character).toBe('mira');

    const bondsBefore = emptyCharacterBondsState();
    const bondsAfter = applyFirstCommitmentCharacterBond(bondsBefore, commitment.event!);
    expect(bondsAfter.mira.memories).toContain('mira_first_commitment');
    expect(bondsAfter.mira.trust).toBeGreaterThan(bondsBefore.mira.trust);

    const model = buildSpringStoryUiModel({
      season: '봄 · 3월',
      campaignState: commitment.state,
      candidates: opened.candidates,
      commitment: commitment.event,
      bonds: bondsAfter,
      relationChange: '미라와 첫 약속이 관계에 남았어요.',
      worldChange: '봄 축제 준비가 마을에 퍼지고 있어요.',
      objective: '어떤 수호자가 될지 행동으로 보여 주세요.',
      completedEvents: ['동료를 보호하는 선택을 했어요.'],
      upcomingQuestion: '혼자 지키는 것과 함께 지키는 것 중 무엇을 택할까요?',
      vn: {
        portrait: '/assets/runa/runa_talk.png',
        name: '미라',
        dialogue: '이번에는 같이 지키자.',
        choices: ['같이 가자', '조금 더 생각할게'],
        log: ['미라: 약속은 기억하고 있어.'],
        seen: true,
      },
    });

    expect(model.campaign).toBe('Caretaker');
    expect(model.phase).toContain('첫 약속');
    expect(model.convergence[0].title).toBe('Caretaker');
    expect(model.convergence[0].evidence).toContain('훈련 중 동료를 보호하는 선택을 했어요.');
    expect(model.bonds[0].name).toBe('미라');
    expect(model.bonds[0].trust).toMatch(/약속|신뢰|관계/);
    expect(model.journey.events.join(' ')).toContain('Caretaker');
    expect(model.journey.events.join(' ')).toContain('미라');

    const homeHtml = renderToStaticMarkup(
      <SpringHubOverlay open={false} model={model} onOpen={() => undefined} onClose={() => undefined} />,
    );
    const journeyHtml = renderToStaticMarkup(
      <SpringHubOverlay open model={model} onOpen={() => undefined} onClose={() => undefined} />,
    );

    expect(homeHtml).toContain('Caretaker');
    expect(homeHtml).toContain('미라와 첫 약속이 관계에 남았어요.');
    expect(journeyHtml).toContain('훈련 중 동료를 보호하는 선택을 했어요.');
    expect(journeyHtml).toContain('이번에는 같이 지키자.');
    expect(journeyHtml).not.toMatch(/affinity/i);
    expect(journeyHtml).not.toContain('91');
    expect(journeyHtml).not.toContain('73');
    expect(JSON.stringify(model)).not.toContain('campaignAffinities');
  });
});
