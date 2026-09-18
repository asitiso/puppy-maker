import type {MobileContentCategory} from './mobile-router';

export type WorldQuestNpc={
  id:string;
  name:string;
  role:string;
  category:MobileContentCategory;
  greeting:string;
  completion:string;
};

const roster:Record<MobileContentCategory,WorldQuestNpc>={
  life:{id:'momo',name:'모모',role:'생활 길드 안내원',category:'life',greeting:'오늘 챙길 일을 짧게 정리해 줄게.',completion:'좋아, 오늘 할 일을 하나 확실히 끝냈네!'},
  growth:{id:'arin',name:'아린',role:'수련관 교관',category:'growth',greeting:'지금 성장에 가장 도움이 되는 훈련부터 보자.',completion:'성장이 눈에 보여. 다음 목표도 이어가자.'},
  adventure:{id:'bora',name:'보라',role:'원정대장',category:'adventure',greeting:'진행 중인 모험에서 가장 중요한 목표를 골라뒀어.',completion:'원정 기록 확인 완료. 다음 목적지를 갱신할게.'},
  bond:{id:'nabi',name:'나비',role:'인연 정원사',category:'bond',greeting:'마음을 전할 좋은 기회를 놓치지 않게 알려줄게.',completion:'마음이 잘 전해졌어. 인연이 한 걸음 깊어졌네.'},
  records:{id:'noa',name:'노아',role:'기록 보관관',category:'records',greeting:'지금까지의 여정에서 확인할 기록을 찾아뒀어.',completion:'기록 정리 완료. 다음 여정도 빠짐없이 남겨둘게.'},
};

export function questNpcForCategory(category:MobileContentCategory){return roster[category];}
