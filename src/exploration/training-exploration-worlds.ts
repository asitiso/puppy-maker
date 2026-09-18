import type {ExplorationWorldDefinition} from './exploration-types';
import type {PlayableTrainingActivity} from '../training-minigames';

export const TRAINING_BEGIN_DESTINATION='training:begin';

const trainingWorlds:Record<PlayableTrainingActivity,ExplorationWorldDefinition>={
  hunt:{
    id:'training-instance:hunt',
    label:'수호자 훈련장',
    objective:'훈련 인형이 있는 전투 구역까지 직접 이동해 사냥 실습을 시작하세요.',
    width:1800,
    height:1100,
    playerRadius:22,
    playerSpeed:255,
    start:{x:320,y:850},
    obstacles:[],
    layers:[{id:'ground',src:'/assets/training/fight_training_bg.webp',zIndex:0}],
    interactables:[{
      id:'hunt-practice',
      label:'훈련 인형 · 사냥 실습 시작',
      kind:'portal',
      destinationId:TRAINING_BEGIN_DESTINATION,
      position:{x:1320,y:590},
      radius:145,
    }],
  },
  magic:{
    id:'training-instance:magic',
    label:'별빛 마법 교실',
    objective:'중앙 마법진까지 직접 이동해 룬 기억 실습을 시작하세요.',
    width:1800,
    height:1100,
    playerRadius:22,
    playerSpeed:255,
    start:{x:320,y:850},
    obstacles:[],
    layers:[{id:'ground',src:'/assets/training/magic_training_bg.webp',zIndex:0}],
    interactables:[{
      id:'magic-practice',
      label:'중앙 마법진 · 룬 실습 시작',
      kind:'portal',
      destinationId:TRAINING_BEGIN_DESTINATION,
      position:{x:1220,y:500},
      radius:145,
    }],
  },
  herb:{
    id:'training-instance:herb',
    label:'약초 정원',
    objective:'약초 작업대까지 직접 이동해 채집 판별 실습을 시작하세요.',
    width:1800,
    height:1100,
    playerRadius:22,
    playerSpeed:255,
    start:{x:320,y:850},
    obstacles:[],
    layers:[{id:'ground',src:'/assets/outing/park_bg.webp',zIndex:0}],
    interactables:[{
      id:'herb-practice',
      label:'약초 작업대 · 채집 실습 시작',
      kind:'portal',
      destinationId:TRAINING_BEGIN_DESTINATION,
      position:{x:1280,y:650},
      radius:145,
    }],
  },
};

export function trainingExplorationWorld(activity:PlayableTrainingActivity):ExplorationWorldDefinition{
  return trainingWorlds[activity];
}
