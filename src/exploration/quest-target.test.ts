import {describe,expect,it} from 'vitest';
import type {ExplorationInteractable} from './exploration-types';

describe('exploration quest targets',()=>{
  it('supports a single visually tracked interactable without changing portal semantics',()=>{
    const target:ExplorationInteractable={id:'quest',label:'원정 게시판',kind:'portal',destinationId:'feature:expedition',position:{x:10,y:20},radius:100,questTarget:true,nameplate:'추천 의뢰 · 수호자 원정'};
    expect(target.questTarget).toBe(true);
    expect(target.destinationId).toBe('feature:expedition');
    expect(target.nameplate).toContain('추천 의뢰');
  });
});
