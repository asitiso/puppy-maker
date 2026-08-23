export type HollowDangerTier = 'stable' | 'fractured' | 'hollow_candidate';

export type HollowTemptationInput = {
  dangerTier: HollowDangerTier;
  currentRouteLabel: string;
  inheritedEcho: boolean;
  finalChoiceAvailable: boolean;
};

export type HollowFinalChoice = {
  id: 'veyr_final_offer';
  prompt: string;
  accept: {
    id: 'accept_hollow';
    label: string;
  };
  refuse: {
    id: 'refuse_hollow';
    label: string;
  };
};

export type HollowTemptationPresentation = {
  routeLabel: string;
  atmosphere: string;
  veyr: string;
  temptation: {
    label: string;
    shortTermBenefit: string;
    costHint: string;
  };
  inheritedEcho: string | null;
  finalChoice: HollowFinalChoice | null;
  autoSelectedRoute: null;
};

export type HollowChoiceResult = 'refused' | 'accepted';

export type HollowChoiceAftermathInput = {
  result: HollowChoiceResult;
  activeRoute: string;
  currentRouteLabel: string;
};

export type HollowChoiceAftermathPresentation = {
  hollowActive: boolean;
  routeLabel: string;
  title: string;
  summary: string;
  veyr: string;
  bondConsequence: string;
  autoSelectedRoute: null;
};

export type HollowCampaignChapter = 'summer' | 'autumn' | 'winter';
export type HollowCampaignOutcome = 'victory' | 'costly_victory' | 'defeat';

export type HollowCampaignPresentationInput = {
  activeRoute: string;
  chapter: HollowCampaignChapter;
  objective: string;
  outcome?: HollowCampaignOutcome;
  worldSignals: readonly string[];
  bondSignals: readonly string[];
};

export type HollowCampaignPresentation = {
  title: string;
  objective: string;
  veyr: string;
  tension: {
    shortTermGain: string;
    longTermCost: string;
  };
  world: readonly string[];
  bond: readonly string[];
  outcome: HollowCampaignOutcome | null;
  resolution: string | null;
  next: 'autumn' | 'winter' | 'hollow_ending';
};

const PRESENTATION_BY_TIER: Record<
  HollowDangerTier,
  Pick<HollowTemptationPresentation, 'atmosphere' | 'veyr' | 'temptation'>
> = {
  stable: {
    atmosphere: '익숙한 풍경은 그대로지만, 몇몇 선택이 이전보다 오래 마음에 남아요.',
    veyr: '베이르는 아직 멀리서 지켜보기만 해요.',
    temptation: {
      label: '더 빠른 해결을 택한다',
      shortTermBenefit: '지금의 위기를 더 적은 준비로 넘길 수 있어요.',
      costHint: '누군가는 그 선택을 오래 기억할 거예요.',
    },
  },
  fractured: {
    atmosphere: '같은 장소인데도 대화가 조금 짧아지고, 사람들이 당신의 다음 선택을 먼저 살펴봐요.',
    veyr: '“선택은 이미 쉬워지고 있잖아. 필요한 걸 먼저 취하면 돼.”',
    temptation: {
      label: '베이르의 지름길을 이용한다',
      shortTermBenefit: '이번 국면의 자원과 시간을 아끼며 즉시 우위를 만들 수 있어요.',
      costHint: '도움을 받은 사람과 도움을 잃은 사람이 같은 장면을 다르게 기억할 거예요.',
    },
  },
  hollow_candidate: {
    atmosphere: '익숙했던 길의 표지판은 남아 있지만, 모두가 당신이 어디로 향할지 기다리고 있어요.',
    veyr: '“여기까지 왔어. 이제 마지막으로 네가 고르면 돼.”',
    temptation: {
      label: '마지막 지름길을 받아들일지 결정한다',
      shortTermBenefit: '눈앞의 위기를 가장 빠른 방식으로 뒤집을 수 있어요.',
      costHint: '이 선택 뒤에는 지금까지 걸어온 길과의 관계도 달라질 수 있어요.',
    },
  },
};

const FINAL_CHOICE: HollowFinalChoice = {
  id: 'veyr_final_offer',
  prompt: '베이르가 마지막으로 손을 내밀어요. 지금의 길을 버릴지, 여기서 멈출지는 아직 당신의 선택이에요.',
  accept: { id: 'accept_hollow', label: '베이르의 손을 잡는다' },
  refuse: { id: 'refuse_hollow', label: '여기서 멈추고 지금의 길을 지킨다' },
};

const HOLLOW_WINTER_RESOLUTION: Record<HollowCampaignOutcome, string> = {
  victory: '마지막 균열을 넘어섰지만, 베이르와 함께 택한 방식이 세계와 관계에 분명한 흔적으로 남아요.',
  costly_victory: '긴 밤은 끝났지만 지름길의 대가도 함께 남아, 다음 날의 관계와 약속을 다시 만들어야 해요.',
  defeat: '이번 밤을 이기지 못했어도 선택의 흔적은 사라지지 않고, 세계는 그 결과를 안은 채 다음 장면으로 넘어가요.',
};

