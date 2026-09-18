// @ts-ignore -- source-contract test uses Node fs outside app tsconfig.
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {initialState,reducer} from './game';

const app=readFileSync(new URL('./App.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('./rpg-activity-loop.css',import.meta.url),'utf8');

describe('V17 RPG activity loop presentation',()=>{
  it('turns the monthly diary into a selectable activity quest board',()=>{
    expect(app).toContain('GUILD ACTIVITY BOARD');
    expect(app).toContain('rpg-contract-list');
    expect(app).toContain('rpg-contract-editor');
    expect(app).toContain('setSelectedWeek(index)');
    expect(app).toContain("type:'SET_SCHEDULE',index:selectedIndex,activity:id");
    expect(app).not.toContain("type:'SET_SCHEDULE', index: 0, activity:id");
    expect(app).toContain('활동 루트 출발');
  });

  it('keeps after-action dialogue choices while presenting them as RPG story decisions',()=>{
    expect(app).toContain('AFTER ACTION EVENT');
    expect(app).toContain('rpg-dialogue-choices');
    expect(app).toContain("choice:'hug'");
    expect(app).toContain("choice:'scold'");
    expect(app).toContain("choice:'snack'");
  });

  it('presents the monthly result as a quest debrief and really returns to the world',()=>{
    expect(app).toContain('QUEST DEBRIEF · MONTHLY REPORT');
    expect(app).toContain('월드로 돌아가 다음 달 시작');
    expect(app).toContain("dispatch({type:'NEXT_MONTH'})");
    const next=reducer({...initialState,screen:'result',month:3,week:4,trainingScore:777,combo:6},{type:'NEXT_MONTH'});
    expect(next.screen).toBe('hub');
    expect(next.month).toBe(4);
    expect(next.week).toBe(1);
    expect(next.trainingScore).toBe(0);
    expect(next.combo).toBe(0);
  });

  it('keeps the new loop mobile-safe and reduced-motion aware',()=>{
    expect(css).toContain('.rpg-contract-layout');
    expect(css).toContain('min-height:44px');
    expect(css).toContain('@media(max-width:430px)');
    expect(css).toContain('@media(max-height:650px)');
    expect(css).toContain('@media(prefers-reduced-motion:reduce)');
  });
});
