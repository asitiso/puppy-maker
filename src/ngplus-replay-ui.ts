import type { MainCampaignId } from './campaign-model';
import type { NgPlusRaisingReplay, NgPlusRelationshipHookKind } from './ngplus-raising';
import type { NgPlusWorldEchoPresentation } from './ngplus-world-echo';
import type { NgPlusReplayPathCard, NgPlusReplayViewModel } from './NgPlusReplayHub';

export type NgPlusReplayUiInputs = {
  raising: NgPlusRaisingReplay;
  world: NgPlusWorldEchoPresentation;
  currentRunEvents: readonly string[];
};

const campaignLabels: Record<MainCampaignId, string> = {
  caretaker: 'Caretaker',
  pathfinder: 'Pathfinder',
  vanguard: 'Vanguard',
  arcanist: 'Arcanist',
};

const tendencyLabels = {
  faint_tendency: '희미하게 보이는 길',
  emerging_possibility: '떠오르는 가능성',
  strongly_opening_path: '강하게 열리는 길',
} as const;

const characterLabels: Record<string, string> = {
  mira: '미라',
  kael: '카엘',
  rex: '렉스',
  selene: '셀레네',
  noa: '노아',
  eiden: '에이든',
  lyra: '리라',
};

const reunionCopy: Record<NgPlusRelationshipHookKind, (name: string) => string> = {
  reunion: name => `${name}와 다시 마주치자, 설명하기 어려운 익숙함이 스쳐 지나가요.`,
  shared_reunion: name => `${name}와의 만남에도 지난 가능성의 잔향이 아주 희미하게 남아 있어요.`,
  possibility_hint: name => `${name}는 같은 순간이 한 번 더 겹친 듯한 가능성을 눈치채요.`,
};

const worldEchoCopy: Record<string, string> = {
  'ngplus.world_echo.festival_saved': '예전에 지켜낸 축제의 기억이 이번 봄의 첫 풍경을 조금 다르게 보여줘요.',
  'ngplus.world_echo.festival_heavy_losses': '지난 축제에 남은 상처가 이번 봄의 공기를 조용히 바꿔 놓았어요.',
  'ngplus.world_echo.ancient_route_opened': '한 번 열었던 고대 경로가 Pathfinder의 선택에 희미한 친숙함을 남겨요.',
  'ngplus.world_echo.ancient_route_sealed': '봉인했던 고대 경로의 기억이 다시 길을 고를 때 망설임으로 돌아와요.',
  'ngplus.world_echo.ancient_route_limited': '제한적으로 남겨 둔 고대 경로가 이번 탐험의 숨은 단서처럼 느껴져요.',
  'ngplus.world_echo.eiden_central_command': '한때 중앙 지휘를 택했던 세계의 기억이 권한을 바라보는 시선을 바꿔요.',
  'ngplus.world_echo.regional_alliance': '지역 연합을 택했던 세계의 메아리가 협력의 가능성을 익숙하게 만들어요.',
  'ngplus.world_echo.coalition_command': '연합 지휘를 세웠던 기억이 이번 회차의 협력 장면에 잔향을 남겨요.',
  'ngplus.world_echo.forbidden_relic_used': '금지된 Relic을 사용했던 세계의 흔적이 숨은 위험을 먼저 눈치채게 해요.',
  'ngplus.world_echo.forbidden_relic_destroyed': '금지된 Relic을 파괴했던 기억이 이번 봄의 이상 징후를 다르게 보게 해요.',
  'ngplus.world_echo.forbidden_relic_controlled': '통제된 금지 Relic의 잔향이 Arcanist에게만 보이는 작은 균열을 남겨요.',
  'ngplus.world_echo.rift_stabilized': '안정시킨 Rift의 기억이 이번 세계의 미세한 흔들림을 익숙하게 만들어요.',
  'ngplus.world_echo.rift_unstable': '불안정했던 Rift의 메아리가 이번 봄의 숨은 위험을 먼저 떠올리게 해요.',
  'ngplus.world_echo.caretaker_critical_person_saved': '끝까지 지켜낸 한 사람의 기억이 이번 Caretaker 선택에 온기를 남겨요.',
  'ngplus.world_echo.caretaker_risk_shared': '위험을 함께 나눴던 세계의 기억이 혼자 책임지지 않는 선택을 떠올리게 해요.',
  'ngplus.world_echo.caretaker_team_solution': '함께 해결했던 세계의 기억이 이번 봄에도 동료를 먼저 바라보게 해요.',
};

