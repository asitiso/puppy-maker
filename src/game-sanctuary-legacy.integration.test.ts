import {describe,expect,it} from 'vitest';
import {hydrateGameState,initialState,reducer} from './game';

describe('sanctuary legacy reducer integration',()=>{
 it('hydrates old saves with safe legacy defaults and sanitizes malformed ids',()=>{
  const old=hydrateGameState({...initialState,sanctuaryLegacyPath:'unknown',claimedSanctuaryLegacyMilestones:['beacon','beacon','bogus']});
  expect(old.sanctuaryLegacyPath).toBe(null);
  expect(old.claimedSanctuaryLegacyMilestones).toEqual(['beacon']);
 });
 it('switches legacy paths freely without spending resources',()=>{
  const mentor=reducer(initialState,{type:'SELECT_SANCTUARY_LEGACY_PATH',path:'mentor'});
  const keeper=reducer(mentor,{type:'SELECT_SANCTUARY_LEGACY_PATH',path:'keeper'});
  expect(keeper.sanctuaryLegacyPath).toBe('keeper');
  expect(keeper.gold).toBe(initialState.gold); expect(keeper.gems).toBe(initialState.gems);
 });
 it('batch claims completed legacy rewards exactly once',()=>{
  const mature={...initialState,sanctuaryLegacyPath:'mentor' as const,claimedSanctuaryLegacyMilestones:[],purchasedGuardianBoons:['starlit_oath','astral_heart','wardens_grace','celestial_compass'] as any,celestialConvergenceRecords:{'ember_guardian:1':{grade:'S',bestPower:999,clearCount:1},'tide_guardian:1':{grade:'S',bestPower:999,clearCount:1},'gale_guardian:1':{grade:'S',bestPower:999,clearCount:1},'star_guardian:3':{grade:'S',bestPower:999,clearCount:1}} as any};
  const claimed=reducer(mature,{type:'CLAIM_SANCTUARY_LEGACY_REWARDS'});
  expect(claimed.claimedSanctuaryLegacyMilestones.length).toBeGreaterThan(0);
  expect(claimed.gold+claimed.gems).toBeGreaterThan(mature.gold+mature.gems);
  expect(reducer(claimed,{type:'CLAIM_SANCTUARY_LEGACY_REWARDS'})).toBe(claimed);
 });
});
