import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import {initialState} from './game';
import RpgDistrictHub from './RpgDistrictHub';
import type {MobileContentCategory} from './mobile-router';

const npcNames:Record<MobileContentCategory,string>={life:'모모',growth:'아린',adventure:'보라',bond:'나비',records:'노아'};

const expected:Record<MobileContentCategory,string[]>={
  life:['훈련 일정판 · 하루 스케줄','주간 작전판 · 이번 주 계획','의뢰 데스크 · 이번 달 목표','출석 광장 · 월간 보상','우편소 · 도착한 편지'],
  growth:['성장 제단 · 정체성과 Calling','목표석 · 올해의 야망','명예 게시판 · 성장 업적','장비고 · 능력과 보유품','시즌 문 · 시즌 여정','별빛 성소 · 장기 성장'],
  adventure:['월드 게이트 · 지역 탐험','원정 게시판 · 수호자 전투','세계 지도 · 지역 진행'],
  bond:['인연 정원 · 루나와 교감','선물 공방 · 마음 전하기','기억 정자 · 열린 이야기'],
  records:['성장 도감 · 수집 기록','가문 연대기 · 세대 기록','세계 연대기 · 선택의 흔적'],
};

describe('RPG district hub',()=>{
  for(const category of Object.keys(expected) as MobileContentCategory[]){
    it(`${category} renders physical facility destinations and an exit back to town`,()=>{
      const html=renderToStaticMarkup(<RpgDistrictHub category={category} state={initialState} onFeature={vi.fn()} onBack={vi.fn()}/>);
      for(const label of expected[category]) expect(html).toContain(label);
      expect(html).toContain(npcNames[category]);
      expect(html).toContain('NPC 의뢰');
      expect(html).toContain('의뢰 수락·완료는 NPC에게 직접 다가가 대화하세요.');
      expect(html).not.toContain('수락하고 바로 이동');
      expect(html).not.toContain('목적지 열기');
      expect(html).toContain('탐험 종료');
      expect(html).not.toContain('v8-category-entry');
    });
  }
});
