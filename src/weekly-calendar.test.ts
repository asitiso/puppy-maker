import {describe,expect,it} from 'vitest';
import {advanceWeekDate,isCanonicalWeekKey,weekKey} from './weekly-calendar';

describe('V4 weekly calendar',()=>{
  it('builds canonical bounded week keys',()=>{
    expect(weekKey(1,4,1)).toBe('1-4-1');
    expect(weekKey(Number.NaN,99,9)).toBe('1-12-4');
    expect(isCanonicalWeekKey('2-12-4')).toBe(true);
    expect(isCanonicalWeekKey('0-12-4')).toBe(false);
    expect(isCanonicalWeekKey('2-13-1')).toBe(false);
    expect(isCanonicalWeekKey('2-12-5')).toBe(false);
  });

  it('advances weeks inside a month before rolling the month',()=>{
    expect(advanceWeekDate({year:1,month:4,week:1})).toEqual({year:1,month:4,week:2,monthChanged:false,yearChanged:false});
    expect(advanceWeekDate({year:1,month:4,week:3})).toEqual({year:1,month:4,week:4,monthChanged:false,yearChanged:false});
    expect(advanceWeekDate({year:1,month:4,week:4})).toEqual({year:1,month:5,week:1,monthChanged:true,yearChanged:false});
  });

  it('rolls December week four into the next year',()=>{
    expect(advanceWeekDate({year:2,month:12,week:4})).toEqual({year:3,month:1,week:1,monthChanged:true,yearChanged:true});
  });
});
