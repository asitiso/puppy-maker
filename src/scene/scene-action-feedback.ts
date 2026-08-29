import type {SceneRuntimePhase} from './scene-runtime';
import type {InteractionMode,ResolvedSceneInteraction} from './scene-types';

export type SceneActionFeedbackTone='info'|'success';

export interface SceneActionFeedback{
  message:string;
  tone:SceneActionFeedbackTone;
  busy:boolean;
}

const resultMessage:Record<InteractionMode,string>={
  dialogue:'대화를 열었어요.',
  inspect:'확인했어요.',
  collect:'수집 결과를 확인했어요.',
  travel:'이동을 시작했어요.',
  rest:'휴식 선택을 확인했어요.',
  shop:'상점을 열었어요.',
  training:'훈련을 시작했어요.',
  choice:'선택을 반영했어요.',
  minigame:'활동을 시작했어요.',
  explore:'탐험 선택을 반영했어요.',
  battle:'전투를 시작했어요.',
  reward:'보상을 확인했어요.',
};

export function sceneActionFeedback(
  interaction:ResolvedSceneInteraction|undefined,
  phase:SceneRuntimePhase,
):SceneActionFeedback|null{
  if(!interaction||phase==='idle') return null;
  if(phase==='approaching') return {message:`${interaction.label} · 이동 중`,tone:'info',busy:true};
  if(phase==='acting') return {message:`${interaction.label} · 진행 중`,tone:'info',busy:true};
  if(phase==='committing') return {message:`${interaction.label} · 반영 중`,tone:'info',busy:true};
  return {message:`${interaction.label} · ${resultMessage[interaction.mode]}`,tone:'success',busy:false};
}
