import {describe,expect,it} from 'vitest';
import {claimableLegacyMilestones,completedLegacyMilestones,legacyRewardTotal} from './sanctuary-legacy-milestones';
const progress={score:86,convergenceGuardians:4,maxConvergenceIntensity:3,boons:8,celestialRank:true,ascension:80,callingMastery:4,riftClears:6,riftRelics:9};
describe('legacy milestones',()=>{
 it('completes all twelve for a mature endgame save',()=>expect(completedLegacyMilestones(progress)).toHaveLength(12));
 it('excludes claimed rewards and totals the remainder once',()=>{
  const all=claimableLegacyMilestones(progress,[]); expect(all).toHaveLength(12);
  const remaining=claimableLegacyMilestones(progress,[all[0].id,all[0].id]); expect(remaining).toHaveLength(11);
  expect(legacyRewardTotal(remaining).gold).toBeGreaterThan(0); expect(legacyRewardTotal(remaining).gems).toBeGreaterThan(0);
 });
});
