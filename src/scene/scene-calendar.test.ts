import {describe,expect,it} from 'vitest';
import {seasonForMonth} from './scene-calendar';

describe('V14 scene calendar',()=>{
  it('maps canonical month boundaries to the fixed seasons',()=>{
    expect(seasonForMonth(1)).toBe('spring');
    expect(seasonForMonth(3)).toBe('spring');
    expect(seasonForMonth(4)).toBe('summer');
    expect(seasonForMonth(6)).toBe('summer');
    expect(seasonForMonth(7)).toBe('autumn');
    expect(seasonForMonth(9)).toBe('autumn');
    expect(seasonForMonth(10)).toBe('winter');
    expect(seasonForMonth(12)).toBe('winter');
  });

  it('normalizes malformed months through the canonical weekly calendar rules',()=>{
    expect(seasonForMonth(0)).toBe('spring');
    expect(seasonForMonth(-10)).toBe('spring');
    expect(seasonForMonth(Number.NaN)).toBe('spring');
    expect(seasonForMonth(Number.POSITIVE_INFINITY)).toBe('spring');
    expect(seasonForMonth(13)).toBe('winter');
    expect(seasonForMonth(99)).toBe('winter');
    expect(seasonForMonth(4.9)).toBe('summer');
  });
});
