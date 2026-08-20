import {describe,expect,it} from 'vitest';
import {createBattleSession,type TacticalUnit} from './tactical-battle';
import {buildCombinationUltimateViews} from './tactical-ui';

const unit=(id:string,side:'ally'|'enemy',agility:number,mp=0,hp=100):TacticalUnit=>({id,side,position:'front',maxHp:100,hp,agility,ap:3,maxAp:3,mp,maxMp:10,shield:0});

function session(runaMp=10){
  return createBattleSession(
    [unit('runa','ally',30,runaMp),unit('companion-wolf','ally',20),unit('companion-owl','ally',10)],
    [unit('enemy-front','enemy',18),unit('enemy-back','enemy',9),unit('enemy-third','enemy',8)],
    31,
  );
}

describe('combination ultimate ui model',()=>{
  it('hides partners whose Bond has not reached level five',()=>{
    expect(buildCombinationUltimateViews(session(),['wolf','owl'],{wolf:4,owl:3})).toEqual([]);
  });

  it('shows an unlocked partner but disables it when Runa lacks MP',()=>{
    const views=buildCombinationUltimateViews(session(9),['wolf','owl'],{wolf:5,owl:2});
    expect(views).toHaveLength(1);
    expect(views[0]).toMatchObject({companionId:'wolf',label:'Twin Moon Assault',mpCost:10,available:false});
    expect(views[0].targetIds).toEqual([]);
  });

  it('exposes valid targets when the Bond Lv5 ultimate is usable',()=>{
    const views=buildCombinationUltimateViews(session(),['wolf','owl'],{wolf:5,owl:5});
    expect(views.map(view=>view.companionId)).toEqual(['wolf','owl']);
    expect(views[0].available).toBe(true);
    expect(views[0].targetIds).toEqual(['enemy-back','enemy-front','enemy-third']);
    expect(views[1].targetIds).toEqual(['companion-owl','companion-wolf','runa']);
  });
});
