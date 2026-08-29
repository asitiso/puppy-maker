import type {InteractionMode,ResolvedSceneInteraction} from './scene-types';

export const INTERACTION_MODES=[
  'dialogue','inspect','collect','travel','rest','shop',
  'training','choice','minigame','explore','battle','reward',
] as const satisfies readonly InteractionMode[];

export type SceneInteractionFamily='social'|'discovery'|'gather'|'movement'|'recovery'|'commerce'|'challenge'|'decision'|'reward';
export type SceneInteractionEmphasis='normal'|'required'|'new'|'recommended'|'disabled';

export interface SceneInteractionPresentation{
  iconToken:'speech'|'inspect'|'collect'|'travel'|'rest'|'shop'|'target'|'choice'|'spark'|'compass'|'battle'|'reward';
  family:SceneInteractionFamily;
  emphasis:SceneInteractionEmphasis;
  hintLabel:string|null;
}

const modePresentation:Record<InteractionMode,Pick<SceneInteractionPresentation,'iconToken'|'family'>>={
  dialogue:{iconToken:'speech',family:'social'},
  inspect:{iconToken:'inspect',family:'discovery'},
  collect:{iconToken:'collect',family:'gather'},
  travel:{iconToken:'travel',family:'movement'},
  rest:{iconToken:'rest',family:'recovery'},
  shop:{iconToken:'shop',family:'commerce'},
  training:{iconToken:'target',family:'challenge'},
  choice:{iconToken:'choice',family:'decision'},
  minigame:{iconToken:'spark',family:'challenge'},
  explore:{iconToken:'compass',family:'discovery'},
  battle:{iconToken:'battle',family:'challenge'},
  reward:{iconToken:'reward',family:'reward'},
};

function hintPresentation(interaction:ResolvedSceneInteraction):Pick<SceneInteractionPresentation,'emphasis'|'hintLabel'>{
  if(!interaction.enabled)return {emphasis:'disabled',hintLabel:null};
  if(interaction.hint==='required')return {emphasis:'required',hintLabel:'필수'};
  if(interaction.hint==='new')return {emphasis:'new',hintLabel:'NEW'};
  if(interaction.hint==='accessible-idle')return {emphasis:'recommended',hintLabel:'추천'};
  return {emphasis:'normal',hintLabel:null};
}

export function resolveSceneInteractionPresentation(interaction:ResolvedSceneInteraction):SceneInteractionPresentation{
  return {...modePresentation[interaction.mode],...hintPresentation(interaction)};
}
