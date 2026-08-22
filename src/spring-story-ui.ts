import type { CampaignRunState } from './campaign-state';
import type { CharacterBondsState } from './character-bonds';
import type { CharacterId, MainCampaignId } from './campaign-model';
import type { SpringHubViewModel } from './SpringHubOverlay';
import type { FirstCommitmentEvent, SpringPathCandidate, SpringPathTendency } from './spring-raising';

const campaignLabels: Record<MainCampaignId, string> = {
  caretaker: 'Caretaker',
  pathfinder: 'Pathfinder',
  vanguard: 'Vanguard',
  arcanist: 'Arcanist',
};

const characterLabels: Record<CharacterId, string> = {
  mira: '미라',
  kael: '카엘',
  rex: '렉스',
  selene: '셀레네',
  noa: '노아',
  eiden: '에이든',
  lyra: '라이라',
  veyr: '베이르',
};

const tendencyLabels: Record<SpringPathTendency, string> = {
  faint_tendency: '희미하게 보이는 길',
  emerging_possibility: '떠오르는 가능성',
  strongly_opening_path: '강하게 열리는 길',
};

export type SpringStoryUiInputs = {
  season: string;
  campaignState: CampaignRunState;
  candidates: readonly SpringPathCandidate[];
  commitment: FirstCommitmentEvent | null;
  bonds: CharacterBondsState;
  relationChange: string;
  worldChange: string;
  objective: string;
  completedEvents: readonly string[];
  upcomingQuestion: string;
  vn: SpringHubViewModel['vn'];
};

function campaignLabel(state: CampaignRunState): string {
  if (state.activeCampaign === null) return '아직 선택하지 않음';
  if (state.activeCampaign === 'true_path') return 'True Path';
  return campaignLabels[state.activeCampaign];
}

function phaseLabel(state: CampaignRunState, commitment: FirstCommitmentEvent | null): string {
  if (commitment) return '첫 약속 완료';
  if (state.activeCampaign !== null) return 'Campaign commit 완료';
  if (state.phase === 'path_selection') return '길을 선택할 시간';
  return '길이 열리는 중';
}

function primaryCta(state: CampaignRunState, commitment: FirstCommitmentEvent | null): string {
  if (commitment) return 'Journey 돌아보기';
  if (state.activeCampaign !== null) return '첫 약속 보기';
  if (state.phase === 'path_selection') return 'Path 선택하기';
  return 'Journey 열기';
}

function convergenceCards(candidates: readonly SpringPathCandidate[]): SpringHubViewModel['convergence'] {
  return candidates.slice(0, 3).map(candidate => ({
    id: candidate.campaign,
    title: campaignLabels[candidate.campaign],
    tendency: tendencyLabels[candidate.tendency],
    reason: candidate.reasons[0] ?? '아직 이 길을 설명할 충분한 기록을 모으는 중이에요.',
    evidence: candidate.reasons.slice(0, 3),
  }));
}

function commitmentBond(
  commitment: FirstCommitmentEvent | null,
  bonds: CharacterBondsState,
): SpringHubViewModel['bonds'] {
  if (!commitment) return [];
  const bond = bonds[commitment.character];
  const remembered = bond.memories.includes(commitment.memory);
  return [{
    id: commitment.character,
    name: characterLabels[commitment.character],
    trust: remembered ? '첫 약속이 남은 관계' : '관계를 알아가는 중',
    memory: remembered ? `${characterLabels[commitment.character]}와 First Commitment를 남겼어요.` : '아직 선명한 기억이 없어요.',
    promise: bond.promises.length > 0 ? '지켜야 할 약속이 있어요.' : '아직 기록된 약속이 없어요.',
    conflict: bond.conflicts.length > 0 ? '풀어야 할 갈등이 남아 있어요.' : '현재 드러난 갈등은 없어요.',
  }];
}

function journeyEvents(
  completedEvents: readonly string[],
  state: CampaignRunState,
  commitment: FirstCommitmentEvent | null,
): string[] {
  const events = [...completedEvents];
  if (state.activeCampaign && state.activeCampaign !== 'true_path') {
    events.push(`${campaignLabels[state.activeCampaign]} 길을 선택했어요.`);
  }
  if (commitment) {
    events.push(`${characterLabels[commitment.character]}와 첫 약속을 남겼어요.`);
  }
  return [...new Set(events.filter(Boolean))];
}

export function buildSpringStoryUiModel(inputs: SpringStoryUiInputs): SpringHubViewModel {
  return {
    season: inputs.season,
    campaign: campaignLabel(inputs.campaignState),
    phase: phaseLabel(inputs.campaignState, inputs.commitment),
    primaryCta: primaryCta(inputs.campaignState, inputs.commitment),
    relationChange: inputs.relationChange,
    worldChange: inputs.worldChange,
    journey: {
      objective: inputs.objective,
      events: journeyEvents(inputs.completedEvents, inputs.campaignState, inputs.commitment),
      upcomingQuestion: inputs.upcomingQuestion,
    },
    convergence: convergenceCards(inputs.candidates),
    bonds: commitmentBond(inputs.commitment, inputs.bonds),
    vn: inputs.vn,
  };
}
