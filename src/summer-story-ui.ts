import type { MainCampaignId, MajorOutcomeResult } from './campaign-model';
import type { SummerCampaignStoryPresentation } from './summer-campaign-story';
import type { SummerHubViewModel } from './SummerHubOverlay';

type CampaignCopy = {
  label: string;
  characterName: string;
  title: string;
  objective: string;
  framing: string;
  beat: string;
  nextAction: string;
  promiseRelationship: string;
  conflictRelationship: string;
  topic: string;
  choices: [string, string];
};

const campaignCopy: Record<MainCampaignId, CampaignCopy> = {
  caretaker: {
    label: 'Caretaker',
    characterName: '미라',
    title: '함께 지키는 여름',
    objective: '혼자 짊어지지 않고 모두가 지킬 수 있는 방법을 찾는다.',
    framing: 'Guardian Festival에서 누구를 지킬지보다 책임을 어떻게 나눌지를 선택했어요.',
    beat: '축제의 위기 속에서 보호와 책임 분담을 시험했어요.',
    nextAction: '미라와 축제 뒤의 책임을 다시 나누기',
    promiseRelationship: '미라와 책임을 함께 나누는 동료',
    conflictRelationship: '미라와 무리한 구조의 대가를 함께 정리하는 중',
    topic: '누구도 혼자 짊어지지 않게',
    choices: ['다음에는 처음부터 책임을 나누자', '이번 선택의 대가를 함께 정리하자'],
  },
  pathfinder: {
    label: 'Pathfinder',
    characterName: '카엘',
    title: '경계 너머의 여름',
    objective: '새로운 것을 발견하되 다른 사람의 경계를 넘지 않는 길을 찾는다.',
    framing: 'Guardian Festival의 혼란 속에서 새로운 길과 넘지 말아야 할 경계를 확인했어요.',
    beat: '축제에서 발견과 경계 사이의 선택을 마주했어요.',
    nextAction: '카엘과 다음 탐색의 경계선을 정하기',
    promiseRelationship: '카엘과 경계를 존중하며 발견을 나누는 동료',
    conflictRelationship: '카엘과 넘어 버린 경계를 다시 정리하는 중',
    topic: '새 길을 찾되 서로의 경계를 지키며',
    choices: ['다음 경계는 함께 정하자', '발견보다 사람을 먼저 보자'],
  },
  vanguard: {
    label: 'Vanguard',
    characterName: '렉스',
    title: '승리 뒤에 남는 것',
    objective: '승패만이 아니라 누가 어떤 책임을 지는지까지 리더십으로 받아들인다.',
    framing: 'Guardian Festival의 승패를 리더십과 동료의 책임으로 받아들였어요.',
    beat: '축제의 승패 뒤에 남는 리더십과 책임을 확인했어요.',
    nextAction: '렉스와 다음 싸움의 리더십을 돌아보기',
    promiseRelationship: '렉스와 승패의 책임을 함께 지는 동료',
    conflictRelationship: '렉스와 승리를 위해 치른 대가를 마주하는 중',
    topic: '승패를 혼자 책임지지 않고 함께 이끌며',
    choices: ['다음 싸움은 함께 이끌자', '승패보다 남은 책임을 보자'],
  },
  arcanist: {
    label: 'Arcanist',
    characterName: '셀레네',
    title: '힘을 멈출 줄 아는 지식',
    objective: '더 강한 힘보다 언제 멈춰야 하는지를 아는 지식을 선택한다.',
    framing: 'Guardian Festival에서 더 강한 힘보다 멈출 수 있는 지식을 시험했어요.',
    beat: '축제에서 지식과 힘의 한계를 스스로 정해야 했어요.',
    nextAction: '셀레네와 힘을 멈춰야 할 선을 정하기',
    promiseRelationship: '셀레네와 힘을 멈출 선을 함께 지키는 동료',
    conflictRelationship: '셀레네와 지나친 힘의 대가를 바로잡는 중',
    topic: '힘을 더 쓰기보다 멈출 선을 기억하며',
    choices: ['힘을 멈출 선을 먼저 정하자', '지식의 대가도 함께 보자'],
  },
};

const resultCopy: Record<MajorOutcomeResult, string> = {
  exceptional_victory: '큰 승리를 거뒀지만, 그 선택이 남긴 관계와 다음 책임은 계속돼요.',
  victory: '승리를 거뒀고, 그 과정에서 만든 약속이 다음 이야기를 이어가요.',
  costly_victory: '값비싼 승리의 대가가 남았고, 그 갈등을 안고 다음 이야기가 계속돼요.',
  defeat: '패배했지만 이야기는 끝이 아니에요. 남은 관계와 다음 선택이 계속돼요.',
};

const promiseCopy: Record<string, string> = {
  mira_summer_share_responsibility: '미라와 책임을 혼자 짊어지지 않기로 한 약속',
  kael_summer_respect_boundaries: '카엘과 서로의 경계를 존중하기로 한 약속',
  rex_summer_lead_together: '렉스와 다음 싸움은 함께 이끌기로 한 약속',
  selene_summer_restrain_power: '셀레네와 힘을 멈춰야 할 선을 지키기로 한 약속',
};

