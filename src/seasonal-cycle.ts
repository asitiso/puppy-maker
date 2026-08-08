import type { ActivityId } from './game-core';
import type { OutingLocationId } from './adventure';

export type SeasonId = 'spring' | 'summer' | 'autumn' | 'winter';

export type SeasonalProfile = {
  season: SeasonId;
  label: string;
  weather: string;
  activity: ActivityId;
  outing: OutingLocationId;
  message: string;
};

const profiles: Record<SeasonId, SeasonalProfile> = {
  spring: {
    season: 'spring',
    label: '봄',
    weather: '🌸 꽃바람',
    activity: 'herb',
    outing: 'forest',
    message: '새싹이 돋는 계절이에요. 약초 채집과 별빛 숲 탐험에 좋은 달이에요.',
  },
  summer: {
    season: 'summer',
    label: '여름',
    weather: '☀ 맑고 뜨거움',
    activity: 'hunt',
    outing: 'lakeside',
    message: '활력이 넘치는 계절이에요. 사냥 훈련 뒤 호숫가에서 쉬어가면 좋아요.',
  },
  autumn: {
    season: 'autumn',
    label: '가을',
    weather: '🍂 선선한 별바람',
    activity: 'magic',
    outing: 'village',
    message: '집중하기 좋은 계절이에요. 마법 수업과 마법 마을 탐험이 잘 어울려요.',
  },
  winter: {
    season: 'winter',
    label: '겨울',
    weather: '❄ 차가운 눈바람',
    activity: 'rest',
    outing: 'lakeside',
    message: '몸을 돌보는 계절이에요. 포근한 휴식으로 컨디션을 지켜주세요.',
  },
};

function normalizedMonth(month: number): number {
  const integer = Math.trunc(Number.isFinite(month) ? month : 1);
  return ((integer - 1) % 12 + 12) % 12 + 1;
}

export function seasonalProfile(month: number): SeasonalProfile {
  const normalized = normalizedMonth(month);
  if (normalized >= 3 && normalized <= 5) return profiles.spring;
  if (normalized >= 6 && normalized <= 8) return profiles.summer;
  if (normalized >= 9 && normalized <= 11) return profiles.autumn;
  return profiles.winter;
}
