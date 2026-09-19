import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import type {MobileWorldRecommendation} from './mobile-category-guidance';
import WorldQuestNpcDialog from './WorldQuestNpcDialog';
import {questFromRecommendation,type WorldQuestHistory} from './world-quest-contract';
import {questNpcForCategory} from './world-quest-npcs';

const recommendation:MobileWorldRecommendation={
  category:'adventure',
  feature:'expedition',
  label:'수호자 원정',
  description:'원정 준비',
  reason:'다음 모험 목표입니다.',
  priority:'routine',
};
const history:WorldQuestHistory={completed:5,lastCompletedAt:null,lastTitle:null,lastIssuerName:null,completedByIssuer:{bora:5},recent:[]};
const callbacks={onClose:vi.fn(),onAccept:vi.fn(),onAbandon:vi.fn(),onTurnIn:vi.fn(),onToggleContinuous:vi.fn()};

describe('world quest NPC dialog',()=>{
  it('offers a new contract only through the physical NPC conversation',()=>{
    const html=renderToStaticMarkup(<WorldQuestNpcDialog npc={questNpcForCategory('adventure')} recommendation={recommendation} activeQuest={null} history={history} continuous={false} {...callbacks}/>);
    expect(html).toContain('WORLD QUEST NPC');
    expect(html).toContain('보라');
    expect(html).toContain('단골 모험가');
    expect(html).toContain('NEW CONTRACT');
    expect(html).toContain('의뢰 수락');
    expect(html).toContain('완료 후 다음 의뢰 자동 수락');
  });

  it('shows a real turn-in action only after the objective is ready',()=>{
    const active={...questFromRecommendation(recommendation),readyToTurnIn:true,readyAt:'2026-09-19T05:00:00.000Z'};
    const html=renderToStaticMarkup(<WorldQuestNpcDialog npc={questNpcForCategory('adventure')} recommendation={recommendation} activeQuest={active} history={history} continuous={true} {...callbacks}/>);
    expect(html).toContain('TURN IN');
    expect(html).toContain('완료 보고');
    expect(html).toContain('연속 의뢰 끄기');
    expect(html).not.toContain('의뢰 포기');
  });

  it('does not let the wrong district NPC complete another issuer quest',()=>{
    const active=questFromRecommendation(recommendation);
    const bondRecommendation:MobileWorldRecommendation={category:'bond',feature:'bond',label:'루나와 교감',description:'교감',reason:'인연 목표',priority:'routine'};
    const html=renderToStaticMarkup(<WorldQuestNpcDialog npc={questNpcForCategory('bond')} recommendation={bondRecommendation} activeQuest={active} history={history} continuous={false} {...callbacks}/>);
    expect(html).toContain('BUSY');
    expect(html).toContain('보라의 의뢰를 수행 중입니다');
    expect(html).toContain('대화 마치기');
    expect(html).not.toContain('완료 보고');
  });
});
