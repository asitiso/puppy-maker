import {describe,expect,it} from 'vitest';
import {weeklyNpcPresence} from './living-npcs';

describe('V4 living NPC presence',()=>{
  it('keeps the active campaign representative visible while rotating shared NPCs',()=>{
    const ids=weeklyNpcPresence({activeCampaign:'caretaker',activeRoute:'normal',week:2,month:6,runNumber:1,inheritedFactCount:0});
    expect(ids[0]).toBe('mira');
    expect(ids).toContain('noa');
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeLessThanOrEqual(3);
  });

  it('centers Lyra in the True Path and Veyr in Hollow',()=>{
    expect(weeklyNpcPresence({activeCampaign:'true_path',activeRoute:'normal',week:1,month:5,runNumber:3,inheritedFactCount:2})[0]).toBe('lyra');
    expect(weeklyNpcPresence({activeCampaign:'arcanist',activeRoute:'hollow',week:1,month:5,runNumber:3,inheritedFactCount:2})[0]).toBe('veyr');
  });

  it('allows a returning-run Lyra echo without displacing the normal campaign representative',()=>{
    const ids=weeklyNpcPresence({activeCampaign:'vanguard',activeRoute:'normal',week:4,month:9,runNumber:2,inheritedFactCount:1});
    expect(ids[0]).toBe('rex');
    expect(ids).toContain('lyra');
  });
});
