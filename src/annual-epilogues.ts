import { annualHonor } from './annual-honors';
import type { AnnualRecord } from './annual-records';

export type AnnualEpilogue = {
  title: string;
  runaLine: string;
  narration: string;
};

export function annualEpilogue(record: AnnualRecord): AnnualEpilogue {
  const honor = annualHonor(record).id;
  if (honor === 'four_seasons') return {
    title:'네 계절을 함께 걸은 해',
    runaLine:'봄부터 겨울까지… 주인님과 함께여서 모든 길이 특별했어요.',
    narration:'계절이 네 번 바뀌는 동안 루나는 같은 집으로 돌아왔고, 그때마다 조금씩 더 단단해졌습니다.',
  };
  if (honor === 'training_ace') return {
    title:'강해지는 법을 배운 해',
    runaLine:'처음엔 힘들었지만, 이제는 제가 얼마나 성장했는지 알 것 같아요!',
    narration:'반복된 훈련은 단순한 힘이 아니라 자신감과 집중력을 루나에게 남겼습니다.',
  };
  if (honor === 'trailblazer') return {
    title:'세상을 넓게 바라본 해',
    runaLine:'아직 못 가본 길이 이렇게 많다니… 다음에는 어디로 가볼까요?',
    narration:'새로운 장소와 발견은 루나의 세계를 넓혔고, 집으로 돌아오는 길의 의미도 바꾸었습니다.',
  };
  if (honor === 'heart_keeper') return {
    title:'마음이 가까워진 해',
    runaLine:'올해 가장 기억에 남는 건… 역시 주인님과 같이 있었던 순간들이에요.',
    narration:'작은 선물과 대화, 함께한 기억이 쌓이며 두 사람 사이의 거리는 눈에 띄게 가까워졌습니다.',
  };
  return {
    title:'천천히 단단해진 해',
    runaLine:'크게 달라진 것 같지 않아도, 돌아보면 정말 많은 게 변했네요.',
    narration:'서두르지 않은 선택들이 모여 루나만의 균형 잡힌 한 해를 만들었습니다.',
  };
}
