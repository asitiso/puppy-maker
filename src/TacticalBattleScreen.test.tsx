import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it} from 'vitest';
import TacticalBattleScreen from './TacticalBattleScreen';
import {createBattleSession,type TacticalUnit} from './tactical-battle';

const unit=(id:string,side:'ally'|'enemy',agility:number,mp=0):TacticalUnit=>({id,side,position:'front',maxHp:100,hp:100,agility,ap:3,maxAp:3,mp,maxMp:10,shield:0});

function battle(){return createBattleSession([
  unit('runa','ally',30,10),unit('companion-wolf','ally',20),unit('companion-owl','ally',10),
],[unit('enemy-front','enemy',18),unit('enemy-back','enemy',9),unit('enemy-third','enemy',8)],41)}

describe('TacticalBattleScreen combination ultimates',()=>{
  it('renders only Bond Lv5 party ultimates',()=>{
    const html=renderToStaticMarkup(<TacticalBattleScreen
      session={battle()}
      auto={false}
      speed={1}
      party={['wolf','owl']}
      bondLevels={{wolf:5,owl:4}}
    />);
    expect(html).toContain('Twin Moon Assault');
    expect(html).toContain('BOND 5');
    expect(html).not.toContain('Moonlight Prayer');
  });

  it('announces battle feedback and exposes unit cards as keyboard-aware target controls',()=>{
    const html=renderToStaticMarkup(<TacticalBattleScreen session={battle()} auto={false} speed={1}/>);
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-label="Battle log"');
    expect(html).toContain('role="button"');
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('tabindex="-1"');
  });
});
