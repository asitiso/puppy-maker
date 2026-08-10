import {describe,expect,it} from 'vitest';
import {sanctuaryLegacyRecommendation} from './sanctuary-legacy-steward';
describe('legacy steward',()=>{
 it('prioritizes collecting crossed rewards',()=>expect(sanctuaryLegacyRecommendation({claimableRewards:2,unclearedGuardians:1,affordableBoon:true,grandGap:3,ascensionGap:8,callingGap:2,riftGap:2})?.target).toBe('claim'));
 it('then points at the highest-impact reachable play target',()=>expect(sanctuaryLegacyRecommendation({claimableRewards:0,unclearedGuardians:1,affordableBoon:true,grandGap:3,ascensionGap:8,callingGap:2,riftGap:2})?.target).toBe('convergence'));
 it('uses near thresholds before broad mastery grinds',()=>expect(sanctuaryLegacyRecommendation({claimableRewards:0,unclearedGuardians:0,affordableBoon:false,grandGap:2,ascensionGap:8,callingGap:1,riftGap:1})?.target).toBe('sanctuary'));
});
