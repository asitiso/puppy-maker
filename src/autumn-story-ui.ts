import type { AutumnHubViewModel } from './AutumnHubOverlay';
import {
  autumnChoicePresentation,
  type AutumnChoiceAftermath,
  type AutumnChoiceCommitment,
} from './autumn-major-choice';
import type { CharacterBondsState } from './character-bonds';

type ChoicePresentation = ReturnType<typeof autumnChoicePresentation>;

type AutumnStoryUiInput = {
  presentation: ChoicePresentation;
  commitment: AutumnChoiceCommitment | null;
  aftermath: AutumnChoiceAftermath | null;
  bonds: CharacterBondsState;
  greatExpeditionResult: string;
};

type CampaignCopy = {
  label: string;
  characterId: 'mira' | 'kael' | 'rex' | 'selene';
  characterName: string;
  title: string;
  prompt: string;
  objective: string;
  framing: string;
  nextAction: string;
  relationship: string;
};

const campaigns: Record<ChoicePresentation['campaign'], CampaignCopy> = {
  caretaker: {
    label: 'Caretaker',
    characterId: 'mira',
    characterName: '미라',
    title: '누구를 지킬 것인가',
    prompt: '누구의 위험을 감당할 것인가?',
    objective: 'Great Expedition에서 남은 책임을 한 번의 Major Choice로 정리해요.',
    framing: 'Great Expedition의 생존과 손실이 누구를 먼저 지킬지 피할 수 없는 질문으로 남았어요.',
    nextAction: '미라와 선택의 책임을 정리하기',
    relationship: '책임을 함께 나누는 동료',
  },
  pathfinder: {
    label: 'Pathfinder',
    characterId: 'kael',
    characterName: '카엘',
    title: '경계를 어디까지 열 것인가',
    prompt: '발견한 길을 세상에 어떻게 남길 것인가?',
    objective: 'Great Expedition에서 발견한 길을 열지, 닫을지, 제한적으로 나눌지 결정해요.',
    framing: 'Great Expedition에서 확인한 가능성과 위험이 발견의 경계를 다시 묻게 해요.',
    nextAction: '카엘과 경계의 의미를 정리하기',
    relationship: '경계를 함께 읽는 탐험 동료',
  },
  vanguard: {
    label: 'Vanguard',
    characterId: 'rex',
    characterName: '렉스',
    title: '승리 뒤의 지휘를 누구에게 맡길 것인가',
    prompt: '다음 위기에서 힘을 어떻게 묶을 것인가?',
    objective: 'Great Expedition 뒤의 지휘 체계를 한 번의 Major Choice로 결정해요.',
    framing: 'Great Expedition의 승패가 강한 명령과 독립적인 연대 사이의 긴장을 드러냈어요.',
    nextAction: '렉스와 다음 지휘 방식을 정리하기',
    relationship: '명령과 신뢰를 함께 시험한 동료',
  },
  arcanist: {
    label: 'Arcanist',
    characterId: 'selene',
    characterName: '셀레네',
    title: '금지된 힘을 어디까지 허용할 것인가',
    prompt: '발견한 Relic의 힘을 어떻게 다룰 것인가?',
    objective: 'Great Expedition에서 마주친 힘을 사용할지, 없앨지, 통제할지 결정해요.',
    framing: 'Great Expedition이 지식의 가치와 힘을 멈출 책임을 동시에 남겼어요.',
    nextAction: '셀레네와 힘의 경계를 정리하기',
    relationship: '지식의 대가를 함께 감당하는 동료',
  },
};

const choiceCopy: Record<string, { label: string; description: string }> = {
  save_one: { label: '한 사람을 끝까지 지킨다', description: '가장 위급한 한 사람에게 보호를 집중해요.' },
  spread_risk: { label: '위험을 모두에게 나눈다', description: '한 사람에게 몰린 위험을 모두가 나눠 감당해요.' },
  team_solution: { label: '모두가 함께 감당할 방법을 찾는다', description: '지금까지 쌓인 관계를 바탕으로 제3의 해법을 택해요.' },
  open_route: { label: '고대의 길을 연다', description: '발견한 길을 열어 더 많은 가능성을 받아들여요.' },
  seal_route: { label: '고대의 길을 봉인한다', description: '확인한 위험을 막기 위해 길을 닫아요.' },
  limited_access: { label: '제한된 접근만 허용한다', description: '경계를 지키면서 필요한 사람에게만 길을 열어요.' },
  centralize: { label: '지휘를 하나로 모은다', description: '다음 위기에는 하나의 강한 지휘 체계를 선택해요.' },
  preserve_independence: { label: '각자의 독립을 지킨다', description: '각 팀의 판단을 존중한 채 연대해요.' },
  coalition_command: { label: '연합 지휘 체계를 만든다', description: '독립을 남기면서 공동 결정을 만드는 제3의 지휘를 택해요.' },
  use_relic: { label: '금지된 Relic을 사용한다', description: '위험을 감수하고 힘을 직접 활용해요.' },
  destroy_relic: { label: '금지된 Relic을 파괴한다', description: '다시 쓰이지 않도록 힘의 근원을 없애요.' },
  controlled_use: { label: '통제된 사용만 허용한다', description: '힘을 버리지 않되 엄격한 경계 안에서만 사용해요.' },
};

