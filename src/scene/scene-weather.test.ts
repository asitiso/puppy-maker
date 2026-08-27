import {describe,expect,it} from 'vitest';
import {weatherForWeek} from './scene-weather';

const allowed=new Set(['clear','cloudy','rain','snow','mist']);

describe('V14 deterministic scene weather',()=>{
  it('returns the same allowed weather for the same canonical week',()=>{
    const first=weatherForWeek(3,8,2);
    expect(allowed.has(first)).toBe(true);
    for(let index=0;index<20;index+=1){
      expect(weatherForWeek(3,8,2)).toBe(first);
    }
  });

  it('uses canonical week normalization before hashing',()=>{
    expect(weatherForWeek(2,0,0)).toBe(weatherForWeek(2,1,1));
    expect(weatherForWeek(2,99,99)).toBe(weatherForWeek(2,12,4));
    expect(weatherForWeek(Number.NaN,Number.NaN,Number.NaN)).toBe(weatherForWeek(1,1,1));
  });

  it('does not collapse every week to one weather value',()=>{
    const values=new Set<string>();
    for(let month=1;month<=12;month+=1){
      for(let week=1;week<=4;week+=1){
        values.add(weatherForWeek(1,month,week));
      }
    }
    expect(values.size).toBeGreaterThan(1);
  });
});
