import { describe, expect, it } from 'vitest';
import { activityPersonalityDelta, applyPersonalityDelta, dominantPersonality } from './personality';

describe('personality progression', () => {
  const base={courage:50,kindness:50,curiosity:50,calmness:50};
  it('clamps personality changes',()=>expect(applyPersonalityDelta({...base,kindness:99},{kindness:9}).kindness).toBe(100));
  it('derives a stable dominant trait',()=>expect(dominantPersonality({...base,curiosity:80})).toBe('curiosity'));
  it('gives activities distinct tendencies',()=>{expect(activityPersonalityDelta('hunt')).toEqual({courage:2});expect(activityPersonalityDelta('rest')).toEqual({calmness:2});});
});