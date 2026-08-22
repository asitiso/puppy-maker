import type { CharacterBondsState } from './character-bonds';
import type { MainCampaignId, MajorOutcomeResult } from './campaign-model';
import type { WinterEndingViewModel } from './WinterEndingHub';
import type { WinterEndingStoryResult, WinterRepresentative } from './winter-ending-story';

const campaignNames: Record<MainCampaignId, string> = {
  caretaker: 'Caretaker',
  pathfinder: 'Pathfinder',
  vanguard: 'Vanguard',
  arcanist: 'Arcanist',
};

const characterNames: Record<WinterRepresentative, string> = {
  mira: '미라',
  kael: '카엘',
  rex: '렉스',
  selene: '셀레네',
};

const outcomeCopy: Record<MajorOutcomeResult, { result: string; world: string }> = {
  exceptional_victory: {
    result: 'Long Night를 넘어 예상보다 많은 것을 지켜냈어요. 하지만 그 힘을 어떻게 기억할지는 이제부터의 몫이에요.',
    world: '큰 상처를 피한 세계는 살아남은 여유만큼 다음 책임을 더 선명하게 마주해요.',
  },
  victory: {
    result: 'Long Night를 끝까지 버텨냈어요. 승리의 흔적과 함께 선택의 책임도 세계에 남았어요.',
    world: '세계는 버텨냈고, 가을부터 이어진 선택의 결과가 새로운 질서로 굳어지기 시작해요.',
  },
  costly_victory: {
    result: 'Long Night를 건넜지만 대가가 남았어요. 지켜낸 것과 잃은 것을 함께 안고 결말에 도착했어요.',
    world: '살아남은 세계에는 분명한 상처가 남았고, 회복은 승리보다 긴 이야기가 되었어요.',
  },
  defeat: {
    result: '패배와 상처를 안고도 Long Night는 끝났어요. 모두를 구하지 못했지만 이 밤의 책임은 결말로 기록돼요.',
    world: '세계는 크게 흔들렸지만 이야기는 멈추지 않아요. 남은 사람들은 상처 위에서 다음 삶을 선택해요.',
  },
};

const campaignTitles: Record<MainCampaignId, string> = {
  caretaker: '함께 감당한 수호',
  pathfinder: '끝까지 이어진 길',
  vanguard: '명령을 넘어선 지휘',
  arcanist: '힘의 대가를 기억하는 자',
};

const campaignSummaries: Record<MainCampaignId, string> = {
  caretaker: '누군가를 대신 지키는 데서 끝나지 않고, 책임을 함께 나누는 방식으로 마지막 밤을 건넜어요.',
  pathfinder: '길을 여는 것과 닫는 것 사이에서 쌓인 선택이 마지막 통로를 어떤 의미로 남길지 결정했어요.',
  vanguard: '강한 지휘만으로는 버틸 수 없는 밤에서, 누구와 권한을 나누는지가 마지막 승부가 되었어요.',
  arcanist: '위험한 힘을 쓰는 문제보다 그 힘의 결과를 끝까지 책임지는 태도가 마지막 결말을 만들었어요.',
};

function bondCopy(result: WinterEndingStoryResult) {
  const character = characterNames[result.bondResolution.character];
  if (result.bondResolution.key.endsWith('.strained')) {
    return {
      title: `${character}와 남은 긴장`,
      summary: `${character}와의 관계에는 끝내 풀리지 않은 갈등이 남았지만, 그 갈등까지 마지막 기억의 일부가 되었어요.`,
      dialogue: '모든 게 끝났다고 해서 우리 사이의 질문까지 사라진 건 아니야. 그래도 이 밤을 같이 건넜다는 건 남아.',
    };
  }
  if (result.bondResolution.key.endsWith('.fulfilled')) {
    return {
      title: `${character}와 지켜낸 약속`,
      summary: `${character}와 쌓아 온 기억과 약속이 마지막 밤의 선택으로 이어졌고, 서로의 결정을 믿는 관계가 되었어요.`,
      dialogue: '결국 마지막까지 남은 건 누가 더 강했는지가 아니라, 서로의 선택을 믿을 수 있었는지였어.',
    };
  }
  return {
    title: `${character}와 열린 결말`,
    summary: `${character}와의 관계는 하나의 답으로 닫히지 않았어요. 함께 겪은 마지막 밤이 다음 이야기를 남겼어요.`,
    dialogue: '끝이라고 부르기엔 아직 우리 사이에 남은 말이 많아. 그래도 오늘은 여기까지 온 걸 기억하자.',
  };
}

function bondEvidence(bonds: CharacterBondsState, character: WinterRepresentative) {
  const bond = bonds[character];
  if (!bond) return '마지막 밤의 관계 기록이 남았어요.';
  const pieces: string[] = [];
  if (bond.memories.length > 0) pieces.push('함께 남긴 기억');
  if (bond.promises.length > 0) pieces.push('지켜 온 약속');
  if (bond.conflicts.length > 0) pieces.push('끝내 마주한 갈등');
  return pieces.length > 0 ? `${pieces.join(', ')}이 결말에 반영됐어요.` : '마지막 밤의 관계가 열린 채로 기록됐어요.';
}

export function buildWinterStoryUiModel(
  result: WinterEndingStoryResult,
  bonds: CharacterBondsState,
): WinterEndingViewModel {
  if (result.status !== 'resolved') throw new Error('invalid Winter ending story result');

  const campaign = result.campaignResolution.campaign;
  const outcome = result.campaignResolution.outcome;
  const character = result.bondResolution.character;
  const relationship = bondCopy(result);
  const evidence = bondEvidence(bonds, character);

  return {
    season: '겨울 · Long Night',
    campaign: campaignNames[campaign],
    longNightResult: outcomeCopy[outcome].result,
    primaryCta: '마지막 기록 보기',
    endingCommitted: true,
    axes: [
      {
        id: 'campaign',
        label: 'Campaign Resolution',
        title: campaignTitles[campaign],
        summary: campaignSummaries[campaign],
      },
      {
        id: 'bond',
        label: 'Character Bond Resolution',
        title: relationship.title,
        summary: `${relationship.summary} ${evidence}`,
      },
      {
        id: 'world',
        label: 'World Resolution',
        title: outcome === 'defeat' ? '상처 위에서 이어지는 세계' : '밤 이후 다시 움직이는 세계',
        summary: outcomeCopy[outcome].world,
      },
      {
        id: 'career',
        label: 'Career Resolution',
        title: result.careerResolution.label,
        summary: '지금까지 쌓아 온 Raising과 Career 기록이 마지막 역할의 형태로 드러났어요.',
      },
    ],
    epilogue: {
      title: '밤이 끝난 자리에서',
      body: [
        `${campaignNames[campaign]}의 마지막 선택은 승패 하나로 정리되지 않았어요.`,
        `${characterNames[character]}와 함께 남긴 기억, 세계에 남은 흔적, 그리고 지금까지 걸어온 길이 하나의 결말로 모였어요.`,
      ],
      next: '이 결말은 한 번의 완성된 기록으로 남고, 같은 밤을 다시 들어와도 새로운 결말을 덧씌우지 않아요.',
    },
    vn: {
      portrait: '',
      name: characterNames[character],
      dialogue: relationship.dialogue,
      choices: ['같이 돌아가자'],
      log: [`${characterNames[character]}: Long Night가 끝난 뒤에도 우리가 선택한 것은 남아.`],
      seen: true,
    },
  };
}
