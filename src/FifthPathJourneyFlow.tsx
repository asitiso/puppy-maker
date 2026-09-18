import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import FifthPathHub, { type FifthPathHubViewModel } from './FifthPathHub';
import {
  buildFifthPathAutumnPresentation,
  buildFifthPathSpringPresentation,
  buildFifthPathSummerPresentation,
  buildFifthPathTrueEndingPresentation,
  buildFifthPathWinterPresentation,
  type FifthPathWinterOutcome,
} from './fifth-path-experience';
import {
  fifthPathJourneyReducer,
  initialFifthPathJourneyState,
  parseFifthPathJourney,
  resolveFifthPathJourneyChoice,
  serializeFifthPathJourney,
} from './fifth-path-journey';

export const FIFTH_PATH_JOURNEY_STORAGE_KEY = 'puppy-maker:fifth-path-journey:v1';

type Props = {
  winterOutcome: FifthPathWinterOutcome;
  worldSignals: readonly string[];
  bondSignals: readonly string[];
};

export function restoreFifthPathJourney(raw: string | null) {
  const restored = parseFifthPathJourney(raw);
  return fifthPathJourneyReducer(restored, { type: 'UNLOCK' });
}

export function fifthPathJourneyActionForLabel(
  label: string,
  winterOutcome: FifthPathWinterOutcome,
): Parameters<typeof fifthPathJourneyReducer>[1] | null {
  const choice = resolveFifthPathJourneyChoice(label);
  if (!choice) return null;
  return choice === 'face_the_long_night'
    ? { type: 'CHOOSE', choice, outcome: winterOutcome }
    : { type: 'CHOOSE', choice };
}

function loadJourney() {
  if (typeof window === 'undefined') return restoreFifthPathJourney(null);
  return restoreFifthPathJourney(window.localStorage.getItem(FIFTH_PATH_JOURNEY_STORAGE_KEY));
}

export default function FifthPathJourneyFlow({ winterOutcome, worldSignals, bondSignals }: Props) {
  const [open, setOpen] = useState(false);
  const [journey, dispatch] = useReducer(fifthPathJourneyReducer, undefined, loadJourney);

  useEffect(() => {
    try { window.localStorage.setItem(FIFTH_PATH_JOURNEY_STORAGE_KEY, serializeFifthPathJourney(journey)); } catch { /* storage is best-effort */ }
  }, [journey]);

  const spring = useMemo(() => buildFifthPathSpringPresentation({
    fifthEligible: true,
    normalCandidates: [
      { id: 'caretaker', title: '돌봄의 길', tendency: '관계를 지키는 선택', reasons: ['함께 쌓은 시간이 이 가능성을 남겼어요.'] },
      { id: 'pathfinder', title: '개척의 길', tendency: '새로운 세계를 향한 선택', reasons: ['지금까지의 모험이 이 방향을 비추고 있어요.'] },
    ],
    eligibilityReasons: ['여러 회차의 선택과 기억이 하나의 더 깊은 가능성으로 이어졌어요.'],
  }), []);

  const current = useMemo<FifthPathHubViewModel['current']>(() => {
    const base = { activeCampaign: journey.selected ? 'true_path' : null, worldSignals, bondSignals };
    if (journey.stage === 'summer') return buildFifthPathSummerPresentation({ ...base, season: 'summer' });
    if (journey.stage === 'autumn') return buildFifthPathAutumnPresentation({ ...base, season: 'autumn' });
    if (journey.stage === 'winter') return buildFifthPathWinterPresentation({ ...base, season: 'winter', outcome: winterOutcome });
    if (journey.stage === 'true_ending') return buildFifthPathTrueEndingPresentation({
      reachedTrueEnding: true,
      outcome: journey.winterOutcome ?? winterOutcome,
      worldLegacy: worldSignals.length ? worldSignals : ['세계는 여러 답을 함께 품을 수 있게 되었어요.'],
      bondLegacy: bondSignals.length ? bondSignals : ['함께 만든 선택은 다음 봄에도 기억으로 남아요.'],
    });
    return null;
  }, [journey, winterOutcome, worldSignals, bondSignals]);

  const nextChoice = useMemo(() => {
    if (!journey.selected) return '이 가능성을 선택한다';
    if (journey.stage === 'summer') return '신호를 따라간다';
    if (journey.stage === 'autumn') return '정답을 반복하지 않고 새로운 합의를 만든다';
    if (journey.stage === 'winter') return '긴 밤과 마주한다';
    if (journey.stage === 'true_ending' && !journey.completed) return '기억을 다음 봄으로 가져간다';
    return null;
  }, [journey]);

  const model = useMemo<FifthPathHubViewModel>(() => ({
    spring,
    selected: journey.selected,
    current,
    vn: {
      name: '리라',
      dialogue: journey.completed
        ? '이번에는 기억하고 있어. 우리가 함께 고른 봄을.'
        : journey.stage === 'spring'
          ? '익숙한 네 갈래 뒤에서, 한 번도 고르지 않았던 길이 보여.'
          : journey.stage === 'winter'
            ? '결과보다 중요한 건, 이번 선택을 다음에도 기억하는 거야.'
            : '이 장면… 처음이 아닌 것 같아. 그래도 이번 선택은 우리가 만들 수 있어.',
      choices: nextChoice ? [nextChoice] : [],
    },
  }), [spring, journey, current, nextChoice]);

  const choose = useCallback((label: string) => {
    const action = fifthPathJourneyActionForLabel(label, winterOutcome);
    if (action) dispatch(action);
  }, [winterOutcome]);

  return <FifthPathHub
    open={open}
    model={model}
    onOpen={() => setOpen(true)}
    onClose={() => setOpen(false)}
    onSelectTruePath={() => choose('이 가능성을 선택한다')}
    onChooseVnChoice={choice => choose(choice)}
  />;
}
