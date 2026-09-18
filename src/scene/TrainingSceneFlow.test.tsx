import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../TrainingActivityMinigame.tsx',import.meta.url),'utf8');

describe('V17 walkable training flow',()=>{
  it('enters each scheduled activity through a directly controlled exploration instance before the minigame',()=>{
    expect(source).toContain("from './exploration/MobileExplorationScene'");
    expect(source).toContain('trainingExplorationWorld');
    expect(source).toContain('TRAINING_BEGIN_DESTINATION');
    expect(source).toContain('<MobileExplorationScene');
    expect(source).toContain('showExitButton={false}');
    expect(source).toContain('setSceneReady(true)');
    expect(source).toContain('training-route-tracker');
    expect(source).not.toContain('<SceneStage');
  });

  it('keeps canonical training callbacks behind presentation routing',()=>{
    expect(source).toContain('onTrain(kind,safeAccuracy)');
    expect(source).toContain('onFinish');
    expect(source).not.toMatch(/dispatch\(|goldReward|masteryGain|statDelta|rewardAmount/);
  });
});
