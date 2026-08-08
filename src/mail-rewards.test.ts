import { describe, expect, it } from 'vitest';
import { availableMail, mailDefinitions } from './mail-rewards';

describe('milestone mail rewards', () => {
  it('always exposes the welcome letter first', () => {
    expect(availableMail({ memories: [], visitedOutings: [], guardianRank: 'trainee' })).toEqual(['welcome']);
  });

  it('unlocks milestone letters from existing progress only', () => {
    expect(availableMail({ memories: ['first_training'], visitedOutings: [], guardianRank: 'trainee' })).toEqual(['welcome', 'first_training']);
    expect(availableMail({ memories: ['first_training'], visitedOutings: ['forest', 'village', 'lakeside'], guardianRank: 'guardian' })).toEqual([
      'welcome',
      'first_training',
      'explorer',
      'guardian_appointment',
    ]);
  });

  it('keeps mail rewards small and deterministic', () => {
    expect(mailDefinitions.find(item => item.id === 'welcome')?.reward).toEqual({ gold: 300, gems: 0 });
    expect(mailDefinitions.find(item => item.id === 'guardian_appointment')?.reward).toEqual({ gold: 0, gems: 2 });
  });
});
