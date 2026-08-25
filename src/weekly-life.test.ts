import {describe,expect,it} from 'vitest';
import {
  emptyWeeklyLifeState,
  hydrateWeeklyLifeState,
  selectWeeklyFocus,
  weeklyEventEffect,
  weeklyEventFor,
} from './weekly-life';

describe('V4 weekly life state',()=>{
  it('hydrates malformed state to canonical safe values',()=>{
    expect(hydrateWeeklyLifeState({focusKey:'bad',focus:'hack',completedWeekKey:'1-13-2',resolvedEventKeys:['bad','1-4-2:market_day','1-4-2:market_day'],lastEvent:'hack'})).toEqual({
      focusKey:null,
      focus:null,
      completedWeekKey:null,
      resolvedEventKeys:['1-4-2:market_day'],
      lastEvent:null,
    });
  });

  it('stores a focus only for the current semantic week',()=>{
    const selected=selectWeeklyFocus(emptyWeeklyLifeState(),'2-5-3','bond');
    expect(selected.focusKey).toBe('2-5-3');
    expect(selected.focus).toBe('bond');
    const completed={...selected,completedWeekKey:'2-5-3'};
    expect(selectWeeklyFocus(completed,'2-5-3','world')).toBe(completed);
    expect(completed.focus).toBe('bond');
  });

  it('derives the same event for the same semantic week without rerolling',()=>{
    const context={year:2,month:5,week:3,focus:'bond' as const,activeCampaign:'caretaker',activeRoute:'normal',runNumber:1,inheritedFactCount:0};
    expect(weeklyEventFor(context)).toBe('campfire_invitation');
    expect(weeklyEventFor(context)).toBe(weeklyEventFor({...context}));
  });

  it('lets True/NG+ and Hollow context change weekly atmosphere',()=>{
    expect(weeklyEventFor({year:2,month:5,week:1,focus:'training',activeCampaign:'true_path',activeRoute:'normal',runNumber:3,inheritedFactCount:2})).toBe('old_echo');
    expect(weeklyEventFor({year:2,month:5,week:1,focus:'training',activeCampaign:'arcanist',activeRoute:'hollow',runNumber:3,inheritedFactCount:2})).toBe('rift_whisper');
  });

  it('keeps event effects deliberately bounded',()=>{
    for(const id of ['training_partner','quiet_rain','market_day','campfire_invitation','guardian_patrol','rival_challenge','festival_preparation','old_echo','rift_whisper'] as const){
      const effect=weeklyEventEffect(id);
      expect(Math.abs(effect.gold)).toBeLessThanOrEqual(100);
      for(const value of Object.values(effect.stats)) expect(Math.abs(value ?? 0)).toBeLessThanOrEqual(6);
    }
  });
});
