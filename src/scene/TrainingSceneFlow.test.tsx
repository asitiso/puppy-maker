import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../TrainingActivityMinigame.tsx',import.meta.url),'utf8');

describe('V14 training scene-first flow',()=>{
  it('enters each scheduled activity through its resolved SceneStage before the minigame',()=>{
    expect(source).toContain("from './scene/SceneStage'");
    expect(source).toContain('trainingSceneForActivity');
    expect(source).toContain('primaryTrainingInteraction');
    expect(source).toContain('<SceneStage');
    expect(source).toContain('setSceneReady(true)');
  });

  it('keeps canonical training callbacks behind presentation routing',()=>{
    expect(source).toContain('onTrain(kind,safeAccuracy)');
    expect(source).toContain('onFinish');
    expect(source).not.toMatch(/dispatch\(|goldReward|masteryGain|statDelta|rewardAmount/);
  });
});
