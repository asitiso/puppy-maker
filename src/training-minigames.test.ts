import {describe,expect,it} from 'vitest';
import {buildTrainingActivityQueue,challengeForRound,magicPatternForRound,herbOrderForRound,trainingActionForActivity} from './training-minigames';

describe('activity-specific training minigames',()=>{
  it('plays every scheduled non-rest activity in schedule order',()=>{
    expect(buildTrainingActivityQueue(['hunt','magic','rest','herb'])).toEqual(['hunt','magic','herb']);
    expect(buildTrainingActivityQueue(['magic','magic','rest','herb'])).toEqual(['magic','magic','herb']);
    expect(buildTrainingActivityQueue(['rest','rest','rest','rest'])).toEqual([]);
  });

  it('keeps each activity on the existing TRAIN action vocabulary',()=>{
    expect(trainingActionForActivity('hunt')).toBe('attack');
    expect(trainingActionForActivity('magic')).toBe('charge');
    expect(trainingActionForActivity('herb')).toBe('dodge');
  });

  it('makes magic and herb rounds deterministic but progressively varied',()=>{
    const magic0=magicPatternForRound(10401,0);
    const magic1=magicPatternForRound(10401,1);
    expect(magic0).toHaveLength(3);
    expect(magic1).toHaveLength(4);
    expect(magic0).not.toEqual(magic1);
    expect(magicPatternForRound(10401,0)).toEqual(magic0);

    const herb0=herbOrderForRound(10401,0);
    const herb1=herbOrderForRound(10401,1);
    expect(new Set(herb0).size).toBe(3);
    expect(herb0).not.toEqual(herb1);
    expect(herbOrderForRound(10401,0)).toEqual(herb0);
  });

  it('deepens challenge presentation deterministically without changing canonical rewards',()=>{
    for(const activity of ['hunt','magic','herb'] as const){
      const early=challengeForRound(activity,10401,0);
      const late=challengeForRound(activity,10401,2);
      expect(late.difficulty).toBeGreaterThan(early.difficulty);
      expect(challengeForRound(activity,10401,2)).toEqual(late);
      expect(['clean','good','recovered']).toContain(late.presentationGradeFloor);
    }
    expect(challengeForRound('hunt',10401,2).timingWindow).toBeLessThan(challengeForRound('hunt',10401,0).timingWindow);
    expect(challengeForRound('magic',10401,2).previewMs).toBeLessThan(challengeForRound('magic',10401,0).previewMs);
    expect(challengeForRound('magic',10401,2).sequenceLength).toBeGreaterThan(challengeForRound('magic',10401,0).sequenceLength);
    expect(challengeForRound('herb',10401,2).distractorCloseness).toBeGreaterThan(challengeForRound('herb',10401,0).distractorCloseness);
  });
});