export function buildHollowTemptationPresentation(
  input: HollowTemptationInput,
): HollowTemptationPresentation {
  const presentation = PRESENTATION_BY_TIER[input.dangerTier];
  const canResolveFinalChoice = input.dangerTier === 'hollow_candidate' && input.finalChoiceAvailable;

  return {
    routeLabel: input.currentRouteLabel,
    atmosphere: presentation.atmosphere,
    veyr: presentation.veyr,
    temptation: presentation.temptation,
    inheritedEcho: input.inheritedEcho
      ? '지난 삶에서 비슷한 선택을 했던 기억이 현재의 장면에 희미하게 겹쳐 보여요.'
      : null,
    finalChoice: canResolveFinalChoice ? FINAL_CHOICE : null,
    autoSelectedRoute: null,
  };
}

export function buildHollowChoiceAftermathPresentation(
  input: HollowChoiceAftermathInput,
): HollowChoiceAftermathPresentation {
  const hollowActive = input.result === 'accepted' && input.activeRoute === 'hollow';

  if (hollowActive) {
    return {
      hollowActive: true,
      routeLabel: 'Hollow Path',
      title: 'Hollow Path · 첫 번째 균열',
      summary: '베이르의 손을 잡은 선택이 세계와 관계의 결을 바꾸기 시작해요.',
      veyr: '“이제야 같은 방향을 보고 있네. 다음 선택은 더 쉬워질 거야.”',
      bondConsequence: '리라는 당신을 막아 세우기보다, 다음 선택에서도 당신이 무엇을 지키는지 지켜보겠다고 말해요.',
      autoSelectedRoute: null,
    };
  }

  if (input.result === 'refused') {
    return {
      hollowActive: false,
      routeLabel: input.currentRouteLabel,
      title: '손을 놓은 뒤',
      summary: '눈앞의 지름길을 포기했지만, 지금의 길을 스스로 다시 선택했다는 의미가 남아요.',
      veyr: '“그래. 네가 고른 거니까.”',
      bondConsequence: '리라는 안도하기보다, 이번 거절이 다음 선택에서도 이어질지 조용히 지켜봐요.',
      autoSelectedRoute: null,
    };
  }

  return {
    hollowActive: false,
    routeLabel: input.currentRouteLabel,
    title: '선택이 세계에 닿기 전',
    summary: '손을 내민 선택은 아직 세계의 길로 확정되지 않았어요.',
    veyr: '“결정은 했잖아. 이제 세계가 따라오면 돼.”',
    bondConsequence: '리라는 아직 달라진 길의 이름 대신, 당신의 다음 행동을 기다려요.',
    autoSelectedRoute: null,
  };
}

export function buildHollowCampaignPresentation(
  input: HollowCampaignPresentationInput,
): HollowCampaignPresentation | null {
  if (input.activeRoute !== 'hollow') return null;

  if (input.chapter === 'summer') {
    return {
      title: 'Hollow Path · Summer',
      objective: input.objective,
      veyr: '“빠르게 끝내면 더 많은 걸 지킬 수 있어. 망설일 이유가 없잖아.”',
      tension: {
        shortTermGain: '눈앞의 위기를 더 적은 시간과 자원으로 넘길 수 있어요.',
        longTermCost: '누가 도움을 받았고 누가 남겨졌는지가 세계와 관계의 기억으로 남아요.',
      },
      world: input.worldSignals,
      bond: input.bondSignals,
      outcome: null,
      resolution: null,
      next: 'autumn',
    };
  }

  if (input.chapter === 'autumn') {
    return {
      title: 'Hollow Path · Autumn',
      objective: input.objective,
      veyr: '“이미 효과를 봤잖아. 이번에도 가장 쉬운 문부터 열면 돼.”',
      tension: {
        shortTermGain: '갈라진 세력을 즉시 움직일 만큼 강한 해법을 선택할 수 있어요.',
        longTermCost: '성과를 위해 바꾼 약속과 관계의 의미가 다음 선택까지 따라와요.',
      },
      world: input.worldSignals,
      bond: input.bondSignals,
      outcome: null,
      resolution: null,
      next: 'winter',
    };
  }

  const outcome = input.outcome ?? null;
  return {
    title: 'Hollow Path · Long Night',
    objective: input.objective,
    veyr: '“끝까지 왔어. 결과가 무엇이든 이제 이 선택은 네 것이야.”',
    tension: {
      shortTermGain: '마지막 균열을 정면으로 통과할 수 있는 가장 직접적인 힘을 얻어요.',
      longTermCost: '승패와 관계없이 지금까지의 선택이 세계와 관계의 결말에 흔적으로 남아요.',
    },
    world: input.worldSignals,
    bond: input.bondSignals,
    outcome,
    resolution: outcome ? HOLLOW_WINTER_RESOLUTION[outcome] : '마지막 선택의 결과가 정해지면 그 흔적을 안고 다음 장면으로 이어져요.',
    next: 'hollow_ending',
  };
}
