import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {challengeForRound,magicPatternForRound} from './training-minigames';

const source=readFileSync(new URL('./TrainingActivityMinigame.tsx',import.meta.url),'utf8');

describe('V14 deep scheduled training presentation',()=>{
  it('raises challenge pressure across all three activities while keeping deterministic weeks',()=>{
    for(const activity of ['hunt','magic','herb'] as const){
      expect(challengeForRound(activity,202608,2).difficulty).toBeGreaterThan(challengeForRound(activity,202608,0).difficulty);
      expect(challengeForRound(activity,202608,1)).toEqual(challengeForRound(activity,202608,1));
    }
    expect(magicPatternForRound(202608,2)).toHaveLength(5);
  });

  it('keeps reward ownership outside the minigame component',()=>{
    expect(source).toContain('challengeForRound');
    expect(source).toContain("onTrain(kind,safeAccuracy)");
    expect(source).toContain('onFinish');
    expect(source).not.toMatch(/goldReward|masteryGain|statDelta|rewardAmount/);
  });
});