const outcomeCopy: Record<string, string> = {
  exceptional_victory: '예상보다 큰 성과를 얻었지만, 그 힘을 어떻게 이어갈지 책임이 남았어요.',
  victory: '목표를 이루었고, 이제 승리 뒤의 책임을 선택해야 해요.',
  costly_victory: '목표는 이루었지만 대가가 남아, 다음 선택의 무게가 더 커졌어요.',
  defeat: '원정은 뜻대로 끝나지 않았지만, 실패가 다음 선택을 막지는 않아요.',
};

function readableIds(ids: readonly string[], fallback: string) {
  if (ids.length === 0) return [];
  return ids.map(() => fallback);
}

function aftermathBeat(aftermath: AutumnChoiceAftermath | null, copy: CampaignCopy) {
  if (!aftermath) return `${copy.characterName}와 Great Expedition의 결과를 돌아보며 아직 결정하지 않은 선택을 마주하고 있어요.`;
  const selected = choiceCopy[aftermath.optionId]?.label ?? '선택한 길';
  return `${copy.characterName}와 '${selected}'라는 결정을 함께 받아들이고 있어요.`;
}

export function buildAutumnStoryUiModel(input: AutumnStoryUiInput, season: string): AutumnHubViewModel {
  const copy = campaigns[input.presentation.campaign];
  const bondState = input.bonds[copy.characterId];
  const committedChoiceId = input.commitment?.optionId ?? null;
  const selectedCopy = committedChoiceId ? choiceCopy[committedChoiceId] : null;
  const outcome = input.aftermath?.outcome;
  const resultSummary = outcome ? outcomeCopy[outcome] ?? input.greatExpeditionResult : input.greatExpeditionResult;
  const relationshipChange = input.aftermath
    ? `${copy.characterName}와 ${selectedCopy?.label ?? '선택의 결과'}를 함께 감당하게 됐어요.`
    : `${copy.characterName}와 Great Expedition 이후의 결정을 앞두고 있어요.`;

  return {
    season,
    campaign: copy.label,
    phase: input.commitment ? 'Major Choice 결정 이후' : 'Major Choice 결정 전',
    primaryCta: input.commitment ? '가을 선택 돌아보기' : 'Major Choice 결정하기',
    relationshipChange,
    expeditionResult: input.greatExpeditionResult,
    journey: {
      title: copy.title,
      objective: copy.objective,
      framing: copy.framing,
      beats: [aftermathBeat(input.aftermath, copy), resultSummary],
      nextAction: input.commitment ? '선택의 결과와 겨울을 향한 긴장을 기록하기' : copy.nextAction,
    },
    majorChoice: {
      prompt: copy.prompt,
      committedChoiceId,
      options: input.presentation.options.map(option => {
        const text = choiceCopy[option.id] ?? { label: option.id, description: '지금까지의 여정을 바탕으로 선택해요.' };
        return {
          id: option.id,
          label: text.label,
          description: text.description,
          available: option.available,
          lockedHint: option.available || !option.hint ? undefined : option.hint,
        };
      }),
    },
    bond: {
      id: copy.characterId,
      name: copy.characterName,
      relationship: copy.relationship,
      memories: readableIds(bondState.memories, `${copy.characterName}와 가을의 결정을 함께 기억해요.`),
      promises: readableIds(bondState.promises, `${copy.characterName}와 다음 선택에서도 서로의 결정을 존중하기로 했어요.`),
      conflicts: readableIds(bondState.conflicts, `${copy.characterName}와 선택의 책임을 두고 아직 풀지 못한 긴장이 남았어요.`),
    },
    vn: {
      portrait: '',
      name: copy.characterName,
      dialogue: input.aftermath
        ? `${selectedCopy?.label ?? '이번 선택'}은 끝이 아니라 다음 계절까지 우리가 감당할 책임이야.`
        : '이번에는 선택을 미룰 수 없어. 지금까지 우리가 만든 길을 보고 결정하자.',
      choices: input.commitment ? ['이 선택을 기억한다'] : input.presentation.options.filter(option => option.available).map(option => choiceCopy[option.id]?.label ?? option.id),
      log: [aftermathBeat(input.aftermath, copy)],
      seen: Boolean(input.commitment),
    },
  };
}