const conflictCopy: Record<string, string> = {
  mira_summer_overextended_rescue: '무리한 구조가 남긴 미라와의 갈등',
  kael_summer_crossed_boundary: '넘어 버린 경계가 남긴 카엘과의 갈등',
  rex_summer_victory_at_cost: '승리를 위해 치른 대가가 남긴 렉스와의 갈등',
  selene_summer_forbidden_overreach: '지나친 힘의 사용이 남긴 셀레네와의 갈등',
};

function outcomeFrom(presentation: SummerCampaignStoryPresentation): MajorOutcomeResult | null {
  const tail = presentation.outcomeKey?.split('.').pop();
  if (tail === 'exceptional_victory' || tail === 'victory' || tail === 'costly_victory' || tail === 'defeat') return tail;
  return null;
}

function summerMemories(values: readonly string[], characterName: string): string[] {
  const mapped = values.filter(value => value.includes('_summer_')).map(value => {
    if (value.endsWith('_exceptional_victory')) return `${characterName}와 Guardian Festival에서 큰 성공을 함께 만든 기억`;
    if (value.endsWith('_costly_victory')) return `${characterName}와 값비싼 승리의 대가를 함께 마주한 기억`;
    if (value.endsWith('_defeat')) return `${characterName}와 패배 뒤에도 서로를 놓지 않은 기억`;
    if (value.endsWith('_victory')) return `${characterName}와 Guardian Festival을 함께 이겨낸 기억`;
    return `${characterName}와 이번 여름에 남긴 기억`;
  });
  return [...new Set(mapped)];
}

function summerEvidence(values: readonly string[], copy: Record<string, string>, fallback: string): string[] {
  return [...new Set(values.filter(value => value.includes('_summer_')).map(value => copy[value] ?? fallback))];
}

function dialogue(copy: CampaignCopy, outcome: MajorOutcomeResult | null): string {
  if (outcome === 'defeat') return `이번엔 졌지만 이야기는 끝이 아니야. 다음에는 ${copy.topic} 가자.`;
  if (outcome === 'costly_victory') return `대가가 남았어도 여기서 끝은 아니야. 다음에는 ${copy.topic} 가자.`;
  if (outcome === 'victory') return `해냈어. 다음에도 ${copy.topic} 가자.`;
  if (outcome === 'exceptional_victory') return `이번 선택은 잘됐어. 다음에도 ${copy.topic} 가자.`;
  return 'Guardian Festival 전에 우리가 무엇을 지킬지 다시 확인하자.';
}

const fallbackCopy: CampaignCopy = {
  label: 'Campaign 미정',
  characterName: '동료',
  title: '아직 정해지지 않은 여름',
  objective: '이번 여름의 선택을 확인한다.',
  framing: 'Guardian Festival에서 어떤 선택을 할지 준비하고 있어요.',
  beat: '아직 기록된 여름 장면이 없어요.',
  nextAction: 'Guardian Festival 준비하기',
  promiseRelationship: '이번 여름의 관계를 알아가는 중',
  conflictRelationship: '이번 여름의 관계를 다시 살피는 중',
  topic: '서로의 선택을 확인하며',
  choices: ['함께 준비하자', '조금 더 생각해 보자'],
};

export function buildSummerStoryUiModel(
  presentation: SummerCampaignStoryPresentation,
  season = '여름',
): SummerHubViewModel {
  const campaign = presentation.campaign;
  const copy = campaign ? campaignCopy[campaign] : fallbackCopy;
  const outcome = outcomeFrom(presentation);
  const resolved = presentation.status === 'resolved' && outcome !== null;
  const conflictOutcome = outcome === 'costly_victory' || outcome === 'defeat';
  const relationshipChange = resolved
    ? (conflictOutcome ? copy.conflictRelationship : copy.promiseRelationship)
    : `${copy.characterName}와 이번 여름의 관계를 만들어가는 중`;
  const festivalResult = outcome ? resultCopy[outcome] : 'Guardian Festival의 결과를 기다리는 중이에요.';
  const memories = summerMemories(presentation.memories, copy.characterName);
  const promises = summerEvidence(presentation.promises, promiseCopy, `${copy.characterName}와 이번 여름에 남긴 약속`);
  const conflicts = summerEvidence(presentation.conflicts, conflictCopy, `${copy.characterName}와 이번 여름에 남은 갈등`);
  const sceneDialogue = dialogue(copy, outcome);

  return {
    season,
    campaign: copy.label,
    phase: resolved ? 'Guardian Festival 이후' : 'Guardian Festival 진행 중',
    primaryCta: resolved ? 'Journey 돌아보기' : 'Guardian Festival 준비 확인',
    relationshipChange,
    festivalResult,
    journey: {
      title: copy.title,
      objective: copy.objective,
      framing: copy.framing,
      beats: resolved ? [copy.beat, festivalResult] : [copy.beat],
      nextAction: resolved ? copy.nextAction : 'Guardian Festival 준비하기',
    },
    bond: presentation.character ? {
      id: presentation.character,
      name: copy.characterName,
      relationship: relationshipChange,
      memories,
      promises,
      conflicts,
    } : null,
    vn: {
      portrait: '',
      name: copy.characterName,
      dialogue: sceneDialogue,
      choices: [...copy.choices],
      log: [`${copy.characterName}: ${sceneDialogue}`],
      seen: resolved,
    },
  };
}
