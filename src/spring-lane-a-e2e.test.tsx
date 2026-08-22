import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it} from 'vitest';
import {emptyCampaignRunState} from './campaign-state';
import {emptyCharacterBondsState} from './character-bonds';
import SpringHubOverlay,{type SpringHubViewModel} from './SpringHubOverlay';
import {applyFirstCommitmentCharacterBond,commitSpringCampaign,openPathConvergence,resolveFirstCommitment} from './spring-raising';

const tendencyLabel={
  faint_tendency:'희미한 기운',
  emerging_possibility:'떠오르는 가능성',
  strongly_opening_path:'강하게 열리는 길',
} as const;

describe('V3 Spring Lane A Raising → Story/UI',()=>{
  it('carries qualitative convergence through commitment VN and Character Bond without raw affinity leakage',()=>{
    const opened=openPathConvergence(emptyCampaignRunState(),[
      {campaign:'caretaker',source:'bond',amount:6,reason:'미라와 책임을 나누기로 했다'},
      {campaign:'caretaker',source:'dialogue',amount:5,reason:'보호를 먼저 선택했다'},
      {campaign:'pathfinder',source:'exploration',amount:6,reason:'숨겨진 길을 발견했다'},
    ]);
    const committed=commitSpringCampaign(opened.state,opened.candidates,'caretaker');
    const commitment=resolveFirstCommitment(committed.state);
    expect(commitment.event).not.toBeNull();
    const bonds=applyFirstCommitmentCharacterBond(emptyCharacterBondsState(),commitment.event!);

    const model:SpringHubViewModel={
      season:'봄 · Path Convergence',
      campaign:committed.state.activeCampaign??'아직 선택하지 않음',
      phase:commitment.state.phase,
      primaryCta:'Journey 열기',
      relationChange:bonds.mira.memories.includes('mira_first_commitment')?'미라와 첫 약속을 기억합니다.':'관계 변화 없음',
      worldChange:'공유 월드는 계속 이어집니다.',
      journey:{objective:'어떤 수호자가 될지 선택했습니다.',events:['Path Convergence','First Commitment'],upcomingQuestion:'이 선택을 어떻게 지켜낼까요?'},
      convergence:opened.candidates.map(candidate=>({id:candidate.campaign,title:candidate.campaign,tendency:tendencyLabel[candidate.tendency],reason:candidate.reasons[0],evidence:candidate.reasons})),
      bonds:[{id:'mira',name:'미라',trust:bonds.mira.trust>0?'신뢰가 자라는 중':'아직 낯섦',memory:bonds.mira.memories[0]??'없음',promise:'아직 없음',conflict:'아직 없음'}],
      vn:{portrait:'/assets/runa/runa_talk.png',name:'미라',dialogue:'이제 네가 고른 길을 같이 걸어 보자.',choices:['함께 간다'],log:['Caretaker를 선택했다.'],seen:false},
    };

    const journeyHtml=renderToStaticMarkup(<SpringHubOverlay open model={model} onOpen={()=>undefined} onClose={()=>undefined}/>);
    expect(journeyHtml).toContain('강하게 열리는 길');
    expect(journeyHtml).toContain('mira_first_commitment');
    expect(journeyHtml).toContain('이제 네가 고른 길을 같이 걸어 보자.');
    expect(journeyHtml).toContain('신뢰가 자라는 중');
    expect(journeyHtml).not.toMatch(/affinity/i);
    expect(journeyHtml).not.toContain('11');

    const homeHtml=renderToStaticMarkup(<SpringHubOverlay open={false} model={model} onOpen={()=>undefined} onClose={()=>undefined}/>);
    expect(homeHtml).toContain('미라와 첫 약속을 기억합니다.');
    expect(homeHtml).toContain('caretaker');
  });
});
