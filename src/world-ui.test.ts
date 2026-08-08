import { describe, expect, it } from 'vitest';
import { initialState, type GameState } from './game';
import { worldResultSummary, worldUiSummary } from './world-ui';

describe('world UI summaries', () => {
  it('summarizes the current event, season and monthly contracts', () => {
    const summary = worldUiSummary(initialState);
    expect(summary.event).toEqual(expect.objectContaining({
      label:'별똥별 흔적',
      regionId:'starlight_forest',
      regionLabel:'별빛 숲',
      bonusLabel:'추천 지역 +5 시즌점수 · S등급 재료 +1',
    }));
    expect(summary.season).toEqual(expect.objectContaining({
      key:'1-spring',
      score:0,
      nextThreshold:50,
      percent:0,
    }));
    expect(summary.contracts).toHaveLength(3);
    expect(summary.contracts.every(item => item.progress === 0 && item.rewarded === false)).toBe(true);
  });

  it('reports tier progress and already claimed rewards', () => {
    const state: GameState = {
      ...initialState,
      expeditionSeasonScores:{ '1-spring':130 },
      claimedExpeditionSeasonTiers:['1-spring:1','1-spring:2'],
    };
    const summary = worldUiSummary(state);
    expect(summary.season.score).toBe(130);
    expect(summary.season.nextThreshold).toBe(220);
    expect(summary.season.percent).toBe(59);
    expect(summary.season.tiers.map(item => item.status)).toEqual(['claimed','claimed','locked','locked']);
  });

  it('clamps maxed regional renown and marks a completed contract', () => {
    const state: GameState = {
      ...initialState,
      regionalRenown:{ starlight_forest:99, ancient_city:5, wind_lakes:0 },
      worldContractProgress:{ expedition_clear:3, high_grade:1, featured_region:0 },
      rewardedWorldContracts:['1-4:expedition_clear'],
    };
    const summary = worldUiSummary(state);
    expect(summary.regions[0]).toEqual(expect.objectContaining({
      id:'starlight_forest',
      level:5,
      percent:100,
      nextThreshold:null,
    }));
    expect(summary.regions[1]).toEqual(expect.objectContaining({ level:2, percent:0, nextThreshold:12 }));
    expect(summary.contracts[0]).toEqual(expect.objectContaining({ progress:3, target:3, percent:100, rewarded:true }));
  });

  it('summarizes the latest world rewards for the expedition result screen', () => {
    const state: GameState = {
      ...initialState,
      lastWorldProgress:{
        region:'starlight_forest',
        renownGain:3,
        renownLevel:2,
        seasonPoints:35,
        eventSeasonPoints:5,
        eventMaterialBonus:1,
        seasonTiersClaimed:[1,2],
        completedContracts:['high_grade','featured_region'],
      },
    };
    expect(worldResultSummary(state)).toEqual({
      regionLabel:'별빛 숲',
      renownLabel:'+3 · Lv.2',
      seasonLabel:'+35점 (이벤트 +5)',
      eventMaterialLabel:'추천 지역 S등급 재료 +1',
      seasonRewardLabel:'시즌 보상 1·2단계 자동 수령',
      contractLabel:'빛나는 기록 · 월드 이벤트 지원 완료',
    });
  });
});