function pastLifeLines(raising: NgPlusRaisingReplay): string[] {
  if (!raising.pastLife) return [];
  const campaign = campaignLabels[raising.pastLife.campaign as MainCampaignId] ?? '이전';
  const lines = [`지난 ${campaign}의 삶이 완전한 답이 아니라 희미한 기억으로 남아 있어요.`];
  if (raising.pastLife.memoryKeys.length) lines.push('그때 맺었던 관계의 한 장면이 이름 없는 감각처럼 따라와요.');
  if (raising.pastLife.careerKey) lines.push('예전에 걸었던 Guardian의 진로도 이번 선택을 대신하지 않는 익숙함으로만 남아요.');
  return lines;
}

function reunionLines(raising: NgPlusRaisingReplay): string[] {
  return raising.relationshipHooks
    .filter(hook => hook.character !== 'veyr')
    .map(hook => reunionCopy[hook.kind](characterLabels[hook.character] ?? '누군가'));
}

function worldEchoLines(world: NgPlusWorldEchoPresentation): string[] {
  return world.inheritedEchoes.map(echo => worldEchoCopy[echo.presentationKey] ?? '이전 세계의 기억이 이번 회차에 아주 작은 메아리로 남아 있어요.');
}

function candidateCard(candidate: NgPlusRaisingReplay['normalCandidates'][number]): NgPlusReplayPathCard {
  const legacyReasons = candidate.legacyReasons.map(() => '지난 삶의 익숙함이 이 길을 희미하게 알아보게 하지만, 이번 회차의 선택이 더 중요해요.');
  return {
    id: candidate.campaign,
    title: campaignLabels[candidate.campaign],
    tendency: tendencyLabels[candidate.tendency],
    reasons: [...candidate.reasons, ...legacyReasons],
  };
}

export function buildNgPlusReplayViewModel(input: NgPlusReplayUiInputs): NgPlusReplayViewModel {
  const pastLife = pastLifeLines(input.raising);
  const reunions = reunionLines(input.raising);
  const worldEchoes = worldEchoLines(input.world);
  const normalCandidates = input.raising.normalCandidates.map(candidateCard);
  const firstReunion = input.raising.relationshipHooks.find(hook => hook.kind !== 'possibility_hint');
  const vnName = firstReunion ? characterLabels[firstReunion.character] ?? '동료' : '루나';

  return {
    entry: {
      title: '새로운 가능성',
      previousRun: input.raising.pastLife ? '지난 삶은 하나의 기억으로 남았어요.' : '지난 결말은 닫히고, 새로운 가능성이 열렸어요.',
      currentRun: '이번 봄의 행동과 선택은 지금부터 새로 기록돼요.',
      cta: '새로운 봄 시작',
    },
    home: {
      season: '봄 · 새로운 가능성',
      runLabel: '현재 회차',
      echoSummary: pastLife.length || reunions.length || worldEchoes.length
        ? '이전 삶의 메아리는 남아 있지만, 이번 길은 새 선택으로 정해져요.'
        : '이번 봄은 과거의 답 없이 새 선택으로 시작해요.',
      primaryCta: 'Journey 돌아보기',
    },
    journey: {
      pastLife,
      reunions,
      worldEchoes,
      currentRun: [...input.currentRunEvents],
    },
    normalCandidates,
    specialCandidate: input.raising.specialCandidate ? {
      id: 'fifth_path_candidate',
      title: '아직 이름 붙지 않은 가능성',
      reasons: input.raising.specialCandidate.reasons.map(() => '여러 삶의 기억이 겹치며 아직 선택할 수 없는 새로운 가능성을 암시해요.'),
    } : null,
    vn: {
      name: vnName,
      dialogue: reunions.length
        ? '처음 만나는 것 같은데, 이상하게 아주 오래전부터 알고 있던 기분이 들어.'
        : '이번 봄은 정말 처음부터 다시 시작하는 것 같아.',
      choices: ['이번 삶의 선택으로 답하자'],
      log: [],
      seen: false,
    },
  };
}
