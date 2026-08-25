import {describe,expect,it} from 'vitest';
import {hydrateGameState,initialState,reducer,type GameState} from './game';
import {weeklyEventFor} from './weekly-life';

describe('V5 multi-year weekly variation',()=>{
  it('keeps year-one V4 events unchanged while later life stages get deterministic world variants',()=>{
    const base={month:5,week:2,focus:'world' as const,activeCampaign:'caretaker',activeRoute:'normal',runNumber:1,inheritedFactCount:0,heritageTraits:[] as const};
    expect(weeklyEventFor({...base,year:1})).toBe('guardian_patrol');
    expect(weeklyEventFor({...base,year:2})).toBe('independent_patrol');
    expect(weeklyEventFor({...base,year:3})).toBe('veteran_patrol');
    expect(weeklyEventFor({...base,year:9})).toBe('veteran_patrol');
    expect(weeklyEventFor({...base,year:3})).toBe(weeklyEventFor({...base,year:3}));
  });

  it('lets bounded heritage shape a normal bond week without carrying raw power',()=>{
    const lineageLife={
      ...initialState,
      lineage:{generation:2,heritageTraits:['warm_heart'] as const,ancestors:[]},
    } as GameState;
    const selected=reducer(lineageLife,{type:'SELECT_WEEKLY_FOCUS',focus:'bond'});
    const completed=reducer(selected,{type:'COMPLETE_WEEKLY_FOCUS'});

    expect(completed.weeklyLife.lastEvent).toBe('ancestral_story');
    expect(completed.stats.affection).toBe(lineageLife.stats.affection+1);
    expect(completed.stats.strength).toBe(lineageLife.stats.strength);
    expect(completed.gold).toBe(lineageLife.gold);
  });

  it('keeps True and Hollow route atmosphere above age and heritage variants',()=>{
    const context={year:4,month:8,week:3,focus:'world' as const,runNumber:3,inheritedFactCount:4,heritageTraits:['warm_heart'] as const};
    expect(weeklyEventFor({...context,activeCampaign:'true_path',activeRoute:'normal'})).toBe('old_echo');
    expect(weeklyEventFor({...context,activeCampaign:'arcanist',activeRoute:'hollow'})).toBe('rift_whisper');
  });

  it('hydrates new deterministic event resolution keys without rerolling them away',()=>{
    const hydrated=hydrateGameState({
      ...initialState,
      year:3,
      month:5,
      week:3,
      weeklyLife:{
        focusKey:'3-5-3',
        focus:'world',
        completedWeekKey:'3-5-3',
        resolvedEventKeys:['3-5-3:veteran_patrol','3-5-3:veteran_patrol'],
        lastEvent:'veteran_patrol',
      },
    });
    expect(hydrated.weeklyLife.resolvedEventKeys).toEqual(['3-5-3:veteran_patrol']);
    expect(hydrated.weeklyLife.lastEvent).toBe('veteran_patrol');
  });
});
