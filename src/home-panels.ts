export type HomeMenuId =
  | 'schedule'
  | 'bag'
  | 'quest'
  | 'outing'
  | 'bond'
  | 'attendance'
  | 'event'
  | 'mail'
  | 'mission';

export type HomePanel = {
  title: string;
  eyebrow: string;
  items: string[];
};

const panels: Partial<Record<HomeMenuId, HomePanel>> = {
  bag: {
    title: '가방',
    eyebrow: 'INVENTORY',
    items: ['별빛 간식', '회복 물약', '초보자 부적'],
  },
  quest: {
    title: '퀘스트',
    eyebrow: 'QUEST LOG',
    items: ['훈련 3회 완료 1/3', '루나와 대화 1/2', '외출 1회 0/1'],
  },
  outing: {
    title: '외출',
    eyebrow: 'ADVENTURE',
    items: ['별빛 숲', '마법 시장', '바람 언덕'],
  },
  attendance: {
    title: '출석체크',
    eyebrow: 'DAILY REWARD',
    items: ['오늘 보상 500G', '연속 출석 3일', '다음 보상 보석 20개'],
  },
  event: {
    title: '이벤트',
    eyebrow: 'LIMITED EVENT',
    items: ['여름 별빛 축제', '루나 성장 지원', '주말 보너스 훈련'],
  },
  mail: {
    title: '우편함',
    eyebrow: 'MAIL BOX',
    items: ['환영 선물', '주간 보상 도착', '운영팀 안내'],
  },
  mission: {
    title: '미션',
    eyebrow: 'DAILY MISSION',
    items: ['훈련 1회', '대화 1회', '가방 확인'],
  },
};

export function getHomePanel(id: HomeMenuId): HomePanel | null {
  return panels[id] ?? null;
}
