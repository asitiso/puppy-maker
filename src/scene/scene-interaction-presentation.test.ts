import {describe,expect,it} from 'vitest';
import {INTERACTION_MODES,resolveSceneInteractionPresentation} from './scene-interaction-presentation';
import type {ResolvedSceneInteraction} from './scene-types';

const expectedIcons={
  dialogue:'speech',
  inspect:'inspect',
  collect:'collect',
  travel:'travel',
  rest:'rest',
  shop:'shop',
  training:'target',
  choice:'choice',
  minigame:'spark',
  explore:'compass',
  battle:'battle',
  reward:'reward',
} as const;

function interaction(overrides:Partial<ResolvedSceneInteraction>={}):ResolvedSceneInteraction{
  return {
    id:'sample',label:'행동',mode:'inspect',anchorId:'sample',enabled:true,hint:'none',
    ...overrides,
  };
}

describe('V14 scene interaction presentation',()=>{
  it('gives every interaction mode a stable environmental icon token',()=>{
    expect(INTERACTION_MODES).toEqual(Object.keys(expectedIcons));
    for(const mode of INTERACTION_MODES){
      expect(resolveSceneInteractionPresentation(interaction({mode})).iconToken).toBe(expectedIcons[mode]);
    }
  });

  it('groups modes into readable action families without changing their game mode',()=>{
    expect(resolveSceneInteractionPresentation(interaction({mode:'dialogue'})).family).toBe('social');
    expect(resolveSceneInteractionPresentation(interaction({mode:'inspect'})).family).toBe('discovery');
    expect(resolveSceneInteractionPresentation(interaction({mode:'explore'})).family).toBe('discovery');
    expect(resolveSceneInteractionPresentation(interaction({mode:'collect'})).family).toBe('gather');
    expect(resolveSceneInteractionPresentation(interaction({mode:'travel'})).family).toBe('movement');
    expect(resolveSceneInteractionPresentation(interaction({mode:'training'})).family).toBe('challenge');
    expect(resolveSceneInteractionPresentation(interaction({mode:'battle'})).family).toBe('challenge');
    expect(resolveSceneInteractionPresentation(interaction({mode:'reward'})).family).toBe('reward');
  });

  it('turns existing hint state into a compact visible priority badge',()=>{
    expect(resolveSceneInteractionPresentation(interaction({hint:'required'}))).toMatchObject({emphasis:'required',hintLabel:'필수'});
    expect(resolveSceneInteractionPresentation(interaction({hint:'new'}))).toMatchObject({emphasis:'new',hintLabel:'NEW'});
    expect(resolveSceneInteractionPresentation(interaction({hint:'accessible-idle'}))).toMatchObject({emphasis:'recommended',hintLabel:'추천'});
    expect(resolveSceneInteractionPresentation(interaction({hint:'none'}))).toMatchObject({emphasis:'normal',hintLabel:null});
    expect(resolveSceneInteractionPresentation(interaction({enabled:false,hint:'required'}))).toMatchObject({emphasis:'disabled'});
  });
});
