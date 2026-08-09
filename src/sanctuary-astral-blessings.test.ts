import { describe, expect, it } from 'vitest';
import {
  astralBlessingEffects,
  astralBlessings,
  resolveAstralBlessingPurchase,
} from './sanctuary-astral-blessings';

describe('astral blessings', () => {
  it('defines four permanent star-shard upgrades', () => {
    expect(astralBlessings.map(item => item.id)).toEqual(['scholar_glow','wayfarer_wind','guardian_aegis','crown_grace']);
    expect(astralBlessings.map(item => item.cost)).toEqual([3,3,5,8]);
  });

  it('requires matching trial history and enough star shards', () => {
    expect(resolveAstralBlessingPurchase({
      blessing:'scholar_glow', shards:9, purchased:[], trialKeys:[],
    }).reason).toBe('trial');
    expect(resolveAstralBlessingPurchase({
      blessing:'scholar_glow', shards:2, purchased:[], trialKeys:['1-1:scholar_trial'],
    }).reason).toBe('shards');
    expect(resolveAstralBlessingPurchase({
      blessing:'scholar_glow', shards:3, purchased:[], trialKeys:['1-1:scholar_trial'],
    })).toEqual(expect.objectContaining({ accepted:true, shards:0 }));
  });

  it('combines purchased blessing effects additively', () => {
    expect(astralBlessingEffects(['scholar_glow','wayfarer_wind','guardian_aegis','crown_grace'])).toEqual({
      trainingPercent:2,
      expeditionJourneyBonus:1,
      monthlyRecovery:2,
      monthlyJourneyBonus:3,
    });
  });
});
